#!/bin/bash
cat >>/crawler/cn55spider/settings.py <<'EOF'
DOWNLOAD_TIMEOUT = 8
RETRY_ENABLED = False
# SCHEDULER_PERSIST = True
SCHEDULER = "scrapy_redis.scheduler.Scheduler"
DUPEFILTER_CLASS = "cn55spider.custom_filters.URLRedisFilter"
REDIS_HOST = 'redis'
REDIS_PORT = 6379
REDIS_PARAMS = {'password': 'sTrOnG_R3D1s_p@s5woRd_HeRE', }
FLAG_HERE = "/flag-l"

EOF

if id -u cnss >/dev/null 2>&1 ; then
    echo ""
else
    useradd cnss
fi

cd /crawler && su cnss -c 'scrapy crawl recruit'
