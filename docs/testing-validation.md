# Testing and Validation

Phase 14 stabilizes the Lankside MVP with automated tests, local smoke checks,
Docker validation, and demo workflow verification. The goal is confidence that
the demo flow works end to end without adding new product modules.

## Test Strategy

- Backend tests use FastAPI TestClient and an isolated SQLite database.
- Tests use fake/demo data only.
- External AI and vector services are disabled for tests.
- Tests cover route availability, safe error handling, deterministic fallback
  behavior, disclaimers, and demo reset safety.

## Backend Tests

Run from the repository root:

```bash
python -m compileall backend/app
cd backend && pytest
```

Coverage includes:

- Health and status routes
- Business create/list/read/update validation
- Document listing and upload validation
- Deterministic extraction fallback routes
- Audit listing and safe unknown-business handling
- LRI band logic and deterministic score calculation
- MOU fallback generation and legal-review disclaimer
- Grant Scout seeding, matching, and disclaimer
- Bankability Report safe errors and disclaimer
- Demo admin seed/reset/summary safety

## Frontend Checks

Run:

```bash
cd frontend && npm run build
```

Use `npm run type-check` for a TypeScript-only pass when dependencies are
installed.

## Docker Validation

Run:

```bash
docker compose config
docker compose up --build
```

Check that backend, frontend, postgres, redis, worker, upload storage, MOU PDF
output, and report PDF output remain configured.

## Smoke Testing

With the API running:

```bash
python backend/scripts/smoke_test_api.py
```

The smoke test checks:

- `/health`
- `/api/v1/health`
- `/api/v1/status`
- `/api/v1/businesses`
- `/api/v1/documents`
- `/api/v1/extractions`
- `/api/v1/audit`
- `/api/v1/grants/schemes`
- `/api/v1/reports`

## Demo Workflow Testing

With the API running:

```bash
python backend/scripts/validate_demo_workflow.py
```

The workflow validator:

- Seeds demo data idempotently
- Reads the demo summary
- Confirms the three demo businesses exist
- Verifies or calculates LRI
- Verifies or runs Grant Scout
- Verifies or generates Bankability Reports

## Known Limitations

- Tests do not start Docker containers automatically.
- Smoke and workflow scripts require the API to already be running.
- External Gemini and Pinecone calls are not required and are not used by the
  test suite.
- The extraction route used for validation is deterministic fallback behavior
  over stored document metadata; it does not perform external OCR.

## Debugging

- If backend tests fail on imports, run them from `backend/` with dependencies
  installed.
- If report or MOU PDF generation fails, confirm `reportlab` is installed and
  the configured output directories are writable.
- If smoke tests fail, confirm `docker compose up --build` is running and
  `LANKSIDE_BASE_URL` points to the backend URL.
- If frontend build fails, check `frontend/lib/api.ts` imports and the matching
  `frontend/types/*` definitions first.
