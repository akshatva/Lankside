from __future__ import annotations

import logging
from typing import Any, Iterable

from app.core.config import settings
from app.models.scheme import Scheme

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-004"


def index_schemes_if_available(schemes: Iterable[Scheme] | None = None) -> bool:
    if not _vector_enabled():
        return False
    if schemes is None:
        logger.info("Grant Scout vector indexing skipped because no schemes were provided.")
        return False

    index = _pinecone_index()
    if index is None:
        return False

    vectors = []
    for scheme in schemes:
        embedding = _embed_text(_scheme_text(scheme))
        if not embedding:
            continue
        vectors.append(
            {
                "id": str(scheme.id),
                "values": embedding,
                "metadata": {
                    "scheme_id": scheme.id,
                    "code": scheme.code,
                    "name": scheme.name,
                    "category": scheme.category,
                },
            },
        )

    if not vectors:
        return False

    try:
        index.upsert(vectors=vectors)
        return True
    except Exception:
        logger.exception("Grant Scout vector scheme indexing failed.")
        return False


def search_schemes(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    if not _vector_enabled():
        return []
    index = _pinecone_index()
    if index is None:
        return []
    embedding = _embed_text(query)
    if not embedding:
        return []

    try:
        result = index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True,
        )
    except Exception:
        logger.exception("Grant Scout vector search failed.")
        return []

    matches = getattr(result, "matches", None) or []
    normalized_matches: list[dict[str, Any]] = []
    for match in matches:
        metadata = getattr(match, "metadata", {}) or {}
        normalized_matches.append(
            {
                "scheme_id": metadata.get("scheme_id"),
                "code": metadata.get("code"),
                "score": float(getattr(match, "score", 0) or 0),
            },
        )
    return normalized_matches


def _vector_enabled() -> bool:
    return (
        settings.grant_scout_use_vector
        and bool(settings.pinecone_api_key)
        and bool(settings.pinecone_index_name)
        and bool(settings.gemini_api_key)
    )


def _pinecone_index() -> Any | None:
    try:
        from pinecone import Pinecone
    except Exception:
        logger.info("Pinecone package is unavailable; Grant Scout will use fallback matching.")
        return None

    try:
        client = Pinecone(api_key=settings.pinecone_api_key)
        return client.Index(settings.pinecone_index_name)
    except Exception:
        logger.exception("Unable to initialize Pinecone index for Grant Scout.")
        return None


def _embed_text(text: str) -> list[float] | None:
    try:
        from google import genai
    except Exception:
        logger.info("google-genai package is unavailable; Grant Scout will use fallback matching.")
        return None

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        embedding = getattr(response, "embeddings", None)
        if embedding:
            values = getattr(embedding[0], "values", None)
            return list(values) if values else None
        single_embedding = getattr(response, "embedding", None)
        values = getattr(single_embedding, "values", None)
        return list(values) if values else None
    except Exception:
        logger.exception("Unable to generate Grant Scout embedding.")
        return None


def _scheme_text(scheme: Scheme) -> str:
    return " ".join(
        [
            scheme.name,
            scheme.category,
            scheme.description,
            scheme.eligibility_summary,
            scheme.benefits_summary,
            scheme.industry_focus,
            scheme.state or "national",
        ],
    )
