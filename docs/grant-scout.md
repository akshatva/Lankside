# Grant Scout

Grant Scout matches a Lankside business profile against a small seeded corpus of
Indian MSME schemes and returns ranked, explainable recommendations.

Results are preliminary and must be verified against official scheme guidelines.
Grant Scout does not guarantee eligibility, grant approval, credit approval, or
government certification.

## Seeded Schemes

- PMEGP: credit-linked subsidy fit for new or early-stage micro and small
  enterprises.
- MUDRA: credit fit for micro and small businesses such as traders, service
  units, shop owners, and retailers.
- ZED Certification: certification and subsidy fit for manufacturing MSMEs
  focused on quality and process improvement.
- MSE-CDP: cluster development fit for groups of MSMEs with collaboration or
  shared infrastructure potential.
- CGTMSE: guarantee support fit for MSMEs seeking collateral-free credit support.

## Matching Logic

Each active scheme starts with a base score of 40. Grant Scout then adds profile
completeness points, scheme-specific boosts, optional vector retrieval boosts,
and penalties. Scores are clamped between 0 and 100.

Recommendation status:

- Strong fit: 80 to 100
- Moderate fit: 50 to 79
- Weak fit: below 50

## General Profile Rules

Additions:

- 10 points if `industry_type` exists
- 5 points if `state` exists
- 5 points if `city` exists
- 5 points if `turnover_range` exists
- 5 points if `business_age_years` exists

Penalties:

- 10 points if the business profile is very incomplete
- 10 points if unresolved HIGH audit findings exist
- 5 points if latest LRI band is RED

## Scheme-Specific Rules

PMEGP:

- 15 points if `business_age_years` is 0, 1, or missing
- 10 points if industry suggests manufacturing, service, or trading
- 5 points if turnover suggests micro or small scale

MUDRA:

- 15 points if industry suggests trader, stockist, distributor, service, shop,
  or retail
- 10 points if turnover suggests micro or small scale
- 5 points if business age exists

ZED Certification:

- 25 points if industry suggests manufacturing, textile, industrial,
  production, or factory work
- 10 points if GST certificate is uploaded
- 5 points if latest LRI exists and is at least 50

MSE-CDP:

- 20 points if at least one MOU exists
- 15 points if any MOU has `cluster_purpose`
- 10 points if industry suggests manufacturing, textile, or industrial activity
- 5 points if both city and state exist

CGTMSE:

- 15 points if GSTIN or Udyam ID exists
- 10 points if latest LRI exists and is at least 50
- 10 points if no unresolved HIGH audit findings exist
- 5 points if bank statement is uploaded

## Optional Vector/RAG Design

Grant Scout includes an optional vector retrieval layer. It initializes only
when all of the following are true:

- `GRANT_SCOUT_USE_VECTOR=true`
- `PINECONE_API_KEY` is present
- `PINECONE_INDEX_NAME` is present
- `GEMINI_API_KEY` is present

When enabled, the service can index scheme metadata and retrieve related schemes
from Pinecone using Gemini embeddings. Retrieved schemes may receive a small
score boost. If any dependency, key, or index is unavailable, vector search
returns no results and deterministic matching continues.

## Fallback Mode

Fallback matching is the MVP path. It uses only local database records:

- Business profile
- Uploaded document types
- Latest LRI score if available
- Unresolved audit findings
- MOU records and cluster purpose
- Seeded scheme metadata

No Pinecone or Gemini key is required for fallback mode.

## Disclaimer

Preliminary scheme-fit recommendations based on available business profile and
seeded scheme rules. Scheme eligibility should be verified against official
government guidelines before applying.
