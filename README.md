# Lankside

Lankside is an AI-driven financial readiness SaaS platform for Indian MSMEs.
This repository contains the Docker-first foundation for the frontend, backend,
database, cache, background worker services, and MVP readiness workflows.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, Uvicorn
- Database: PostgreSQL
- Cache and broker: Redis
- Worker: Celery
- Local orchestration: Docker Compose

## Project Structure

```text
Lankside/
├── frontend/
├── backend/
├── docker-compose.yml
├── .env.example
├── README.md
└── docs/
```

## Setup

1. Copy the example environment file if you want local overrides:

```bash
cp .env.example .env
```

2. Start the full local stack:

```bash
docker compose up --build
```

For non-Docker backend development, set `DATABASE_URL` to the host PostgreSQL
port instead of the Compose hostname:

```bash
DATABASE_URL=postgresql://lankside:lankside_password@localhost:5432/lankside_db
```

3. Open the services:

- Frontend: http://localhost:3000
- Frontend dashboard: http://localhost:3000/dashboard
- Business onboarding: http://localhost:3000/onboarding
- Document upload: http://localhost:3000/documents
- Compliance auditor: http://localhost:3000/audit
- Lankside Readiness Index: http://localhost:3000/lri
- MOU Architect: http://localhost:3000/mou
- Grant Scout: http://localhost:3000/grants
- Bankability Reports: http://localhost:3000/reports
- Demo Admin: http://localhost:3000/admin
- Backend root health check: http://localhost:8000/health
- Backend API health check: http://localhost:8000/api/v1/health
- Backend API status: http://localhost:8000/api/v1/status

## Phase 2 Backend Routes

- Root health: http://localhost:8000/health
- API health: http://localhost:8000/api/v1/health
- API status: http://localhost:8000/api/v1/status

## Phase 8: Compliance Auditor

Phase 8 adds a compliance audit module for pre-submission MSME readiness checks.
The audit compares the business profile, uploaded mandatory documents, and
available extraction results, then stores actionable findings in
`audit_findings`.

Audit page:

- http://localhost:3000/audit

Audit API routes:

- `POST /api/v1/audit/{business_id}/run`
- `GET /api/v1/audit`
- `GET /api/v1/audit/{finding_id}`
- `PATCH /api/v1/audit/{finding_id}/resolve`
- `DELETE /api/v1/audit/{finding_id}`

The auditor depends on uploaded documents and extraction results. If mandatory
documents are missing, failed, or do not have extraction results available, the
audit creates findings for those readiness gaps.

## Phase 9: Lankside Readiness Index

Phase 9 adds the Lankside Readiness Index (LRI), a deterministic and explainable
internal readiness indicator for Indian MSMEs. LRI is not a formal credit score,
bank approval, legal certification, or government certification.

LRI page:

- http://localhost:3000/lri

Formula:

```text
LRI = (0.4 x D) + (0.3 x C) + (0.3 x F)
```

Where:

- `D` = Document Integrity Score
- `C` = Collaboration Readiness Score
- `F` = Financial Consistency Score

Score bands:

- `RED` for scores below 50: Not bank-ready
- `YELLOW` for scores from 50 to below 80: Needs improvement
- `GREEN` for scores from 80 to 100: Bankability ready

LRI API routes:

- `POST /api/v1/lri/{business_id}/calculate`
- `GET /api/v1/lri/{business_id}/latest`
- `GET /api/v1/lri/{business_id}/history`
- `GET /api/v1/lri/score/{score_id}`
- `DELETE /api/v1/lri/score/{score_id}`

## Phase 10: MOU Architect

Phase 10 adds AI-assisted MOU drafting support for documentation readiness. MSME
users can generate a structured collaboration MOU draft, edit the draft, store it
against a business profile, list prior drafts, export a PDF, and download the
generated PDF.

MOU page:

- http://localhost:3000/mou

MOU API routes:

- `POST /api/v1/mous/generate`
- `GET /api/v1/mous`
- `GET /api/v1/mous/{mou_id}`
- `PUT /api/v1/mous/{mou_id}`
- `POST /api/v1/mous/{mou_id}/export-pdf`
- `GET /api/v1/mous/{mou_id}/download`
- `DELETE /api/v1/mous/{mou_id}`

Legal disclaimer: MOU output is AI-assisted drafting support, not legal
certification. Generated drafts include: "This is an AI-assisted draft and
should be reviewed by a qualified legal professional before signing."

## Phase 11: Grant Scout

Phase 11 adds Grant Scout, a preliminary scheme-fit recommendation module for a
small seeded corpus of Indian MSME schemes. Matching is deterministic by
default and works without Pinecone or a vector database.

Grant Scout page:

- http://localhost:3000/grants

Seeded MVP schemes:

- PMEGP
- MUDRA
- ZED Certification
- MSE-CDP
- CGTMSE

Grant Scout API routes:

- `POST /api/v1/grants/seed-schemes`
- `GET /api/v1/grants/schemes`
- `GET /api/v1/grants/schemes/{scheme_id}`
- `POST /api/v1/grants/{business_id}/match`
- `GET /api/v1/grants/{business_id}/matches`
- `DELETE /api/v1/grants/{business_id}/matches`

Pinecone-backed retrieval is optional and controlled by
`GRANT_SCOUT_USE_VECTOR`. If Pinecone or Gemini credentials are missing, Grant
Scout safely falls back to deterministic rules.

Grant Scout results are preliminary scheme-fit recommendations based on
available business profile data and seeded scheme rules. Scheme eligibility
should be verified against official government guidelines before applying.

## Phase 12: Bankability Report Generator

Phase 12 adds informational Bankability Report generation. Reports summarize a
business profile, latest LRI result when available, open audit findings, and
stored Grant Scout matches into a downloadable PDF.

Reports page:

- http://localhost:3000/reports

Reports API routes:

- `POST /api/v1/reports/{business_id}/generate`
- `GET /api/v1/reports`
- `GET /api/v1/reports/{report_id}`
- `GET /api/v1/reports/{report_id}/download`
- `DELETE /api/v1/reports/{report_id}`

Report disclaimer: The Bankability Report is informational and not a formal
credit score, legal certification, loan approval, or government approval.

## Phase 13: Admin and Testing Data

Phase 13 adds deterministic demo data, admin/debug utilities, and local scripts
for demo walkthroughs. Demo data uses fake IDs only and should never include
real PAN, GST, Udyam, bank, ITR, or personal identity documents.

Demo Admin page:

- http://localhost:3000/admin

Admin API routes:

- `POST /api/v1/admin/seed-demo-data`
- `POST /api/v1/admin/reset-demo-data`
- `GET /api/v1/admin/demo-summary`

Demo seed/reset scripts:

```bash
python backend/scripts/seed_demo_data.py
python backend/scripts/reset_demo_data.py
```

Inside the backend Docker container:

```bash
python scripts/seed_demo_data.py
python scripts/reset_demo_data.py
```

Seeded demo businesses:

- Sharma Medical Distributors: mostly ready, minor issues
- Kaveri Textiles: cluster/MOU-ready and strong ZED/MSE-CDP fit
- GreenPack Industries: incomplete documents and lower LRI for audit demos

## Phase 14: Testing and Validation

Phase 14 adds backend route tests, API smoke tests, demo workflow validation,
frontend build checks, Docker Compose validation, and focused bug fixes for MVP
stability. These checks do not call external AI APIs and should use fake/demo
data only.

Validation commands:

```bash
docker compose config
python -m compileall backend/app
cd backend && pytest
cd frontend && npm run build
```

With the Docker stack running:

```bash
python backend/scripts/smoke_test_api.py
python backend/scripts/validate_demo_workflow.py
```

## GitHub and Vercel Frontend Deployment

The Next.js frontend can be deployed on Vercel from the `frontend/` directory.
The FastAPI backend remains external and should be deployed separately.

Push the repository to GitHub:

```bash
git status
git add .
git commit -m "Prepare frontend for Vercel deployment"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

In Vercel, import the GitHub repository and use these project settings:

- Framework preset: Next.js
- Root directory: `frontend`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default
- Environment variable: `NEXT_PUBLIC_API_URL=<public FastAPI backend origin>`

For local frontend development without Docker, copy the frontend env example:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the public URL of the separately deployed FastAPI
backend, for example `https://api.example.com`. Do not point the Vercel frontend
at Docker-only hostnames such as `backend` or internal Compose service names.

Key local URLs:

- Backend health: http://localhost:8000/health
- API health: http://localhost:8000/api/v1/health
- Frontend: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Demo Admin: http://localhost:3000/admin
- Reports: http://localhost:3000/reports

## Phase 15: Deployment & Productionization

Phase 15 adds a production-oriented Docker Compose path for a single VM/VPS
deployment. It keeps the local development flow in `docker-compose.yml` and adds
`docker-compose.prod.yml` for production-style serving behind Nginx.

Production architecture:

```text
Internet
  |
Nginx :80
  |-- /       -> Next.js frontend :3000
  |-- /api/*  -> FastAPI backend :8000
  |-- /health -> FastAPI backend health

Backend -> PostgreSQL, Redis, uploads volume
Worker  -> Redis broker, PostgreSQL, uploads volume
```

Production files:

- `docker-compose.prod.yml`
- `deployment/nginx/nginx.conf`
- `deployment/deploy.sh`
- `deployment/backup.sh`
- `deployment/restore.sh`
- `.env.production.example`
- `docs/deployment.md`

Production setup:

```bash
cp .env.production.example .env.production
# edit .env.production and replace all placeholders
./deployment/deploy.sh
```

Manual production commands:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend alembic upgrade head
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Safe production migration command:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend alembic upgrade head
```

Backup guidance:

```bash
./deployment/backup.sh
./deployment/restore.sh
```

Production notes:

- Backend production serving uses Gunicorn with Uvicorn workers.
- Frontend production serving uses `npm run build` and `npm run start`.
- Nginx is the only public entrypoint in the production compose file.
- PostgreSQL and Redis are not published to the host in production.
- Uploads, MOU PDFs, and report PDFs persist in the `uploads_data` Docker
  volume mounted at `/app/uploads`.
- PostgreSQL persists in the `postgres_data` Docker volume.
- Use Nginx + Certbot, Cloudflare proxy, or another TLS-terminating reverse
  proxy for HTTPS.
- Do not commit real secrets. Inject production secrets through
  `.env.production` or a secure host-level secret mechanism.

Troubleshooting:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f worker
```

Final deployment verification checklist:

- Frontend is reachable through Nginx.
- Backend `/health` and `/api/v1/health` are reachable through Nginx.
- Business onboarding and document uploads work.
- MOU PDF export works and survives container restart.
- Bankability Report generation/download works and survives container restart.
- PostgreSQL data persists after `docker compose restart`.
- Upload files persist after `docker compose restart`.

## Environment

The Compose stack uses service names as internal hostnames:

- `postgres` for PostgreSQL
- `redis` for Redis
- `backend` for the FastAPI service
- `frontend` for the Next.js service

The current MVP does not include authentication, payment/subscription flows,
real bank integration, or government submission. Use dummy documents only for
demos and local testing.
