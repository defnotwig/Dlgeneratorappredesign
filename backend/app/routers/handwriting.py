"""
Handwriting Routes - PyTorch GAN handwriting generation
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
from pathlib import Path

from app.database import get_db, HandwritingStyle, SignatureAsset
from app.utils.timezone import get_ph_now, format_ph_datetime

router = APIRouter()
OUTPUT_DIR = Path(__file__).parent.parent.parent / "uploads" / "generated"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class DateGenerateRequest(BaseModel):
    date: Optional[str] = None
    style: str = "Natural Cursive"
    format: str = "full"
    width: int = 300
    height: int = 80


class CompositeRequest(BaseModel):
    signatureId: Optional[int] = None
    signaturePath: Optional[str] = None
    date: Optional[str] = None
    style: str = "Natural Cursive"
    outputWidth: int = 400
    outputHeight: int = 150


@router.get("/styles")
async def list_styles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HandwritingStyle).where(HandwritingStyle.is_active == True))
    return result.scalars().all()


@router.post("/generate-date")
async def generate_handwritten_date(request: Request, data: DateGenerateRequest):
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    date_obj = datetime.fromisoformat(data.date) if data.date else get_ph_now()

    result = await model.generate_date(
        date=date_obj,
        style=data.style,
        format_type=data.format,
        width=data.width,
        height=data.height
    )

    filename = f"date_{uuid.uuid4()}.png"
    file_path = OUTPUT_DIR / filename

    if result.get("image_bytes"):
        with open(file_path, "wb") as f:
            f.write(result["image_bytes"])

    return {
        "success": True,
        "image": result.get("image_base64"),
        "filePath": f"/uploads/generated/{filename}",
        "metadata": {
            "date": date_obj.isoformat(),
            "style": data.style,
            "format": data.format
        }
    }


@router.post("/generate-variations")
async def generate_variations(request: Request, date: Optional[str] = None, count: int = 5):
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    date_obj = datetime.fromisoformat(date) if date else get_ph_now()
    variations = await model.generate_variations(date_obj, min(count, 10))
    return {"success": True, "variations": variations, "date": date_obj.isoformat()}


@router.post("/composite")
async def composite_signature_date(request: Request, data: CompositeRequest, db: AsyncSession = Depends(get_db)):
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    sig_path = None
    if data.signatureId:
        result = await db.execute(
            select(SignatureAsset)
            .where(SignatureAsset.id == data.signatureId, SignatureAsset.status == "Approved")
        )
        sig = result.scalar_one_or_none()
        if not sig:
            raise HTTPException(status_code=404, detail="Approved signature not found")
        sig_path = str(Path(__file__).parent.parent.parent / sig.file_path.lstrip("/"))
    elif data.signaturePath:
        sig_path = data.signaturePath
    else:
        raise HTTPException(status_code=400, detail="signatureId or signaturePath required")

    date_obj = datetime.fromisoformat(data.date) if data.date else get_ph_now()

    result = await model.composite_signature_with_date(
        signature_path=sig_path,
        date=date_obj,
        style=data.style,
        output_width=data.outputWidth,
        output_height=data.outputHeight
    )

    filename = f"composite_{uuid.uuid4()}.png"
    return {
        "success": True,
        "image": result.get("image_base64"),
        "filePath": f"/uploads/generated/{filename}"
    }


@router.get("/preview")
async def preview_date(request: Request, date: Optional[str] = None, style: str = "Natural Cursive"):
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    date_obj = datetime.fromisoformat(date) if date else get_ph_now()
    result = await model.generate_date(date=date_obj, style=style)
    return {"success": True, "image": result.get("image_base64"), "date": date_obj.isoformat()}


# =============================================================================
# Style Extraction & Custom Font Endpoints
# =============================================================================

class ExtractStyleRequest(BaseModel):
    signatureId: int


class WeekdayDatesRequest(BaseModel):
    signatureId: Optional[int] = None
    weekOffset: int = 0


class CustomCompositeRequest(BaseModel):
    signatureId: int
    date: Optional[str] = None
    outputWidth: int = 400
    outputHeight: int = 150


@router.post("/extract-style")
async def extract_signature_style(
    request: Request,
    data: ExtractStyleRequest,
    db: AsyncSession = Depends(get_db)
):
    """Extract style characteristics from a signature for matching date generation."""
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    # Get signature from database
    result = await db.execute(
        select(SignatureAsset).where(SignatureAsset.id == data.signatureId)
    )
    sig = result.scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=404, detail="Signature not found")

    sig_path = str(Path(__file__).parent.parent.parent / sig.file_path.lstrip("/"))

    style_info = await model.extract_signature_style(sig_path)

    return {
        "success": True,
        "signatureId": data.signatureId,
        "styleVector": style_info.get("style_vector"),
        "styleParams": style_info.get("style_params")
    }


@router.post("/weekday-dates")
async def generate_weekday_dates(
    request: Request,
    data: WeekdayDatesRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate dated signatures for a week (Monday-Friday) matching signature style."""
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    sig_path = None
    if data.signatureId:
        result = await db.execute(
            select(SignatureAsset).where(SignatureAsset.id == data.signatureId)
        )
        sig = result.scalar_one_or_none()
        if sig:
            sig_path = str(Path(__file__).parent.parent.parent / sig.file_path.lstrip("/"))

    dates = await model.generate_weekday_dates(
        signature_path=sig_path,
        week_offset=data.weekOffset
    )

    return {
        "success": True,
        "weekOffset": data.weekOffset,
        "signatureId": data.signatureId,
        "dates": dates
    }


@router.post("/custom-composite")
async def create_custom_composite(
    request: Request,
    data: CustomCompositeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create composite signature with date using custom font matching signature style."""
    model = request.app.state.handwriting_model
    if not model:
        raise HTTPException(status_code=500, detail="Handwriting model not initialized")

    # Get approved signature
    result = await db.execute(
        select(SignatureAsset)
        .where(SignatureAsset.id == data.signatureId, SignatureAsset.status == "Approved")
    )
    sig = result.scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=404, detail="Approved signature not found")

    sig_path = str(Path(__file__).parent.parent.parent / sig.file_path.lstrip("/"))

    date_obj = datetime.fromisoformat(data.date) if data.date else get_ph_now()

    composite_result = await model.composite_signature_with_custom_date(
        signature_path=sig_path,
        date=date_obj,
        output_width=data.outputWidth,
        output_height=data.outputHeight
    )

    # Save composite image
    filename = f"custom_composite_{uuid.uuid4()}.png"
    file_path = OUTPUT_DIR / filename

    if composite_result.get("image_bytes"):
        with open(file_path, "wb") as f:
            f.write(composite_result["image_bytes"])

    return {
        "success": True,
        "image": composite_result.get("image_base64"),
        "filePath": f"/uploads/generated/{filename}",
        "metadata": composite_result.get("metadata")
    }


@router.get("/custom-font-status")
async def check_custom_font_status(request: Request):
    """Check if custom font images are loaded."""
    model = request.app.state.handwriting_model
    if not model:
        return {"loaded": False, "fontCount": 0}

    font_count = len(model.custom_font_renderer.font_images) if hasattr(model, 'custom_font_renderer') else 0

    return {
        "loaded": font_count > 0,
        "fontCount": font_count,
        "availableChars": list(model.custom_font_renderer.font_images.keys()) if font_count > 0 else []
    }

