#!/usr/bin/env bash
set -euo pipefail

cat <<'INSTRUCTIONS'
Restore is intentionally manual to avoid accidental data loss.

Recommended flow:

1. Stop application services but keep postgres available:
   docker compose --env-file .env.production -f docker-compose.prod.yml stop nginx frontend backend worker
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d postgres redis

2. Restore PostgreSQL from a reviewed backup:
   cat backups/<timestamp>/postgres.sql | docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
     sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'

3. Restore uploads after confirming the target volume can be overwritten:
   cat backups/<timestamp>/uploads.tar.gz | docker compose --env-file .env.production -f docker-compose.prod.yml exec -T backend \
     tar -xzf - -C /app/uploads

4. Restart services:
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d

Always test restore on a non-production VM first.
INSTRUCTIONS
