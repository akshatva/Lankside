#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_ROOT="${BACKUP_ROOT:-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$STAMP"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Set ENV_FILE or create .env.production." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Backing up PostgreSQL..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$BACKUP_DIR/postgres.sql"

echo "Backing up uploads..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend \
  tar -czf - -C /app/uploads . \
  > "$BACKUP_DIR/uploads.tar.gz"

echo "Backup written to $BACKUP_DIR"
