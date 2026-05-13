#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.production.example to $ENV_FILE and fill production values." >&2
  exit 1
fi

echo "Pulling base images where available..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull --ignore-buildable || true

echo "Building application images..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build

echo "Starting database and cache..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres redis

echo "Running Alembic migrations..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm backend alembic upgrade head

echo "Starting production services..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "Deployment complete. Check status with:"
echo "docker compose --env-file $ENV_FILE -f $COMPOSE_FILE ps"
