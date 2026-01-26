from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote

from app.services.handwriting_gan import handwriting_gan
from app.utils.timezone import get_ph_now, utc_to_ph

OUTPUT_WIDTH = 400
OUTPUT_HEIGHT = 160
DATE_FONT_HEIGHT = 22
PREVIEW_FOLDER = "Approval Request - Date"

# Visual style parameters matching browser's CustomDateRenderer EXACTLY
# From SignatureConfig.tsx:
#   Container: rotate(-8deg)
#   Signature: h-28 (112px), marginBottom: -34px
#   Date wrapper: width: 45%, marginLeft: 20.5%, marginTop: -7px
#   CustomDateRenderer: height=22.5, rotation=-20, dotScale=0.55
ROTATION_DEG = -8.0
DATE_ROTATION_DEG = -20.0  # Match frontend rotation={-20}
DATE_WIDTH_RATIO = 0.45
DATE_MARGIN_LEFT_RATIO = 0.205  # Match frontend marginLeft: 20.5%
OVERLAP_PX = 34  # Match frontend marginBottom: -34px
DOT_SCALE = 0.55  # Match frontend dotScale={0.55}


def _preview_root() -> Path:
    backend_root = Path(__file__).resolve().parents[2]
    return backend_root / "uploads" / "previews" / PREVIEW_FOLDER


def _preview_dir(signature_id: int, week_key: str) -> Path:
    preview_dir = _preview_root() / str(signature_id) / week_key
    preview_dir.mkdir(parents=True, exist_ok=True)
    return preview_dir


def _sanitize_label(label: str) -> str:
    safe = label.replace(" ", "_").replace("/", "-")
    safe = safe.replace(".", "-")
    return safe


def get_week_window(reference_dt: datetime) -> Tuple[datetime, datetime]:
    ph_dt = utc_to_ph(reference_dt)
    weekday = ph_dt.weekday()
    if weekday >= 5:
        days_until_monday = (7 - weekday) % 7
        monday = ph_dt + timedelta(days=days_until_monday)
    else:
        monday = ph_dt - timedelta(days=weekday)
    friday = monday + timedelta(days=4)
    return monday, friday


async def build_date_previews(
    signature_id: int,
    signature_path: Path,
    monday: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    previews: List[Dict[str, Any]] = []
    if not signature_path.exists():
        return previews

    if monday is None:
        monday, _ = get_week_window(get_ph_now())

    week_key = monday.date().isoformat()
    preview_dir = _preview_dir(signature_id, week_key)

    for day_offset in range(5):
        preview_date = monday + timedelta(days=day_offset)
        date_label = handwriting_gan._format_custom_date(preview_date, "M.D.YY")
        filename = f"signature_date_preview_{day_offset + 1}_{_sanitize_label(date_label)}.png"
        file_path = preview_dir / filename

        if file_path.exists():
            image_bytes = file_path.read_bytes()
        else:
            # Generate composite with browser-matching visual style
            composite_result = await handwriting_gan.composite_signature_with_custom_date(
                signature_path=str(signature_path),
                date=preview_date,
                output_width=OUTPUT_WIDTH,
                output_height=OUTPUT_HEIGHT,
                format_string="M.D.YY",
                date_font_height=DATE_FONT_HEIGHT,
                rotation_deg=ROTATION_DEG,
                date_rotation_deg=DATE_ROTATION_DEG,
                date_width_ratio=DATE_WIDTH_RATIO,
                date_margin_left_ratio=DATE_MARGIN_LEFT_RATIO,
                overlap_px=OVERLAP_PX,
                dot_scale=DOT_SCALE
            )
            if not composite_result.get("success"):
                continue
            image_bytes = composite_result.get("image_bytes", b"")
            if image_bytes:
                file_path.write_bytes(image_bytes)

            date_label = composite_result.get("date_string") or date_label

        # URL-encode folder name for web URLs (contains spaces)
        folder_encoded = quote(PREVIEW_FOLDER, safe='')
        file_url = f"/uploads/previews/{folder_encoded}/{signature_id}/{week_key}/{filename}"

        previews.append({
            "date_label": date_label,
            "day_name": preview_date.strftime("%A"),
            "image_bytes": image_bytes,
            "file_path": str(file_path),
            "file_url": file_url
        })

    return previews
