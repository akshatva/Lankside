# Compliance Auditor

## Purpose

The Compliance Auditor is a pre-submission readiness check for Indian MSME
profiles in Lankside. It compares the saved business profile, uploaded
mandatory documents, and available extraction results to identify mismatches,
missing evidence, and extraction quality issues before a user approaches a
lender, partner, or subsidy workflow.

This is not legal, tax, banking, or government certification. It is an internal
readiness signal for demo and product workflow purposes.

## Expected Data Flow

```text
business profile -> uploaded documents -> extraction results -> audit findings
```

1. A business profile is created from onboarding.
2. Mandatory MSME documents are uploaded for that business.
3. Extraction results become available for those documents.
4. The compliance audit runs for the business.
5. Fresh unresolved findings are written to `audit_findings`.
6. Users review and resolve findings from the frontend audit page.

## Mandatory MVP Documents

- `GST_CERTIFICATE`
- `UDYAM_CERTIFICATE`
- `PAN_CARD`
- `BANK_STATEMENT`
- `ITR_ACKNOWLEDGEMENT`

## Audit Checks

Missing document checks:

- GST certificate missing
- Udyam certificate missing
- PAN card missing
- Bank statement missing
- ITR acknowledgement missing

Business profile vs extracted document checks:

- Business name vs GST legal name or trade name
- Business name vs Udyam enterprise name
- Owner name vs Udyam owner name
- PAN vs PAN card PAN number
- PAN vs ITR PAN
- GSTIN vs GST certificate GSTIN
- Udyam ID vs Udyam certificate number

Cross-document checks:

- GST legal name vs Udyam enterprise name
- PAN card PAN number vs ITR PAN
- Bank account holder name vs business name or owner name
- Udyam state/district vs business state/city where available

Extraction quality checks:

- Extraction confidence below `0.60`
- Mandatory document with failed extraction status
- Mandatory document with missing extraction result

## Severity Rules

High severity:

- PAN mismatch
- GSTIN mismatch
- Missing PAN card
- Missing GST certificate
- Missing Udyam certificate
- Failed extraction for a mandatory document

Medium severity:

- Business name mismatch
- Owner/signatory mismatch
- Bank account holder mismatch
- Missing bank statement
- Missing ITR acknowledgement
- Low extraction confidence
- Missing extraction result for an uploaded mandatory document

Low severity:

- City/state mismatch
- Minor missing optional extracted field
- Formatting differences

## Limitations

- This audit is a pre-submission readiness check, not legal or banking
  certification.
- The current implementation uses straightforward normalization and simple name
  similarity, not ML-based identity verification.
- The auditor can only compare fields that are present in extraction results.
- If extraction results are unavailable, the audit records that as a readiness
  gap instead of attempting extraction.

## Demo Warning

Use dummy documents only for demos and local testing. Do not upload real PAN,
GST, bank, ITR, or other sensitive identity and financial documents into a demo
environment.
