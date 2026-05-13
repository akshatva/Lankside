from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


def validate_extension(filename: str) -> None:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file extension.")


async def save_upload_file(
    upload_file: UploadFile,
    *,
    upload_dir: str,
    max_size_bytes: int,
) -> tuple[str, str, int]:
    validate_extension(upload_file.filename or "")

    upload_root = Path(upload_dir).expanduser().resolve()
    upload_root.mkdir(parents=True, exist_ok=True)

    original_suffix = Path(upload_file.filename or "").suffix.lower()
    stored_filename = f"{uuid4().hex}{original_suffix}"
    file_path = upload_root / stored_filename

    file_size = 0
    with file_path.open("wb") as output_file:
        while chunk := await upload_file.read(1024 * 1024):
            file_size += len(chunk)
            if file_size > max_size_bytes:
                output_file.close()
                file_path.unlink(missing_ok=True)
                raise ValueError("Uploaded file exceeds maximum allowed size.")
            output_file.write(chunk)

    return stored_filename, str(file_path), file_size


def remove_stored_file(file_path: str, *, upload_dir: str) -> None:
    path = Path(file_path).expanduser().resolve()
    upload_root = Path(upload_dir).expanduser().resolve()
    if upload_root not in (path, *path.parents):
        return
    path.unlink(missing_ok=True)
