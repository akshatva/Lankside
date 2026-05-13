# MOU Architect

## Purpose

The MOU Architect provides AI-assisted MOU drafting support for documentation
readiness. It helps an MSME prepare a collaboration draft using structured
inputs and an existing business profile.

It does not provide legal certification and does not make the draft legally
verified.

## User Flow

1. Create or select a business profile.
2. Enter party names, collaboration purpose, duration, contribution details,
   revenue sharing, dispute resolution, and cluster purpose.
3. Generate an MOU draft.
4. Review and edit the generated `draft_text`.
5. Save changes.
6. Export the current draft as a PDF.
7. Download the generated PDF from the MOU history table.

## Generated Sections

The draft includes these sections:

1. Title
2. Parties
3. Background
4. Purpose of Collaboration
5. Scope of Work
6. Contributions and Responsibilities
7. Revenue Sharing or Commercial Terms
8. Duration and Termination
9. Confidentiality
10. Dispute Resolution
11. Cluster Development / MSME Collaboration Clause
12. Non-binding / Nature Note
13. Review Disclaimer
14. Signature Blocks

## AI and Fallback Generation Flow

The backend loads the related business profile and accepts structured MOU
inputs. If `GEMINI_API_KEY` is configured, the service attempts to use Gemini
with `GEMINI_MODEL`.

The prompt instructs Gemini to:

- Avoid legal overclaiming.
- Avoid calling the MOU legally verified.
- Include the required review disclaimer.
- Use only provided business and party details.
- Avoid hallucinating registration numbers, IDs, or unsupported details.

If Gemini is unavailable, not installed, or fails, the backend uses a
deterministic template fallback. The fallback includes all required sections,
party names, business name, purpose, duration, contribution details, revenue
sharing, dispute resolution, cluster purpose, legal review disclaimer, and
signature blocks.

## PDF Export Flow

`POST /api/v1/mous/{mou_id}/export-pdf` generates a readable PDF from the
current `draft_text` using ReportLab. The PDF is stored under `MOU_PDF_DIR`,
defaulting to `/app/uploads/mous`, and the MOU row is updated with `pdf_path`
and status `EXPORTED`.

`GET /api/v1/mous/{mou_id}/download` returns the generated PDF if it exists.

## Legal Disclaimer

Every generated draft and the frontend MOU page include this disclaimer:

> This is an AI-assisted draft and should be reviewed by a qualified legal professional before signing.

## Limitation

This module is not a substitute for professional legal review. It is a drafting
and documentation readiness aid only.
