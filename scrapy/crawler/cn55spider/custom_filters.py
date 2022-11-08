from scrapy.dupefilters import RFPDupeFilter
from scrapy_redis.dupefilter import RFPDupeFilter as redisRFPDupeFilter


class URLSetFilter(RFPDupeFilter):
    """A dupe filter that considers the URL"""

    def __init__(self, path=None):
        self.urls_seen = set()
        RFPDupeFilter.__init__(self, path)

    def request_seen(self, request):
        if request.url in self.urls_seen:
            return True
        else:
            self.urls_seen.add(request.url)


class URLRedisFilter(redisRFPDupeFilter):
    def request_seen(self, request):
        fp = request.url
        # This returns the number of values added, zero if already exists.
        added = self.server.sadd(self.key, fp)
        return added == 0
