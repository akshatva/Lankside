# Vercel Frontend Deployment

This guide deploys only the Next.js frontend to Vercel. The FastAPI backend,
database, Redis, and worker services remain external and must be deployed
separately.

## Prerequisites

- A GitHub repository containing this project.
- A public FastAPI backend URL, for example `https://api.example.com`.
- Backend CORS configured to allow the Vercel frontend domain.

## Local Frontend Check

```bash
cd frontend
cp .env.example .env.local
npm install
npm run build
```

`frontend/.env.example` contains:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For deployed environments, replace this value with the public backend origin.

## Push to GitHub

```bash
git status
git add .
git commit -m "Prepare frontend for Vercel deployment"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

If the remote already exists, skip `git remote add origin ...` or update it with
`git remote set-url origin https://github.com/<owner>/<repo>.git`.

## Create the Vercel Project

1. Open Vercel and choose Add New > Project.
2. Import the GitHub repository.
3. Configure the project with these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `frontend` |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | Leave default |

## Environment Variables

Add this environment variable in Vercel for Production, Preview, and Development
as needed:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

Use the public FastAPI backend origin only. Do not use Docker Compose service
names such as `backend`, and do not rely on `localhost` for Vercel deployments.

## Backend Notes

Deploy the FastAPI backend separately before using the production frontend.
Confirm these backend settings:

- The backend is reachable from the public internet over HTTPS.
- `BACKEND_CORS_ORIGINS` includes the Vercel frontend URL.
- File download endpoints are reachable from browser clients.
- Any database, Redis, worker, upload, and AI provider settings are configured
  in the backend deployment environment.

## Redeploying

After changing `NEXT_PUBLIC_API_URL`, trigger a new Vercel deployment. Next.js
inlines `NEXT_PUBLIC_*` values into the frontend build, so changing the variable
requires a rebuild.
