FROM python:3.7-buster

COPY requirements.txt /
RUN pip install --no-cache-dir --upgrade pip -i https://pypi.douban.com/simple \
    && pip install --no-cache-dir -r /requirements.txt -i https://pypi.douban.com/simple

WORKDIR /
COPY flag /
RUN chmod 400 /flag-p && \
    gcc readflag-p.c -o readflag-p && \
    rm readflag-p.c && \
    chmod 4755 readflag-p

RUN mkdir -p /crawler
WORKDIR /crawler
COPY crawler .

ENTRYPOINT ["/crawler/start.sh"]
