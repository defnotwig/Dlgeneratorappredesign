import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import re

PREVIEW_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads" / "lark_previews"
MANIFEST_NAME = "preview_manifest.json"
EXPECTED_COUNT = 5
DEFAULT_FILENAME = "preview.png"


def ensure_preview_root() -> None:
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)


def build_preview_hash(
    signature_id: int,
    date_text: str,
    render_config: str,
    week_start: Optional[str],
    date_labels: Optional[List[str]]
) -> str:
    payload = {
        "signature_id": signature_id,
        "date_text": date_text,
        "render_config": render_config,
        "week_start": week_start,
        "date_labels": date_labels,
    }
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def preview_set_dir(signature_id: int, preview_hash: str) -> Path:
    return PREVIEW_ROOT / str(signature_id) / preview_hash


def preview_file_url(signature_id: int, filename: str, path_prefix: Optional[str] = None) -> str:
    base = path_prefix or f"/uploads/lark_previews/{signature_id}"
    base = base.rstrip("/")
    return f"{base}/{filename.lstrip('/')}"


def _sanitize_date_label(label: str) -> str:
    normalized = label.strip().replace(".", "-").replace("/", "-")
    normalized = re.sub(r"[^0-9A-Za-z-]+", "-", normalized)
    return normalized.strip("-") or "preview"


def _manifest_path(target_dir: Path) -> Path:
    return target_dir / MANIFEST_NAME


def _load_manifest(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def _write_manifest(path: Path, payload: Dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _manifest_complete(target_dir: Path, files: List[str]) -> bool:
    return all((target_dir / name).exists() for name in files)


def _signature_root(signature_id: int) -> Path:
    return PREVIEW_ROOT / str(signature_id)


def save_preview_images(
    signature_id: int,
    date_text: str,
    render_config: str,
    images: List[bytes],
    date_labels: Optional[List[str]] = None,
    week_start: Optional[str] = None,
) -> Dict[str, Any]:
    ensure_preview_root()
    preview_hash = build_preview_hash(signature_id, date_text, render_config, week_start, date_labels)
    target_dir = _signature_root(signature_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    normalized_labels = date_labels or []
    if len(normalized_labels) != EXPECTED_COUNT:
        normalized_labels = [date_text] * EXPECTED_COUNT

    date_folders = [_sanitize_date_label(label) for label in normalized_labels]
    filenames = [f"{folder}/{DEFAULT_FILENAME}" for folder in date_folders]
    manifest_path = _manifest_path(target_dir)
    if manifest_path.exists():
        existing = _load_manifest(manifest_path)
        if existing:
            existing_hash = existing.get("hash")
            existing_config = existing.get("render_config")
            existing_week = existing.get("week_start")
            existing_labels = existing.get("date_labels") or []
            if (
                existing_hash == preview_hash
                and existing_config == render_config
                and existing_week == week_start
                and len(existing_labels) == len(normalized_labels)
                and _manifest_complete(target_dir, filenames)
            ):
                return _build_response(existing, target_dir)

    for index, image_bytes in enumerate(images[:EXPECTED_COUNT], start=1):
        folder = date_folders[index - 1]
        date_dir = target_dir / folder
        date_dir.mkdir(parents=True, exist_ok=True)
        (date_dir / DEFAULT_FILENAME).write_bytes(image_bytes)

    generated_at = datetime.now(timezone.utc).isoformat()
    manifest = {
        "signature_id": signature_id,
        "date_text": date_text,
        "render_config": render_config,
        "week_start": week_start,
        "date_labels": normalized_labels,
        "hash": preview_hash,
        "path_prefix": f"/uploads/lark_previews/{signature_id}",
        "generated_at": generated_at,
        "files": filenames,
    }
    _write_manifest(manifest_path, manifest)
    return _build_response(manifest, target_dir)


def _build_response(manifest: Dict[str, Any], target_dir: Path) -> Dict[str, Any]:
    signature_id = manifest["signature_id"]
    preview_hash = manifest.get("hash")
    files = manifest.get("files") or []
    date_labels = manifest.get("date_labels") or []
    path_prefix = manifest.get("path_prefix")
    if not path_prefix:
        path_prefix = f"/uploads/lark_previews/{signature_id}/{preview_hash}" if preview_hash else f"/uploads/lark_previews/{signature_id}"
    return {
        "signature_id": signature_id,
        "date_text": manifest.get("date_text"),
        "week_start": manifest.get("week_start"),
        "date_labels": date_labels,
        "render_config": manifest.get("render_config"),
        "hash": preview_hash,
        "path_prefix": path_prefix,
        "generated_at": manifest.get("generated_at"),
        "files": [
            {
                "filename": filename,
                "url": preview_file_url(signature_id, filename, path_prefix=path_prefix),
                "path": str(target_dir / filename),
                "date_label": date_labels[index] if index < len(date_labels) else manifest.get("date_text"),
            }
            for index, filename in enumerate(files)
            if (target_dir / filename).exists()
        ],
    }


def load_latest_preview_set(signature_id: int) -> Optional[Dict[str, Any]]:
    root_dir = PREVIEW_ROOT / str(signature_id)
    if not root_dir.exists():
        return None

    root_manifest = _load_manifest(_manifest_path(root_dir))
    if root_manifest:
        root_files = root_manifest.get("files") or []
        if _manifest_complete(root_dir, root_files):
            return {
                **root_manifest,
                "dir_path": root_dir,
            }

    latest_entry: Optional[Dict[str, Any]] = None
    latest_time: Optional[datetime] = None

    for entry in root_dir.iterdir():
        if not entry.is_dir():
            continue
        manifest = _load_manifest(_manifest_path(entry))
        if not manifest:
            continue
        generated_at = manifest.get("generated_at")
        try:
            generated_time = datetime.fromisoformat(generated_at) if generated_at else None
        except ValueError:
            generated_time = None
        if generated_time is None:
            generated_time = datetime.fromtimestamp(entry.stat().st_mtime, tz=timezone.utc)
        if latest_time is None or generated_time > latest_time:
            latest_time = generated_time
            latest_entry = {
                **manifest,
                "dir_path": entry,
            }

    return latest_entry
