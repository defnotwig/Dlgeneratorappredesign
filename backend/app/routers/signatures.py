"""
Signature Routes - Signature asset management
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import Optional
import uuid
import os
from pathlib import Path

from app.database import get_db, SignatureAsset, AuditLog

router = APIRouter()
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "signatures"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/")
async def list_signatures(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(SignatureAsset)
    if status:
        query = query.where(SignatureAsset.status == status)
    query = query.order_by(SignatureAsset.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{signature_id}")
async def get_signature(signature_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SignatureAsset).where(SignatureAsset.id == signature_id))
    sig = result.scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=404, detail="Signature not found")
    return sig


@router.post("/")
async def upload_signature(
    signature: UploadFile = File(...),
    uploadedBy: Optional[int] = Form(None),
    validityPeriod: str = Form("Indefinite"),
    purpose: str = Form("DL Generation"),
    adminMessage: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    filename = f"sig_{uuid.uuid4()}{Path(signature.filename).suffix}"
    file_path = UPLOAD_DIR / filename

    content = await signature.read()
    with open(file_path, "wb") as f:
        f.write(content)

    new_sig = SignatureAsset(
        file_path=f"/uploads/signatures/{filename}",
        file_name=signature.filename,
        uploaded_by=uploadedBy,
        validity_period=validityPeriod,
        purpose=purpose,
        admin_message=adminMessage,
        status="Pending"
    )
    db.add(new_sig)
    await db.commit()
    await db.refresh(new_sig)
    return new_sig


@router.patch("/{signature_id}/approve")
async def approve_signature(signature_id: int, approvedBy: str = "Attorney", db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timezone
    await db.execute(
        update(SignatureAsset)
        .where(SignatureAsset.id == signature_id)
        .values(status="Approved", approved_by=approvedBy, approved_at=datetime.now(timezone.utc))
    )
    await db.commit()
    result = await db.execute(select(SignatureAsset).where(SignatureAsset.id == signature_id))
    return result.scalar_one()


@router.patch("/{signature_id}/reject")
async def reject_signature(signature_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(update(SignatureAsset).where(SignatureAsset.id == signature_id).values(status="Rejected"))
    await db.commit()
    result = await db.execute(select(SignatureAsset).where(SignatureAsset.id == signature_id))
    return result.scalar_one()


@router.delete("/{signature_id}")
async def delete_signature(signature_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SignatureAsset).where(SignatureAsset.id == signature_id))
    sig = result.scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=404, detail="Signature not found")

    file_path = Path(__file__).parent.parent.parent / sig.file_path.lstrip("/")
    if file_path.exists():
        os.remove(file_path)

    await db.execute(delete(SignatureAsset).where(SignatureAsset.id == signature_id))
    await db.commit()
    return {"message": "Signature deleted"}


@router.get("/status/active")
async def get_active_signature(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SignatureAsset)
        .where(SignatureAsset.status == "Approved")
        .order_by(SignatureAsset.approved_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
