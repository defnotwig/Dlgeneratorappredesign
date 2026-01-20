"""
Audit Routes - Audit trail retrieval
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db, AuditLog
from app.utils.timezone import get_ph_now, format_ph_datetime

router = APIRouter()


@router.get("/")
async def list_audit_logs(
    userId: Optional[int] = None,
    action: Optional[str] = None,
    resourceType: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog)
    count_query = select(func.count(AuditLog.id))

    if userId:
        query = query.where(AuditLog.user_id == userId)
        count_query = count_query.where(AuditLog.user_id == userId)
    if action:
        query = query.where(AuditLog.action.contains(action))
        count_query = count_query.where(AuditLog.action.contains(action))
    if resourceType:
        query = query.where(AuditLog.resource_type == resourceType)
        count_query = count_query.where(AuditLog.resource_type == resourceType)
    if status:
        query = query.where(AuditLog.status == status)
        count_query = count_query.where(AuditLog.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)

    return {
        "logs": result.scalars().all(),
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + limit < total
        }
    }


@router.get("/actions")
async def get_action_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog.action).distinct().order_by(AuditLog.action))
    return [a for a in result.scalars().all()]


@router.get("/resources")
async def get_resource_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLog.resource_type).distinct()
        .where(AuditLog.resource_type.isnot(None))
        .order_by(AuditLog.resource_type)
    )
    return [r for r in result.scalars().all()]


@router.get("/stats")
async def get_audit_stats(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(AuditLog.id)))
    success = await db.execute(select(func.count(AuditLog.id)).where(AuditLog.status == "success"))
    failure = await db.execute(select(func.count(AuditLog.id)).where(AuditLog.status == "failure"))

    return {
        "totalLogs": total.scalar(),
        "successCount": success.scalar(),
        "failureCount": failure.scalar()
    }


@router.get("/{log_id}")
async def get_audit_log(log_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log


@router.get("/export/download")
async def export_audit_logs(
    format: str = Query(default="csv", description="Export format: csv, xlsx, json"),
    userId: Optional[int] = None,
    action: Optional[str] = None,
    resourceType: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Export audit logs in CSV, XLSX, or JSON format."""
    import io
    import csv
    from datetime import datetime
    from fastapi.responses import StreamingResponse
    
    # Query audit logs
    query = select(AuditLog)
    if userId:
        query = query.where(AuditLog.user_id == userId)
    if action:
        query = query.where(AuditLog.action.contains(action))
    if resourceType:
        query = query.where(AuditLog.resource_type == resourceType)
    if status:
        query = query.where(AuditLog.status == status)
    
    result = await db.execute(query.order_by(AuditLog.created_at.desc()))
    logs = result.scalars().all()
    
    # Convert to list of dicts
    log_dicts = []
    for log in logs:
        log_dicts.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat() if log.created_at else "",
            "user_id": log.user_id or "",
            "action": log.action or "",
            "resource_type": log.resource_type or "",
            "resource_id": log.resource_id or "",
            "status": log.status or "",
            "details": log.details or ""
        })
    
    timestamp_str = get_ph_now().strftime("%Y%m%d_%H%M%S")
    
    if format == "json":
        import json
        content = json.dumps(log_dicts, indent=2, default=str)
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{timestamp_str}.json"}
        )
    
    elif format == "xlsx":
        try:
            import openpyxl
            from openpyxl import Workbook
            
            wb = Workbook()
            ws = wb.active
            ws.title = "Audit Logs"
            
            # Headers
            headers = ["ID", "Timestamp", "User ID", "Action", "Resource Type", "Resource ID", "Status", "Details"]
            ws.append(headers)
            
            # Data
            for log in log_dicts:
                ws.append([log["id"], log["timestamp"], log["user_id"], log["action"], 
                          log["resource_type"], log["resource_id"], log["status"], log["details"]])
            
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            
            return StreamingResponse(
                output,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=audit_logs_{timestamp_str}.xlsx"}
            )
        except ImportError:
            raise HTTPException(status_code=500, detail="openpyxl not installed for XLSX export")
    
    else:  # Default to CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "timestamp", "user_id", "action", 
                                                     "resource_type", "resource_id", "status", "details"])
        writer.writeheader()
        writer.writerows(log_dicts)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{timestamp_str}.csv"}
        )

