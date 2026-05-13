from __future__ import annotations

import logging
from textwrap import dedent

from sqlalchemy.orm import Session

from app.crud.business import get_business
from app.models.business import Business
from app.schemas.mou import MOUGenerateRequest

logger = logging.getLogger(__name__)

LEGAL_REVIEW_DISCLAIMER = (
    "This is an AI-assisted draft and should be reviewed by a qualified legal "
    "professional before signing."
)
MOU_POSITIONING_NOTE = (
    "AI-assisted MOU drafting support for documentation readiness."
)


def generate_mou_draft(db: Session, mou_input: MOUGenerateRequest) -> str:
    business = get_business(db, mou_input.business_id)
    if business is None:
        raise ValueError("Business profile not found.")

    ai_draft = _generate_with_gemini(business, mou_input)
    if ai_draft:
        return _ensure_required_disclaimer(ai_draft)

    return generate_template_mou(business, mou_input)


def _generate_with_gemini(
    business: Business,
    mou_input: MOUGenerateRequest,
) -> str | None:
    from app.core.config import settings

    if not settings.gemini_api_key:
        return None

    try:
        import google.generativeai as genai  # type: ignore[import-not-found]
    except ImportError:
        logger.warning("Gemini API key is configured but google-generativeai is not installed.")
        return None

    prompt = _build_gemini_prompt(business, mou_input)
    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content(prompt)
        draft_text = getattr(response, "text", None)
        if isinstance(draft_text, str) and draft_text.strip():
            return draft_text.strip()
    except Exception:
        logger.exception("Gemini MOU generation failed; using deterministic fallback.")

    return None


def _build_gemini_prompt(business: Business, mou_input: MOUGenerateRequest) -> str:
    return dedent(
        f"""
        Generate a professional Memorandum of Understanding draft in clean
        markdown/plain text for an Indian MSME collaboration workflow.

        Positioning: {MOU_POSITIONING_NOTE}

        Required legal positioning:
        - Do not claim legal certification.
        - Do not call the MOU legally verified.
        - Do not say banks or government bodies recognize this MOU.
        - Include this exact disclaimer: {LEGAL_REVIEW_DISCLAIMER}
        - Do not hallucinate registration numbers, IDs, addresses, or licenses.
        - Use only the provided business and party details.

        Business profile:
        - Business name: {business.business_name}
        - Owner name: {business.owner_name}
        - Industry: {business.industry_type or "Not provided"}
        - City: {business.city or "Not provided"}
        - State: {business.state or "Not provided"}

        MOU inputs:
        - Party A: {mou_input.party_a_name}
        - Party B: {mou_input.party_b_name}
        - Purpose: {mou_input.purpose}
        - Duration in months: {mou_input.duration_months}
        - Contribution details: {mou_input.contribution_details}
        - Revenue sharing or commercial terms: {mou_input.revenue_sharing}
        - Dispute resolution: {mou_input.dispute_resolution}
        - Cluster purpose: {mou_input.cluster_purpose}

        Required sections:
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
        """
    ).strip()


def generate_template_mou(business: Business, mou_input: MOUGenerateRequest) -> str:
    return dedent(
        f"""
        # Memorandum of Understanding

        ## 1. Title
        Memorandum of Understanding between {mou_input.party_a_name} and {mou_input.party_b_name}

        ## 2. Parties
        This Memorandum of Understanding ("MOU") is prepared between {mou_input.party_a_name} ("Party A") and {mou_input.party_b_name} ("Party B").

        Party A is associated with the MSME profile for {business.business_name}. The available profile details indicate owner/contact person {business.owner_name}, industry {business.industry_type or "not provided"}, and location {", ".join(part for part in [business.city, business.state] if part) or "not provided"}.

        ## 3. Background
        The parties intend to explore a business collaboration that supports MSME documentation readiness, operational coordination, and commercial clarity. This draft is prepared as {MOU_POSITIONING_NOTE}

        ## 4. Purpose of Collaboration
        The purpose of this collaboration is: {mou_input.purpose}

        ## 5. Scope of Work
        The parties may coordinate activities, resources, communication, and execution steps required for the stated collaboration purpose. The scope should be reviewed and refined by both parties before signing.

        ## 6. Contributions and Responsibilities
        The proposed contributions and responsibilities are: {mou_input.contribution_details}

        Each party should maintain appropriate records of its commitments, delivery responsibilities, timelines, and communication related to the collaboration.

        ## 7. Revenue Sharing or Commercial Terms
        The proposed revenue sharing or commercial terms are: {mou_input.revenue_sharing}

        Any taxes, invoices, payment timelines, deductions, or statutory obligations should be separately reviewed and documented by the parties.

        ## 8. Duration and Termination
        The proposed duration of this MOU is {mou_input.duration_months} months from the effective date agreed by the parties.

        Either party may request termination or revision of this arrangement by giving prior written notice. The notice period and surviving obligations should be confirmed before signing.

        ## 9. Confidentiality
        The parties should keep non-public business, pricing, customer, supplier, financial, operational, and documentation information confidential unless disclosure is required by law or mutually agreed in writing.

        ## 10. Dispute Resolution
        The proposed dispute resolution approach is: {mou_input.dispute_resolution}

        The parties should obtain professional advice on the enforceability and suitability of this clause before signing.

        ## 11. Cluster Development / MSME Collaboration Clause
        The collaboration may support the following cluster or MSME development purpose: {mou_input.cluster_purpose}

        This clause is intended to describe the business collaboration objective and does not certify eligibility for any scheme, bank facility, government recognition, or legal status.

        ## 12. Non-binding / Nature Note
        This MOU draft records the parties' current understanding for collaboration discussions. Unless the parties expressly agree otherwise in a separately reviewed and signed document, this draft should be treated as a non-binding discussion document and not as legal certification.

        ## 13. Review Disclaimer
        {LEGAL_REVIEW_DISCLAIMER}

        ## 14. Signature Blocks
        For {mou_input.party_a_name}

        Name:

        Designation:

        Signature:

        Date:

        For {mou_input.party_b_name}

        Name:

        Designation:

        Signature:

        Date:
        """
    ).strip()


def _ensure_required_disclaimer(draft_text: str) -> str:
    if LEGAL_REVIEW_DISCLAIMER in draft_text:
        return draft_text
    return f"{draft_text.rstrip()}\n\n## Review Disclaimer\n{LEGAL_REVIEW_DISCLAIMER}"
