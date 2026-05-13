from __future__ import annotations

import os
import sys
from typing import Any

import httpx


BASE_URL = os.environ.get("LANKSIDE_BASE_URL", "http://localhost:8000").rstrip("/")


def _print_step(label: str, ok: bool, detail: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    suffix = f" - {detail}" if detail else ""
    print(f"{status} {label}{suffix}")


def _get_json(client: httpx.Client, path: str) -> tuple[bool, Any, str]:
    try:
        response = client.get(path)
        if 200 <= response.status_code < 300:
            return True, response.json(), f"HTTP {response.status_code}"
        return False, None, f"HTTP {response.status_code}: {response.text[:200]}"
    except httpx.HTTPError as exc:
        return False, None, str(exc)


def _post_json(client: httpx.Client, path: str) -> tuple[bool, Any, str]:
    try:
        response = client.post(path)
        if 200 <= response.status_code < 300:
            return True, response.json(), f"HTTP {response.status_code}"
        return False, None, f"HTTP {response.status_code}: {response.text[:200]}"
    except httpx.HTTPError as exc:
        return False, None, str(exc)


def _ensure_lri(client: httpx.Client, business_id: int) -> tuple[bool, str]:
    ok, payload, detail = _get_json(client, f"/api/v1/lri/{business_id}/latest")
    if ok:
        return True, f"latest {payload.get('overall_score')} {payload.get('band')}"

    ok, payload, detail = _post_json(client, f"/api/v1/lri/{business_id}/calculate")
    if ok:
        return True, f"calculated {payload.get('overall_score')} {payload.get('band')}"
    return False, detail


def _ensure_grants(client: httpx.Client, business_id: int) -> tuple[bool, str]:
    ok, payload, detail = _get_json(client, f"/api/v1/grants/{business_id}/matches")
    if ok and payload:
        return True, f"{len(payload)} stored matches"

    ok, payload, detail = _post_json(client, f"/api/v1/grants/{business_id}/match")
    if ok:
        return True, f"{payload.get('total_matches', 0)} generated matches"
    return False, detail


def _ensure_reports(client: httpx.Client, business_id: int) -> tuple[bool, str]:
    ok, payload, detail = _get_json(client, f"/api/v1/reports?business_id={business_id}")
    if ok and payload:
        latest = payload[0]
        return True, f"latest report {latest.get('status')}"

    ok, payload, detail = _post_json(client, f"/api/v1/reports/{business_id}/generate")
    if ok:
        return True, f"generated report {payload.get('status')}"
    return False, detail


def main() -> int:
    failures = 0
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        ok, payload, detail = _post_json(client, "/api/v1/admin/seed-demo-data")
        _print_step("seed demo data", ok, detail)
        failures += 0 if ok else 1

        ok, summary, detail = _get_json(client, "/api/v1/admin/demo-summary")
        _print_step("demo summary", ok, str(summary) if ok else detail)
        failures += 0 if ok else 1

        ok, businesses, detail = _get_json(client, "/api/v1/businesses")
        demo_businesses = [
            item
            for item in (businesses or [])
            if item.get("business_name")
            in {
                "Sharma Medical Distributors",
                "Kaveri Textiles",
                "GreenPack Industries",
            }
        ]
        _print_step(
            "demo businesses",
            ok and len(demo_businesses) == 3,
            f"{len(demo_businesses)} found" if ok else detail,
        )
        if not ok or len(demo_businesses) != 3:
            failures += 1

        for business in demo_businesses:
            name = business["business_name"]
            business_id = business["id"]

            ok, detail = _ensure_lri(client, business_id)
            _print_step(f"{name} LRI", ok, detail)
            failures += 0 if ok else 1

            ok, detail = _ensure_grants(client, business_id)
            _print_step(f"{name} Grant Scout", ok, detail)
            failures += 0 if ok else 1

            ok, detail = _ensure_reports(client, business_id)
            _print_step(f"{name} Bankability Report", ok, detail)
            failures += 0 if ok else 1

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
