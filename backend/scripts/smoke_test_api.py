from __future__ import annotations

import os
import sys

import httpx


BASE_URL = os.environ.get("LANKSIDE_BASE_URL", "http://localhost:8000").rstrip("/")

ROUTES = [
    ("/health", True),
    ("/api/v1/health", True),
    ("/api/v1/status", True),
    ("/api/v1/businesses", True),
    ("/api/v1/documents", True),
    ("/api/v1/extractions", True),
    ("/api/v1/audit", True),
    ("/api/v1/grants/schemes", True),
    ("/api/v1/reports", True),
]


def main() -> int:
    failures = 0
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        for path, critical in ROUTES:
            try:
                response = client.get(path)
                ok = 200 <= response.status_code < 300
            except httpx.HTTPError as exc:
                ok = False
                detail = str(exc)
            else:
                detail = f"HTTP {response.status_code}"

            label = "PASS" if ok else "FAIL"
            print(f"{label} {path} - {detail}")
            if critical and not ok:
                failures += 1

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
