"""
Preview Storage Routes
======================
Receives frontend-rendered preview PNGs and exposes the latest set for Lark.
"""

from typing import List, Optional
import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.preview_storage import (
    EXPECTED_COUNT,
    load_latest_preview_set,
    preview_file_url,
    save_preview_images,
)
from app.services.lark_preview_cache import clear_signature_cache

router = APIRouter()


@router.post("/save")
async def save_previews(
    signature_id: int = Form(...),
    date_text: str = Form(...),
    render_config: str = Form(...),
    week_start: Optional[str] = Form(None),
    date_labels: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
):
    if len(images) < EXPECTED_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {EXPECTED_COUNT} preview images, got {len(images)}.",
        )

    parsed_labels: Optional[List[str]] = None
    if date_labels:
        try:
            parsed = json.loads(date_labels)
            if isinstance(parsed, list):
                parsed_labels = [str(value) for value in parsed]
        except json.JSONDecodeError:
            parsed_labels = None

    payloads = []
    for upload in images[:EXPECTED_COUNT]:
        payloads.append(await upload.read())

    response = save_preview_images(
        signature_id=signature_id,
        date_text=date_text,
        render_config=render_config,
        date_labels=parsed_labels,
        week_start=week_start,
        images=payloads,
    )
    clear_signature_cache(signature_id)
    return {"success": True, **response}


@router.get("/list")
async def list_previews(signature_id: int):
    preview_set = load_latest_preview_set(signature_id)
    if not preview_set:
        return {
            "success": True,
            "signature_id": signature_id,
            "previews": [],
        }

    file_list = preview_set.get("files") or []
    date_labels = preview_set.get("date_labels") or []
    preview_hash = preview_set.get("hash")
    path_prefix = preview_set.get("path_prefix")
    if not path_prefix:
        path_prefix = f"/uploads/lark_previews/{signature_id}/{preview_hash}" if preview_hash else f"/uploads/lark_previews/{signature_id}"

    return {
        "success": True,
        "signature_id": signature_id,
        "date_text": preview_set.get("date_text"),
        "render_config": preview_set.get("render_config"),
        "hash": preview_set.get("hash"),
        "generated_at": preview_set.get("generated_at"),
        "week_start": preview_set.get("week_start"),
        "previews": [
            {
                "filename": filename,
                "url": preview_file_url(signature_id, filename, path_prefix=path_prefix),
                "date_label": date_labels[index] if index < len(date_labels) else preview_set.get("date_text"),
            }
            for index, filename in enumerate(file_list)
        ],
    }
