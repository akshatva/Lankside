from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    normalized = str(value).strip().casefold()
    normalized = re.sub(r"[\s\-_./,;:()]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def normalize_name(value: Any) -> str:
    normalized = normalize_text(value)
    normalized = re.sub(r"[^a-z0-9 ]+", "", normalized)
    normalized = re.sub(
        r"\b(private limited|pvt ltd|pvt|limited|ltd|llp|inc|company|co)\b",
        "",
        normalized,
    )
    return re.sub(r"\s+", " ", normalized).strip()


def normalize_pan(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def normalize_gstin(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def normalize_udyam_id(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())


def simple_similarity(a: Any, b: Any) -> float:
    left = normalize_name(a)
    right = normalize_name(b)
    if not left or not right:
        return 0.0
    if left == right:
        return 1.0
    return SequenceMatcher(None, left, right).ratio()
