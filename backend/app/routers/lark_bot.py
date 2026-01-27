"""
Lark Bot Routes - Lark Message Card Builder integration and Auto-Approval Scheduler

Uses Lark Open API with Message Card Builder templates for sending rich approval cards.
Reference: https://open.larksuite.com/document/client-docs/messenger-builder/overview
"""
import json
import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database import get_db, LarkBotConfig, SignatureApprovalRequest, SignatureAsset, AuditLog, async_session
from app.services.lark_bot_service import lark_bot_service
from app.services.lark_approval_service import lark_approval_service
from app.services.lark_card_update_service import lark_card_update_service

router = APIRouter()

# Constants
MSG_NO_PENDING_REQUEST = "No pending approval request found"
LARK_VERIFICATION_TOKEN = os.getenv("LARK_VERIFICATION_TOKEN")

# In-memory recipient storage (fallback for local dev)
_RECIPIENTS: list[dict] = []
_RECIPIENT_COUNTER = 1


# =============================================================================
# Pydantic Models
# =============================================================================

class LarkConfigCreate(BaseModel):
    """Legacy webhook configuration."""
    webhookUrl: str
    secretKey: Optional[str] = None


class LarkOpenAPIConfig(BaseModel):
    """Lark Open API configuration for Message Card Builder."""
    appId: str
    appSecret: Optional[str] = None  # Optional - uses existing secret if not provided
    templateId: Optional[str] = None  # Message Card template ID (ctp_xxxx)
    selfUserId: Optional[str] = None  # open_id or user_id for self-messaging
    webhookUrl: Optional[str] = None  # Optional legacy webhook

class ApprovalRequest(BaseModel):
    signatureId: int
    requestedBy: Optional[str] = "Admin"
    validityPeriod: Optional[str] = "1 Week"
    purpose: Optional[str] = "DL Generation"
    adminMessage: Optional[str] = None


class ApprovalResponse(BaseModel):
    status: str  # Approved or Rejected
    respondedBy: Optional[str] = "Attorney"
    reason: Optional[str] = None


class RecipientCreate(BaseModel):
    name: str
    email: str
    openId: str


@router.get("/recipients")
async def list_recipients():
    return _RECIPIENTS


@router.get("/recipients/verify-email")
async def verify_recipient_email(email: str):
    normalized = (email or "").strip().lower()
    if not normalized or "@" not in normalized:
        return {"success": False, "message": "Invalid email"}

    for recipient in _RECIPIENTS:
        if recipient.get("email") == normalized:
            return {"success": True, "user": recipient}

    # Provide a predictable stub user for valid emails
    local_part = normalized.split("@")[0]
    name = local_part.replace(".", " ").replace("_", " ").title() or "Lark User"
    return {
        "success": True,
        "user": {
            "name": name,
            "email": normalized,
            "open_id": f"open_{normalized.replace('@', '_')}"
        }
    }


@router.post("/recipients")
async def add_recipient(payload: RecipientCreate):
    global _RECIPIENT_COUNTER
    for recipient in _RECIPIENTS:
        if recipient.get("open_id") == payload.openId:
            return {"success": True, "recipient": recipient}

    recipient = {
        "id": _RECIPIENT_COUNTER,
        "name": payload.name,
        "email": payload.email,
        "open_id": payload.openId
    }
    _RECIPIENT_COUNTER += 1
    _RECIPIENTS.append(recipient)
    return {"success": True, "recipient": recipient}


@router.delete("/recipients/{recipient_id}")
async def delete_recipient(recipient_id: int):
    global _RECIPIENTS
    _RECIPIENTS = [r for r in _RECIPIENTS if r.get("id") != recipient_id]
    return {"success": True}


# =============================================================================
# Message Card Builder Configuration Endpoints
# =============================================================================

@router.get("/config/openapi")
async def get_lark_openapi_config():
    """Get the current Lark Open API configuration."""
    config = await lark_approval_service.get_config()
    return config or {"configured": False}


@router.post("/config/openapi")
async def save_lark_openapi_config(config_data: LarkOpenAPIConfig):
    """
    Save Lark Open API configuration for Message Card Builder.
    
    This sets up the integration with Lark's Send Message API
    using the Message Card Builder templates.
    
    Required:
    - appId: App ID from Lark Developer Console
    - appSecret: App Secret from Lark Developer Console
    
    Optional:
    - templateId: Message Card template ID (ctp_xxxx) from Message Card Builder
    - selfUserId: Your open_id or user_id to receive test messages
    - webhookUrl: Legacy webhook URL (optional fallback)
    """
    result = await lark_approval_service.configure(
        app_id=config_data.appId,
        app_secret=config_data.appSecret,
        template_id=config_data.templateId,
        self_user_id=config_data.selfUserId,
        webhook_url=config_data.webhookUrl
    )
    return result


# =============================================================================
# Legacy Webhook Configuration (Backward Compatibility)
# =============================================================================

@router.get("/config")
async def get_lark_config(db: AsyncSession = Depends(get_db)):
    config = await lark_bot_service.get_active_config()
    if config:
        return {"id": config.id, "webhook_url": config.webhook_url, "is_active": config.is_active, 
                "last_used_at": config.last_used_at, "hasSecretKey": bool(config.secret_key)}
    return None

@router.post("/config")
async def save_lark_config(config_data: LarkConfigCreate, db: AsyncSession = Depends(get_db)):
    await lark_bot_service.save_config(config_data.webhookUrl, config_data.secretKey)
    return {"message": "Lark bot configuration saved"}

@router.post("/test")
async def test_lark_connection(config_data: Optional[LarkConfigCreate] = None):
    if config_data:
        result = await lark_bot_service.test_connection(config_data.webhookUrl, config_data.secretKey)
    else:
        config = await lark_bot_service.get_active_config()
        if not config:
            raise HTTPException(status_code=400, detail="No webhook URL configured")
        result = await lark_bot_service.test_connection(config.webhook_url, config.secret_key)
    return result

@router.post("/send-approval")
async def send_approval_request(request_data: ApprovalRequest, db: AsyncSession = Depends(get_db)):
    sig_result = await db.execute(select(SignatureAsset).where(SignatureAsset.id == request_data.signatureId))
    signature = sig_result.scalar_one_or_none()
    if not signature:
        raise HTTPException(status_code=404, detail="Signature not found")

    # Prefer Open API flow for Option A message updates.
    openapi_result = await lark_approval_service.send_approval_request(
        signature_id=request_data.signatureId,
        requested_by=request_data.requestedBy or "Admin",
        is_auto_request=False
    )
    return openapi_result

@router.post("/send-text")
async def send_text_message(message: str):
    result = await lark_bot_service.send_text_message(message)
    return result

@router.get("/approval-requests")
async def list_approval_requests(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """
    List all signature approval requests with associated signature data.
    
    Returns data formatted for frontend consumption:
    - id: Approval request ID
    - signature_id: Associated signature ID
    - signature_url: Path to signature file
    - created_at: Request creation timestamp
    - requested_by: User who requested (from signature uploader info)
    - status: Current status (Pending, Approved, Rejected)
    - approved_at: Response timestamp (responded_at field mapped for frontend compatibility)
    - responded_by: User who approved/rejected
    - validity_period: From signature asset
    - purpose: From signature asset
    """
    # Join with SignatureAsset to get signature details
    query = select(
        SignatureApprovalRequest,
        SignatureAsset
    ).join(
        SignatureAsset, 
        SignatureApprovalRequest.signature_id == SignatureAsset.id
    )
    
    if status:
        query = query.where(SignatureApprovalRequest.status == status)
    
    query = query.order_by(SignatureApprovalRequest.created_at.desc())
    result = await db.execute(query)
    rows = result.all()
    
    # Transform to frontend-expected format
    response_data = []
    for approval_request, signature in rows:
        response_data.append({
            "id": approval_request.id,
            "signature_id": approval_request.signature_id,
            "signature_url": signature.file_path if signature else None,
            "created_at": approval_request.created_at.isoformat() if approval_request.created_at else None,
            "requested_by": "Admin",  # Could be enhanced to look up user name
            "status": approval_request.status,
            "approved_at": approval_request.responded_at.isoformat() if approval_request.responded_at else None,
            "responded_by": approval_request.responded_by,
            "validity_period": signature.validity_period if signature else "1 Week",
            "purpose": signature.purpose if signature else "DL Generation",
            "lark_message_id": approval_request.lark_message_id
        })
    
    return response_data

@router.patch("/approval-requests/{request_id}/respond")
async def respond_to_approval(request_id: int, response: ApprovalResponse, db: AsyncSession = Depends(get_db)):
    """Handle approval response (from Lark callback or manual simulation)."""
    if response.status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Status must be Approved or Rejected")
    
    await db.execute(
        update(SignatureApprovalRequest)
        .where(SignatureApprovalRequest.id == request_id)
        .values(
            status=response.status,
            responded_by=response.respondedBy, 
            response_reason=response.reason,
            responded_at=datetime.now(timezone.utc)
        )
    )
    
    req_result = await db.execute(select(SignatureApprovalRequest).where(SignatureApprovalRequest.id == request_id))
    req = req_result.scalar_one_or_none()
    if req:
        sig_status = "Approved" if response.status == "Approved" else "Rejected"
        await db.execute(update(SignatureAsset).where(SignatureAsset.id == req.signature_id).values(status=sig_status))
    
    await db.commit()
    return {"message": f"Request {response.status.lower()}", "requestId": request_id}


# =============================================================================
# Auto-Approval Scheduler Endpoints
# =============================================================================

@router.get("/scheduler/status")
async def get_scheduler_status():
    """Get the auto-approval scheduler status."""
    return lark_approval_service.get_scheduler_status()

@router.post("/scheduler/start")
async def start_scheduler():
    """Start the auto-approval scheduler."""
    await lark_approval_service.start_scheduler()
    return {"message": "Scheduler started", "status": lark_approval_service.get_scheduler_status()}

@router.post("/scheduler/stop")
async def stop_scheduler():
    """Stop the auto-approval scheduler."""
    await lark_approval_service.stop_scheduler()
    return {"message": "Scheduler stopped", "status": lark_approval_service.get_scheduler_status()}

@router.post("/scheduler/trigger")
async def trigger_approval_manually():
    """Manually trigger an approval request (for testing)."""
    try:
        result = await lark_approval_service.trigger_manual_approval()
        return {"success": result.get("success", False), "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/approval/send-auto")
async def send_auto_approval_request(db: AsyncSession = Depends(get_db)):
    """
    Send an automatic approval request using the stored signature asset.
    This runs on Sundays at 8:00 AM and 5:00 PM (PHT). The 5:00 PM send
    happens only if the earlier request is still pending or rejected.
    """
    # Get the latest signature asset
    result = await db.execute(
        select(SignatureAsset)
        .order_by(SignatureAsset.created_at.desc())
        .limit(1)
    )
    signature = result.scalar_one_or_none()
    
    if not signature:
        raise HTTPException(status_code=404, detail="No signature asset found")
    
    # Send approval request
    approval_result = await lark_approval_service.send_approval_request(
        signature_id=signature.id,
        requested_by="Auto-Scheduler",
        is_auto_request=True
    )
    
    return approval_result

@router.post("/approval/self-test")
async def send_self_approval_test():
    """Send a test approval message to yourself via Lark."""
    try:
        result = await lark_approval_service.test_connection()
        return {"success": result.get("success", False), "message": result.get("message", ""), "error": result.get("error")}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/approval/approve/{signature_id}")
async def approve_signature_callback(signature_id: int):
    """Callback endpoint when user clicks Approve button in Lark message card."""
    try:
        async with async_session() as session:
            # Find pending approval request for this signature
            result = await session.execute(
                select(SignatureApprovalRequest)
                .where(SignatureApprovalRequest.signature_id == signature_id)
                .where(SignatureApprovalRequest.status == "Pending")
                .order_by(SignatureApprovalRequest.created_at.desc())
            )
            request = result.scalar_one_or_none()
            
            if not request:
                return {"success": False, "message": MSG_NO_PENDING_REQUEST}
            
            # Update request status
            request.status = "Approved"
            request.approved_at = datetime.now(timezone.utc)
            
            # Update signature asset to active
            sig_result = await session.execute(
                select(SignatureAsset).where(SignatureAsset.id == signature_id)
            )
            signature = sig_result.scalar_one_or_none()
            
            if signature:
                signature.is_active = True
            
            # Create audit log
            log = AuditLog(
                action="lark_approval_approved",
                details=json.dumps({"signature_id": signature_id, "via": "lark_callback"}),
                status="success"
            )
            session.add(log)
            
            await session.commit()
            
            return {"success": True, "message": "Signature approved successfully!"}
            
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@router.get("/approval/reject/{signature_id}")
async def reject_signature_callback(signature_id: int):
    """Callback endpoint when user clicks Reject button in Lark message card."""
    try:
        async with async_session() as session:
            # Find pending approval request for this signature
            result = await session.execute(
                select(SignatureApprovalRequest)
                .where(SignatureApprovalRequest.signature_id == signature_id)
                .where(SignatureApprovalRequest.status == "Pending")
                .order_by(SignatureApprovalRequest.created_at.desc())
            )
            request = result.scalar_one_or_none()
            
            if not request:
                return {"success": False, "message": MSG_NO_PENDING_REQUEST}
            
            # Update request status
            request.status = "Rejected"
            request.approved_at = datetime.now(timezone.utc)
            
            # Create audit log
            log = AuditLog(
                action="lark_approval_rejected",
                details=json.dumps({"signature_id": signature_id, "via": "lark_callback"}),
                status="success"
            )
            session.add(log)
            
            await session.commit()
            
            return {"success": True, "message": " Signature rejected"}
            
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}


# =============================================================================
# Lark Card Button Callback Webhook (Option A: Message Update API)
# =============================================================================

@router.post("/webhook/button-callback")
async def handle_button_callback(payload: dict):
    """
    Webhook endpoint to handle button clicks from Lark message cards.
    
    ═══════════════════════════════════════════════════════════════════════════
    OPTION A: Uses Message Update API to update card in-place
    ═══════════════════════════════════════════════════════════════════════════
    
    Webhook Flow:
    ─────────────
    1. User clicks Approve/Reject button in Lark
    2. Lark sends card.action.trigger event to this endpoint
    3. Backend validates request and checks idempotency
    4. Backend updates database (thread-safe with async locks)
    5. Backend builds updated card JSON (buttons removed, status shown)
    6. Backend calls PATCH /im/v1/messages/{message_id}
    7. Lark updates the message UI for all viewers
    8. Backend returns empty {} to stop loading spinner
    
    Lark Event Structure (v2.0 schema):
    ───────────────────────────────────
    {
        "schema": "2.0",
        "header": {
            "event_id": "xxx",
            "event_type": "card.action.trigger",
            "create_time": "1234567890000",
            "token": "xxx",
            "app_id": "cli_xxx",
            "tenant_key": "xxx"
        },
        "event": {
            "operator": {
                "open_id": "ou_xxx",
                "user_id": "xxx"
            },
            "action": {
                "value": {"action": "approve", "signature_id": 1},
                "tag": "button"
            },
            "context": {
                "open_message_id": "om_xxx",
                "open_chat_id": "oc_xxx"
            }
        }
    }
    
    Security Features:
    ──────────────────
    - Idempotency: Prevents double execution if button clicked twice
    - Thread-safety: Async locks prevent race conditions
    - Retry handling: ngrok retries are handled gracefully
    - Token refresh: Access token auto-refreshes before expiry
    
    Returns:
    ────────
    Empty {} on success - CRITICAL for stopping Lark loading spinner
    """
    try:
        print(f"\n{'='*60}")
        print("📨 LARK BUTTON CALLBACK RECEIVED")
        print(f"{'='*60}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # ===== Handle URL verification challenge (first-time setup) =====
        if payload.get("type") == "url_verification":
            challenge = payload.get("challenge", "")
            print(f"🔐 URL Verification Challenge: {challenge}")
            return {"challenge": challenge}
        
        # ===== Normalize payload (support legacy card callback format) =====
        header = payload.get("header")
        if not header and "action" in payload and "open_message_id" in payload:
            payload = {
                "header": {
                    "event_id": payload.get("event_id") or payload.get("token") or payload.get("open_message_id"),
                    "event_type": "card.action.trigger",
                    "token": payload.get("token"),
                    "app_id": payload.get("app_id")
                },
                "event": {
                    "operator": {
                        "open_id": payload.get("open_id"),
                        "user_id": payload.get("user_id")
                    },
                    "token": payload.get("token"),
                    "action": payload.get("action", {}),
                    "context": {
                        "open_message_id": payload.get("open_message_id"),
                        "open_chat_id": payload.get("open_chat_id")
                    }
                }
            }
            header = payload["header"]

        # ===== Parse the Lark webhook event =====
        header = header or {}
        if LARK_VERIFICATION_TOKEN and header.get("token") != LARK_VERIFICATION_TOKEN:
            print("lark_token_mismatch: ignoring callback")
            return {}

        event_type = header.get("event_type", "")
        
        print(f"📋 Event Type: {event_type}")
        
        # ===== Handle card button click event =====
        if event_type in ("card.action.trigger", "im.message.message_card_action_trigger_v1"):
            # Process using the new LarkCardUpdateService
            success, message, data = await lark_card_update_service.process_button_callback(payload)
            
            if success:
                print(f"✅ Callback processed successfully: {message}")
                if data:
                    print(f"   └─ Status: {data.get('status')}")
                    print(f"   └─ Responded By: {data.get('responded_by')}")
            else:
                print(f"❌ Callback processing failed: {message}")
            
            # CRITICAL: Return empty {} to stop Lark loading spinner
            # Any other response format will cause infinite loading
            return {}
        
        # ===== Unknown event type =====
        print(f"⚠️ Unknown event type: {event_type}")
        return {}
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Button callback error: {e}")
        print(f"Traceback:\n{error_details}")
        
        # Still return empty {} to prevent Lark from retrying indefinitely
        return {}
