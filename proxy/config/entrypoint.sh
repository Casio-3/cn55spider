#!/usr/bin/env sh

mkdir -p /etc/certs && cd /etc/certs/ && openssl req -newkey rsa:2048 -sha256 -nodes -x509 -days 365 \
    -subj "/CN=localhost/O=app/C=US" -keyout localhost.key -out localhost.crt \
    && cat localhost.key localhost.crt > localhost.pem
sed -i "s/TOKEN/$(base64 < /dev/urandom | fold -w 64 | tr '/+' '_-' | head -n 1)/" /etc/varnish/varnish.vcl
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf
