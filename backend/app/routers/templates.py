"""
Template Routes - Document template management
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import Optional
import uuid
import os
from pathlib import Path

from app.database import get_db, Template

router = APIRouter()
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "templates"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/")
async def list_templates(
    templateType: Optional[str] = None,
    clientId: Optional[str] = None,
    isActive: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Template)
    if templateType:
        query = query.where(Template.template_type == templateType)
    if clientId:
        query = query.where(Template.client_id == clientId)
    if isActive is not None:
        query = query.where(Template.is_active == isActive)
    result = await db.execute(query.order_by(Template.created_at.desc()))
    return result.scalars().all()


@router.get("/{template_id}")
async def get_template(template_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/")
async def upload_template(
    template: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    templateType: str = Form("DL"),
    clientId: Optional[str] = Form(None),
    createdBy: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    filename = f"template_{uuid.uuid4()}{Path(template.filename).suffix}"
    file_path = UPLOAD_DIR / filename

    content = await template.read()
    with open(file_path, "wb") as f:
        f.write(content)

    new_template = Template(
        name=name,
        description=description,
        file_path=f"/uploads/templates/{filename}",
        template_type=templateType,
        client_id=clientId,
        created_by=createdBy
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


@router.put("/{template_id}")
async def update_template(
    template_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    templateType: Optional[str] = None,
    isActive: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    updates = {}
    if name:
        updates["name"] = name
    if description:
        updates["description"] = description
    if templateType:
        updates["template_type"] = templateType
    if isActive is not None:
        updates["is_active"] = isActive

    if updates:
        await db.execute(update(Template).where(Template.id == template_id).values(**updates))
        await db.commit()

    result = await db.execute(select(Template).where(Template.id == template_id))
    return result.scalar_one()


@router.delete("/{template_id}")
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.file_path:
        file_path = Path(__file__).parent.parent.parent / template.file_path.lstrip("/")
        if file_path.exists():
            os.remove(file_path)

    await db.execute(delete(Template).where(Template.id == template_id))
    await db.commit()
    return {"message": "Template deleted"}
