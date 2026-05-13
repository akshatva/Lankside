# Demo Data

Phase 13 adds deterministic demo records for local walkthroughs and testing. The
demo records use fake IDs and generated dummy documents only.

Do not use real PAN, GST, Udyam, bank account, ITR, or personal identity data in
demo files or local tests.

## Demo User

- Email: `demo@lankside.local`
- Full name: `Demo User`

Demo reset is scoped to the known demo businesses under this user, related
generated records, and upload files prefixed with `demo_`. If other businesses
exist under the same local demo user, they are left in place.

## Demo Businesses

### Sharma Medical Distributors

- Industry: Medical Stockist
- State: Uttar Pradesh
- City: Raebareli
- Fake PAN: `DEMOA1234A`
- Fake GSTIN: `09DEMOA1234A1Z5`
- Fake Udyam: `UDYAM-UP-00-0000001`
- Scenario: mostly ready, minor issues

Purpose:

- Shows a near-ready distributor profile.
- Includes all core document metadata.
- Includes one low-severity owner-name abbreviation issue.
- Useful for dashboard, audit, LRI, grants, and report demos.

### Kaveri Textiles

- Industry: Textile Manufacturing
- State: Tamil Nadu
- City: Chennai
- Fake PAN: `DEMOB1234B`
- Fake GSTIN: `33DEMOB1234B1Z6`
- Fake Udyam: `UDYAM-TN-00-0000002`
- Scenario: cluster/MOU-ready, good Grant Scout fit for ZED/MSE-CDP

Purpose:

- Shows a manufacturing MSME with strong collaboration readiness.
- Includes a sample generated MOU with cluster purpose.
- Useful for MOU Architect, ZED Certification, MSE-CDP, LRI, and report demos.

### GreenPack Industries

- Industry: Packaging Manufacturing
- State: Maharashtra
- City: Pune
- Fake PAN: missing by design
- Fake GSTIN: `27DEMOC1234C1Z7`
- Fake Udyam: `UDYAM-MH-00-0000003`
- Scenario: incomplete documents, lower LRI, useful audit demo

Purpose:

- Shows missing PAN and ITR evidence.
- Includes a failed bank statement document status.
- Includes unresolved high and medium audit findings.
- Useful for demonstrating lower readiness, audit remediation, and LRI impact.

## Generated Demo Records

The seed flow creates or refreshes:

- Demo user and business profiles
- Dummy PDF files under the demo upload directory
- Document metadata rows
- Demo audit findings
- LRI scores
- Sample MOU for Kaveri Textiles
- Seeded Grant Scout schemes
- Stored Grant Scout matches
- Lightweight Bankability Report summary rows

The current schema does not include a separate extraction table. The demo summary
therefore counts completed demo document rows as the available extraction demo
signal.

## Commands

From the repository root:

```bash
python backend/scripts/seed_demo_data.py
python backend/scripts/reset_demo_data.py
```

Inside the backend Docker container:

```bash
python scripts/seed_demo_data.py
python scripts/reset_demo_data.py
```

API equivalents:

```bash
curl -X POST http://localhost:8000/api/v1/admin/seed-demo-data
curl http://localhost:8000/api/v1/admin/demo-summary
curl -X POST http://localhost:8000/api/v1/admin/reset-demo-data
```

Frontend:

- http://localhost:3000/admin

## Safety

The reset flow deletes only the three known Phase 13 demo businesses and
`demo_` upload files. It does not delete arbitrary users, businesses, uploaded
files, or production-like data.

Use only fake/demo files for local testing.
