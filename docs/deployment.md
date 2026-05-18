# Deployment

## Architecture

Lankside production deployment targets a single VM/VPS using Docker Compose:

```text
User Browser
    |
    v
Nginx reverse proxy, public port 80
    |-- /       -> frontend container, Next.js on port 3000
    |-- /api/*  -> backend container, FastAPI on port 8000
    |-- /health -> backend container

Backend container
    |-- PostgreSQL for persistent relational data
    |-- Redis for Celery broker/result backend
    |-- uploads_data volume for uploaded files, MOU PDFs, and reports

Worker container
    |-- Celery worker using the same backend image
```

No Kubernetes, Terraform, cloud-specific IaC, authentication, payment flow, real
banking integration, or government submission is included in this phase.

## Compatible VPS Hosts

The production compose file is designed for a basic Linux VM:

- Ubuntu VPS
- DigitalOcean Droplet
- Hetzner VPS
- AWS EC2
- Azure VM
- GCP VM

Recommended minimum starting point for demos:

- 2 vCPU
- 4 GB RAM
- 40 GB disk
- Ubuntu 22.04 or 24.04 LTS

## Docker Install

On Ubuntu, install Docker Engine and the Compose plugin using Docker's official
instructions. A typical setup is:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
# Follow Docker's official repository setup for your Ubuntu version.
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in after adding your user to the `docker` group.

## Environment Setup

Create production env values on the server:

```bash
cp .env.production.example .env.production
nano .env.production
```

Production variables to review:

- `PROJECT_NAME`
- `ENVIRONMENT=production`
- `DATABASE_URL`
- `REDIS_URL`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `BACKEND_CORS_ORIGINS`
- `BACKEND_API_URL`
- `NEXT_PUBLIC_API_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `PINECONE_ENVIRONMENT`
- `GRANT_SCOUT_USE_VECTOR`
- `UPLOAD_DIR`
- `MOU_PDF_DIR`
- `REPORT_OUTPUT_DIR`
- `MAX_UPLOAD_SIZE_MB`
- `PYTHONUNBUFFERED`

Never commit real production secrets. Use strong database passwords and inject
keys through `.env.production` or a secure host-level secret mechanism.

The frontend browser calls `/api/backend` on the same origin. Set
`BACKEND_API_URL` to the backend origin that the Next.js server can reach. In
Docker Compose this is `http://backend:8000`; on Vercel or another separate
frontend host this should be the public FastAPI origin, for example
`https://api.example.com`. Keep `NEXT_PUBLIC_API_URL=/api/backend` unless you
intentionally bypass the proxy.

## Production Startup

Recommended:

```bash
./deployment/deploy.sh
```

Manual equivalent:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d postgres redis
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend alembic upgrade head
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Safe migration command:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

## Reverse Proxy

Nginx is configured in `deployment/nginx/nginx.conf`.

Routes:

- `/` proxies to the Next.js frontend on port `3000`.
- `/api/` proxies to the FastAPI backend on port `8000`.
- `/health` proxies to backend root health.
- `/nginx-health` returns a lightweight Nginx-only health response.

The proxy supports large uploads through `client_max_body_size 25m` and includes
websocket upgrade headers for future compatibility.

## HTTPS Options

This phase does not automate SSL. Recommended production options:

- Nginx + Certbot on the VM
- Cloudflare proxy in front of the VM
- A managed reverse proxy or load balancer that terminates TLS before Nginx

When HTTPS is enabled, set `BACKEND_CORS_ORIGINS` and any public API/frontend
origins to the HTTPS domain.

## Persistent Storage

Production compose volumes:

- `postgres_data`: PostgreSQL data
- `redis_data`: Redis append-only data
- `uploads_data`: uploaded documents, MOU PDFs, and Bankability Report PDFs

Container paths:

- Uploads: `/app/uploads`
- MOU PDFs: `/app/uploads/mous`
- Reports: `/app/uploads/reports`

Do not store uploads only inside ephemeral containers.

## Backup Strategy

Run:

```bash
./deployment/backup.sh
```

The script writes:

- PostgreSQL dump: `backups/<timestamp>/postgres.sql`
- Uploads archive: `backups/<timestamp>/uploads.tar.gz`

Store backups outside the VM as well. Test restore on a non-production VM before
trusting the process.

Restore instructions are intentionally manual:

```bash
./deployment/restore.sh
```

## Logging

Use Docker logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f worker
```

Backend and worker logs write to stdout/stderr. Nginx access and error logs are
available through the Nginx container logs.

## Security Basics

- Do not expose PostgreSQL publicly.
- Do not expose Redis publicly.
- Use strong production passwords.
- Disable reload/debug serving in production.
- Do not commit `.env.production` or real secrets.
- Keep uploads controlled through backend routes and do not publish the uploads
  volume directly from Nginx.
- Restrict SSH access to trusted keys and users.
- Keep the VM patched.

## Scaling Notes

This deployment is intended for one VM. Simple next steps:

- Increase `BACKEND_WORKERS` for more API worker processes.
- Increase VM CPU/RAM before splitting services.
- Move PostgreSQL backups to managed object storage.
- Add a managed TLS/load-balancer layer when traffic increases.

Do not add Kubernetes or cloud-specific IaC for this phase.

## Troubleshooting

Validate compose files:

```bash
docker compose config
docker compose -f docker-compose.prod.yml config
```

Check status:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Restart one service:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart backend
```

Rebuild after code changes:

```bash
./deployment/deploy.sh
```

## Final Verification Checklist

- Frontend reachable at the public domain or VM IP.
- Backend reachable at `/health` and `/api/v1/health`.
- Business onboarding works.
- Document uploads work.
- MOU PDF export works.
- Bankability Report generation and download work.
- PostgreSQL data survives `docker compose restart`.
- Uploaded files survive `docker compose restart`.
- Nginx, backend, and worker logs are visible through Docker logs.
