# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class Cn55Item(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    entry = scrapy.Field()
    url = scrapy.Field()
    text = scrapy.Field()
    role = scrapy.Field()
    username = scrapy.Field()
    session_id = scrapy.Field()
    create_time = scrapy.Field()
    pass
