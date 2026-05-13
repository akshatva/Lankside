from __future__ import annotations

from sqlalchemy.orm import Session

from app.crud.scheme import create_or_update_scheme
from app.schemas.scheme import SchemeCreate


MVP_SCHEMES = [
    SchemeCreate(
        code="PMEGP",
        name="Prime Minister's Employment Generation Programme",
        category="CREDIT / SUBSIDY",
        description=(
            "Credit-linked support for setting up micro enterprises through "
            "bank finance and eligible subsidy support."
        ),
        eligibility_summary=(
            "Best suited to new or early-stage micro and small enterprises "
            "across permitted manufacturing, service, and trading activities."
        ),
        benefits_summary=(
            "May support project finance through bank-linked credit and "
            "eligible subsidy assistance subject to scheme rules."
        ),
        state=None,
        industry_focus="general",
        source_url="https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
    ),
    SchemeCreate(
        code="MUDRA",
        name="Pradhan Mantri MUDRA Yojana",
        category="CREDIT",
        description=(
            "Loan support for non-corporate, non-farm micro and small "
            "business activities."
        ),
        eligibility_summary=(
            "Best suited to small traders, service units, stockists, shop "
            "owners, retailers, and other micro enterprises."
        ),
        benefits_summary=(
            "Useful for working capital, business loans, and small enterprise "
            "expansion through eligible lenders."
        ),
        state=None,
        industry_focus="general",
        source_url="https://www.mudra.org.in/",
    ),
    SchemeCreate(
        code="ZED_CERTIFICATION",
        name="MSME Sustainable ZED Certification",
        category="CERTIFICATION / SUBSIDY",
        description=(
            "Certification pathway for MSMEs improving quality, sustainability, "
            "productivity, and competitiveness."
        ),
        eligibility_summary=(
            "Best suited to manufacturing MSMEs seeking quality and process "
            "improvement recognition."
        ),
        benefits_summary=(
            "May support certification, process improvement, and "
            "competitiveness benefits subject to current guidelines."
        ),
        state=None,
        industry_focus="manufacturing",
        source_url="https://zed.msme.gov.in/",
    ),
    SchemeCreate(
        code="MSE_CDP",
        name="Micro and Small Enterprises Cluster Development Programme",
        category="CLUSTER_DEVELOPMENT",
        description=(
            "Cluster development support for groups of MSE units and common "
            "facility center initiatives."
        ),
        eligibility_summary=(
            "Best suited to MSMEs with collaboration potential, cluster "
            "participation, and shared infrastructure needs."
        ),
        benefits_summary=(
            "Useful for common facility centers, shared infrastructure, and "
            "cluster-level competitiveness."
        ),
        state=None,
        industry_focus="cluster",
        source_url="https://dcmsme.gov.in/schemes/mse-cdp.html",
    ),
    SchemeCreate(
        code="CGTMSE",
        name="Credit Guarantee Fund Trust for Micro and Small Enterprises",
        category="GUARANTEE",
        description=(
            "Credit guarantee support for eligible collateral-free credit "
            "facilities to micro and small enterprises."
        ),
        eligibility_summary=(
            "Best suited to MSMEs seeking collateral-free credit support "
            "through eligible lending institutions."
        ),
        benefits_summary=(
            "May reduce collateral barriers for eligible credit applications "
            "through guarantee cover."
        ),
        state=None,
        industry_focus="general",
        source_url="https://www.cgtmse.in/",
    ),
]


def seed_mvp_schemes(db: Session) -> dict[str, int]:
    inserted = 0
    updated = 0
    for scheme in MVP_SCHEMES:
        _, created = create_or_update_scheme(db, scheme)
        if created:
            inserted += 1
        else:
            updated += 1
    return {
        "inserted": inserted,
        "updated": updated,
        "total_seeded": len(MVP_SCHEMES),
    }
