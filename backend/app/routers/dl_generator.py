"""
DL Generator Routes - Demand Letter generation job management
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from typing import Optional
import uuid
from pathlib import Path
from datetime import datetime

from app.database import get_db, DLGenerationJob, UserClient

router = APIRouter()
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "excel"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "uploads" / "output"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/jobs")
async def list_jobs(
    userId: Optional[int] = None,
    status: Optional[str] = None,
    clientName: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(DLGenerationJob)
    if userId:
        query = query.where(DLGenerationJob.user_id == userId)
    if status:
        query = query.where(DLGenerationJob.status == status)
    if clientName:
        query = query.where(DLGenerationJob.client_name == clientName)
    result = await db.execute(query.order_by(DLGenerationJob.created_at.desc()).limit(100))
    return result.scalars().all()


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DLGenerationJob).where(
            (DLGenerationJob.id == int(job_id) if job_id.isdigit() else False) |
            (DLGenerationJob.job_uuid == job_id)
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/jobs")
async def create_job(
    excelFile: Optional[UploadFile] = File(None),
    userId: int = Form(1),
    processMode: str = Form(...),
    outputFormat: str = Form(...),
    clientName: str = Form(...),
    templateId: Optional[int] = Form(None),
    signatureId: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    job_uuid = str(uuid.uuid4())
    excel_path = None

    if excelFile:
        filename = f"excel_{job_uuid}{Path(excelFile.filename).suffix}"
        file_path = UPLOAD_DIR / filename
        content = await excelFile.read()
        with open(file_path, "wb") as f:
            f.write(content)
        excel_path = f"/uploads/excel/{filename}"

    new_job = DLGenerationJob(
        job_uuid=job_uuid,
        user_id=userId,
        process_mode=processMode,
        output_format=outputFormat,
        client_name=clientName,
        template_id=templateId,
        signature_id=signatureId,
        excel_file_path=excel_path,
        status="Pending"
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)

    return {"id": new_job.id, "jobUuid": job_uuid, "status": "Pending"}


@router.post("/jobs/{job_id}/process")
async def process_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DLGenerationJob).where(
            (DLGenerationJob.id == int(job_id) if job_id.isdigit() else False) |
            (DLGenerationJob.job_uuid == job_id)
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.execute(
        update(DLGenerationJob).where(DLGenerationJob.id == job.id).values(status="Processing")
    )
    await db.commit()

    # In production, this would trigger async document generation
    return {"message": "Processing started", "jobId": job.id, "status": "Processing"}


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DLGenerationJob).where(DLGenerationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.execute(delete(DLGenerationJob).where(DLGenerationJob.id == job_id))
    await db.commit()
    return {"message": "Job deleted"}


@router.get("/clients")
async def get_clients(userId: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    if userId:
        result = await db.execute(select(UserClient.client_name).where(UserClient.user_id == userId))
        return [c for c in result.scalars().all()]
    return ["BPI", "EON BANK", "USB PLC", "BPI BANKO", "CITIBANK", "HSBC"]


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(DLGenerationJob.id)))
    completed = await db.execute(select(func.count(DLGenerationJob.id)).where(DLGenerationJob.status == "Completed"))
    return {"totalJobs": total.scalar(), "completedJobs": completed.scalar()}
