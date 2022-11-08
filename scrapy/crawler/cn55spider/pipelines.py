# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import pymongo
from scrapy.exceptions import DropItem


class Cn55SpiderPipeline:
    @classmethod
    def from_crawler(cls, crawler):
        cls.MONGODB_HOST = crawler.settings.get('MONGODB_HOST', 'mongodb')
        cls.MONGODB_PORT = crawler.settings.get('MONGODB_PORT', 27017)
        cls.MONGODB_USER = crawler.settings.get('MONGODB_USER', 'guest')
        cls.MONGODB_PASSWD = crawler.settings.get('MONGODB_PASSWD', 'casio')
        cls.MONGODB_DBNAME = crawler.settings.get('MONGODB_DBNAME', 'result')
        cls.MONGODB_TABLE = crawler.settings.get('MONGODB_TABLE', 'pages')
        return cls()

    def open_spider(self, spider):
        self.client = pymongo.MongoClient(
            host=self.MONGODB_HOST,
            port=self.MONGODB_PORT,
            username=self.MONGODB_USER,
            password=self.MONGODB_PASSWD,
            authSource=self.MONGODB_DBNAME
        )
        self.db = self.client[self.MONGODB_DBNAME]
        self.table = self.db[self.MONGODB_TABLE]

    def close_spider(self, spider):
        self.client.close()

    def process_item(self, item, spider):
        if item['text']:
            info = dict(item)
            self.table.insert_one(info)
            return item
        else:
            DropItem(f"Missing text in {item}")
