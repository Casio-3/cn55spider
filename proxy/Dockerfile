FROM varnish:6.4.0

# Install packages and configure permissions
COPY ./sources.list /etc/apt/sources.list
RUN apt-get update\
    && apt-get install -y hitch procps supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && chown -R varnish:varnish /var/lib/varnish \
    && mkdir /etc/certs

# Setup config files
COPY config/hitch.conf /etc/hitch/hitch.conf
COPY config/varnish.vcl /etc/varnish/varnish.vcl
COPY config/supervisord.conf /etc/supervisor/supervisord.conf
COPY config/entrypoint.sh /entrypoint.sh

# Add server certs
COPY certs/ /etc/certs

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
