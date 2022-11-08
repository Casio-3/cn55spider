from scrapy import cmdline, Request, FormRequest
import re
import base64
import json
from scrapy_redis.spiders import RedisSpider
from scrapy_redis.utils import bytes_to_str, is_dict


class RecruitSpider(RedisSpider):
    name = 'recruit'
    # allowed_domains = ['cnss.io']
    # start_urls = ['https://cnss.io/']
    redis_key = 'recruit:start_urls'

    def make_request_from_data(self, data):
        formatted_data = bytes_to_str(data, self.redis_encoding)

        if is_dict(formatted_data):
            parameter = json.loads(formatted_data)
        else:
            self.logger.warning(f"WARNING: String request is unintended, I use JSON data format.")
            return []

        if parameter.get('url', None) is None:
            self.logger.warning(f"WARNING: Url not specified in request.")
            return []
        if parameter.get('meta', None) is None:
            self.logger.warning(f"WARNING: Metadata forcefully enabled, drop request.")
            return []

        url = parameter.pop("url")
        method = parameter.pop("method").upper() if "method" in parameter else "GET"
        metadata = parameter.pop("meta") if "meta" in parameter else {}
        metadata['entry'] = url

        return FormRequest(url, dont_filter=True, method=method, formdata=parameter, meta=metadata)

    def parse(self, response):
        from cn55spider.items import Cn55Item
        cn55_item = Cn55Item()
        metadata = response.meta
        cn55_item['entry'] = metadata['entry']
        cn55_item['role'] = metadata['role']
        cn55_item['username'] = metadata['username']
        cn55_item['session_id'] = metadata['session_id']
        cn55_item['create_time'] = metadata['create_time']
        url_list = []
        hrefs = response.xpath('//a/@href').getall()
        for href in hrefs:
            if href[0] == '/':
                url = response.request.url + href
            else:
                url = href
            if re.search(r'://', url):
                r = Request(url, meta={
                    'item': cn55_item,
                    'download_timeout': 3,
                    'download_maxsize': 3 * 1024 * 1024,
                }, callback=self.parse_link, dont_filter=True)
                yield r
            url_list.append(url)
            if len(url_list) > 3:
                break
        cn55_item['url'] = response.request.url
        cn55_item['text'] = response.text.encode('utf-8')
        yield cn55_item

    def parse_link(self, response):
        item = response.meta['item']
        item['url'] = response.request.url
        item['text'] = response.text.encode('utf-8')
        yield item


if __name__ == "__main__":
    cmdline.execute("scrapy crawl recruit".split())
