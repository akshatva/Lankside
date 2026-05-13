# Bankability Report Generator

## Purpose

The Bankability Report Generator creates an informational PDF summary for an
MSME business profile. It consolidates existing Lankside readiness signals into
a document that can be reviewed internally before external financing or scheme
readiness discussions.

It does not provide loan approval, a formal credit score, legal certification,
or government approval.

## Report Sections

The generated PDF includes:

1. Report title
2. Business name
3. Disclaimer
4. Executive summary
5. LRI score and LRI band when available
6. Audit finding counts
7. High-severity audit finding count
8. Top stored Grant Scout match when available
9. Recommendation
10. Limitations

## Data Sources Used

The report uses data already stored in the local Lankside workflow:

- Business profile
- Latest Lankside Readiness Index score, if calculated
- Open compliance audit findings
- Stored Grant Scout matches, if matching has been run

The report does not connect to banks, credit bureaus, government portals, or
live scheme submission systems.

## PDF Generation Flow

1. `POST /api/v1/reports/{business_id}/generate` validates the business profile.
2. The backend gathers latest LRI, audit findings, and stored grant matches.
3. A report summary is stored in `bankability_reports`.
4. ReportLab generates a readable PDF.
5. The generated PDF path is saved with the report row.
6. `GET /api/v1/reports/{report_id}/download` returns the generated PDF.

Reports are stored under `REPORT_OUTPUT_DIR`, defaulting to
`/app/uploads/reports`.

## Limitations

- The report is informational only.
- LRI is not a formal credit score.
- Grant Scout matches are preliminary and must be verified against official
  scheme guidelines.
- Audit findings depend on uploaded demo workflow data.
- The report does not represent bank, lender, legal, or government approval.

## Disclaimer

The Bankability Report is informational and not a formal credit score, legal
certification, loan approval, or government approval.

## Demo Data Note

Use dummy data for demos and local testing. Do not use real PAN, GST, bank
statement, ITR, or other sensitive business data in this local MVP workflow.
