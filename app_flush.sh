#!/usr/bin/env bash

if hash docker-compose 2>/dev/null; then
  docker-compose exec app pm2 flush
else
  docker compose exec app pm2 flush
fi
