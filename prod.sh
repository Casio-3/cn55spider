#!/usr/bin/env bash

if hash docker-compose 2>/dev/null; then
  docker-compose down && docker-compose -f prod.yml up -d --build
else
  docker compose down && docker compose -f prod.yml up -d --build
fi
