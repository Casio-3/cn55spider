from scrapy import cmdline, Spider, Request
import re
import base64


class ExampleSpider(Spider):
    name = 'example'
    start_urls = ['https://cnss.io/']

    def start_requests(self):
        for url in self.start_urls:
            yield Request(url, meta={
                'handle_httpstatus_all': True,
                'download_timeout': 30,
                'download_maxsize': 3 * 1024 * 1024,
                'dont_retry': True
            }, callback=self.parse)

    def parse(self, response):
        from cn55spider.items import Cn55Item
        cn55_item = Cn55Item()
        cn55_item['entry'] = response.request.url
        links = []
        hrefs = response.xpath('//a/@href').getall()
        for href in hrefs:
            if href[0] == '/':
                url = response.request.url + href[1:]
            else:
                url = href
            if re.search(r'://', url):
                r = Request(url, meta={
                    'download_timeout': 3,
                    'download_maxsize': 3 * 1024 * 1024,
                    'dont_retry': True
                }, callback=self.parse_link, dont_filter=True)
                r.meta['item'] = cn55_item
                yield r
            links.append(url)
            if len(links) > 3:
                break
        cn55_item['url'] = response.request.url
        cn55_item['text'] = base64.b64encode(response.text.encode('utf-8'))
        yield cn55_item

    def parse_link(self, response):
        item = response.meta['item']
        item['url'] = response.request.url
        item['text'] = base64.b64encode(response.text.encode('utf-8'))
        yield item


if __name__ == "__main__":
    cmdline.execute("scrapy crawl example".split())
