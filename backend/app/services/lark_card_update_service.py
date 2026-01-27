"""
Lark Card Update Service
========================
Handles Lark Interactive Card button callbacks using the Message Update API.

This service implements Option A: Updating the original message card in-place
after a user clicks Approve/Reject buttons.

Reference: https://open.larksuite.com/document/server-docs/im-v1/message/patch

Webhook Flow (ASCII Diagram):
=============================

    ┌──────────────┐                    ┌─────────────┐                    ┌─────────────┐
    │   Lark App   │                    │   Backend   │                    │   Lark API  │
    │   (User)     │                    │   FastAPI   │                    │   Server    │
    └──────┬───────┘                    └──────┬──────┘                    └──────┬──────┘
           │                                   │                                  │
           │  1. User clicks Approve/Reject    │                                  │
           │──────────────────────────────────>│                                  │
           │     card.action.trigger event     │                                  │
           │                                   │                                  │
           │                                   │  2. Validate request & check     │
           │                                   │     idempotency (prevent dupes)  │
           │                                   │─────────────────────────────────>│
           │                                   │                                  │
           │                                   │  3. Update DB: status, approver  │
           │                                   │     (thread-safe with locks)     │
           │                                   │                                  │
           │                                   │  4. Build updated card JSON      │
           │                                   │     (buttons disabled, status)   │
           │                                   │                                  │
           │                                   │  5. PATCH /im/v1/messages/{id}   │
           │                                   │──────────────────────────────────>│
           │                                   │                                  │
           │                                   │  6. Lark updates card UI         │
           │<──────────────────────────────────│<─────────────────────────────────│
           │     Card shows new status         │                                  │
           │                                   │                                  │
           │  7. Return empty {} response      │                                  │
           │     (stops Lark loading spinner)  │                                  │
           │<──────────────────────────────────│                                  │
           │                                   │                                  │
    ┌──────┴───────┐                    ┌──────┴──────┐                    ┌──────┴──────┐
    │   Lark App   │                    │   Backend   │                    │   Lark API  │
    └──────────────┘                    └─────────────┘                    └─────────────┘
"""

import asyncio
import json
import threading
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timezone, timedelta

import httpx
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import (
    async_session, 
    LarkBotConfig, 
    SignatureApprovalRequest, 
    SignatureAsset, 
    AuditLog,
    LarkEventDedupe
)
from app.utils.timezone import get_ph_now, format_ph_datetime, utc_to_ph
from app.utils.structured_logger import log_event
from app.services.handwriting_gan import handwriting_gan
from app.services.lark_preview_cache import get_cached_previews, set_cached_previews
from app.services.preview_storage import load_latest_preview_set

# =============================================================================
# Constants
# =============================================================================

LARK_BASE_URL = "https://open.larksuite.com/open-apis"
CONTENT_TYPE_JSON = "application/json; charset=utf-8"

# Status values
STATUS_PENDING = "Pending"
STATUS_APPROVED = "Approved"
STATUS_REJECTED = "Rejected"
STATUS_SUPERSEDED = "Superseded"

# Thread-safe lock for preventing race conditions
_approval_locks: Dict[int, asyncio.Lock] = {}
_global_lock = threading.Lock()


def _get_approval_lock(signature_id: int) -> asyncio.Lock:
    """
    Get or create a lock for a specific signature ID.
    Prevents race conditions when multiple users click the same button.
    """
    with _global_lock:
        if signature_id not in _approval_locks:
            _approval_locks[signature_id] = asyncio.Lock()
        return _approval_locks[signature_id]


def parse_lark_action_value(raw_value: Any, max_depth: int = 3) -> Dict[str, Any]:
    """
    Normalize Lark button action payloads.

    Handles dict, JSON string, and double-encoded JSON string formats.
    """
    value = raw_value
    for _ in range(max_depth):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except (json.JSONDecodeError, TypeError, ValueError):
                break
        else:
            break
    return value if isinstance(value, dict) else {}


# =============================================================================
# Lark Card Update Service
# =============================================================================

class LarkCardUpdateService:
    """
    Service for handling Lark card button callbacks with in-place updates.
    
    Key features:
    - Fetches and caches tenant access token
    - Builds updated card JSON for different states
    - Updates original message using PATCH API
    - Provides idempotency and thread-safety
    """
    
    def __init__(self):
        self.timeout = 30.0
        self.app_id: Optional[str] = None
        self.app_secret: Optional[str] = None
        self.self_user_id: Optional[str] = None
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        self._token_lock = asyncio.Lock()
    
    # =========================================================================
    # 4️⃣ Access Token Management
    # =========================================================================
    
    async def _load_config(self) -> bool:
        """Load Lark configuration from database."""
        async with async_session() as session:
            result = await session.execute(
                select(LarkBotConfig)
                .where(LarkBotConfig.is_active == True)
                .order_by(LarkBotConfig.id.desc())
                .limit(1)
            )
            config = result.scalar_one_or_none()
            
            if config:
                self.app_id = config.app_id
                self.app_secret = config.secret_key
                self.self_user_id = config.self_user_id
                return bool(self.app_id and self.app_secret)
            return False
    
    async def get_access_token(self) -> Optional[str]:
        """
        Get or refresh the tenant access token from Lark Open API.
        
        Token Caching Strategy:
        - Cache token in memory with expiry tracking
        - Refresh 5 minutes before expiry
        - Use lock to prevent concurrent refresh requests
        
        API Reference:
        POST https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal
        """
        async with self._token_lock:
            # Check if token is still valid (with 5 minute buffer)
            if self.access_token and self.token_expires_at:
                if datetime.now(timezone.utc) < self.token_expires_at - timedelta(minutes=5):
                    return self.access_token
            
            # Load config if not loaded
            if not self.app_id or not self.app_secret:
                loaded = await self._load_config()
                if not loaded:
                    log_event("lark_token_missing_config")
                    return None
            
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{LARK_BASE_URL}/auth/v3/tenant_access_token/internal",
                        json={
                            "app_id": self.app_id,
                            "app_secret": self.app_secret
                        },
                        headers={"Content-Type": CONTENT_TYPE_JSON}
                    )
                    data = response.json()
                    
                    if data.get("code") == 0:
                        self.access_token = data.get("tenant_access_token")
                        expires_in = data.get("expire", 7200)  # Default 2 hours
                        self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                        log_event("lark_token_refreshed", expires_in=expires_in)
                        return self.access_token
                    else:
                        log_event("lark_token_refresh_failed", response=data)
                        return None
            except Exception as e:
                log_event("lark_token_refresh_error", error=str(e))
                return None
    
    def _get_auth_headers(self, token: str) -> Dict[str, str]:
        """
        Get HTTP headers with authorization for Lark API calls.
        
        Example usage:
        headers = self._get_auth_headers(access_token)
        response = await client.patch(url, json=payload, headers=headers)
        """
        return {
            "Content-Type": CONTENT_TYPE_JSON,
            "Authorization": f"Bearer {token}"
        }

    async def upload_image_bytes(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Upload in-memory image bytes to Lark and get the image_key.
        """
        access_token = await self.get_access_token()
        if not access_token:
            return {"success": False, "error": "Failed to get access token"}

        try:
            files = {
                "image": (filename, image_bytes, "image/png"),
                "image_type": (None, "message")
            }
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{LARK_BASE_URL}/im/v1/images",
                    files=files,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                data = response.json()

            if data.get("code") == 0:
                return {"success": True, "image_key": data.get("data", {}).get("image_key")}

            return {
                "success": False,
                "error": data.get("msg", "Unknown error"),
                "code": data.get("code")
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to upload image bytes: {str(e)}"}

    def _get_week_window(self, reference_dt: Optional[datetime]) -> Tuple[datetime, datetime]:
        """
        Get the Monday-Friday window for the week containing reference_dt.
        Falls back to the next Monday if called on Saturday/Sunday.
        """
        if reference_dt is None:
            reference_dt = get_ph_now()
        ph_dt = utc_to_ph(reference_dt)
        weekday = ph_dt.weekday()
        if weekday >= 5:
            days_until_monday = (7 - weekday) % 7
            monday = ph_dt + timedelta(days=days_until_monday)
        else:
            monday = ph_dt - timedelta(days=weekday)
        friday = monday + timedelta(days=4)
        return monday, friday

    async def _build_date_previews(
        self,
        signature_file_path: Optional[str],
        monday: datetime,
        signature_id: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Generate and upload 5 signature+date preview images for Monday-Friday.
        
        PRIORITY: Use frontend-captured previews from preview_storage if available.
        This ensures Lark displays EXACTLY the same images as the frontend preview.
        Falls back to backend generation with handwriting_gan only if no frontend
        previews exist.
        """
        if not signature_file_path:
            return []

        signature_path = Path(__file__).resolve().parent.parent.parent / signature_file_path.lstrip("/")
        if not signature_path.exists():
            return []

        previews: List[Dict[str, str]] = []
        
        # PRIORITY 1: Use frontend-captured previews if available
        if signature_id:
            frontend_previews = load_latest_preview_set(signature_id)
            if frontend_previews and frontend_previews.get("files"):
                files_info = frontend_previews.get("files", [])
                date_labels = frontend_previews.get("date_labels", [])
                
                for day_offset, file_info in enumerate(files_info[:5]):
                    file_path = file_info.get("path") if isinstance(file_info, dict) else None
                    if not file_path:
                        continue
                    
                    file_path_obj = Path(file_path)
                    if not file_path_obj.exists():
                        continue
                    
                    # Read the frontend-captured image and upload to Lark
                    image_bytes = file_path_obj.read_bytes()
                    upload_result = await self.upload_image_bytes(
                        image_bytes,
                        filename=f"signature_date_preview_{day_offset + 1}.png"
                    )
                    if not upload_result.get("success"):
                        log_event(
                            "lark_frontend_preview_upload_failed",
                            date=f"day_{day_offset + 1}",
                            error=upload_result.get("error"),
                            lark_code=upload_result.get("code")
                        )
                        continue
                    
                    preview_date = monday + timedelta(days=day_offset)
                    date_label = date_labels[day_offset] if day_offset < len(date_labels) else file_info.get("date_label", "")
                    
                    previews.append({
                        "date_label": date_label,
                        "day_name": preview_date.strftime("%A"),
                        "image_key": upload_result.get("image_key", "")
                    })
                
                if len(previews) == 5:
                    log_event(
                        "lark_using_frontend_previews",
                        signature_id=signature_id,
                        count=len(previews)
                    )
                    return previews
                else:
                    log_event(
                        "lark_frontend_previews_incomplete",
                        signature_id=signature_id,
                        found=len(previews),
                        expected=5
                    )
                    previews = []  # Reset and fall back
        
        # FALLBACK: Generate using backend handwriting_gan
        for day_offset in range(5):
            preview_date = monday + timedelta(days=day_offset)
            composite_result = await handwriting_gan.composite_signature_with_custom_date(
                signature_path=str(signature_path),
                date=preview_date,
                output_width=240,
                output_height=90,
                format_string="M.D.YY",
                date_font_height=30
            )
            if not composite_result.get("success"):
                log_event(
                    "lark_preview_generate_failed",
                    date=preview_date.isoformat(),
                    error=composite_result.get("error")
                )
                continue

            upload_result = await self.upload_image_bytes(
                composite_result.get("image_bytes", b""),
                filename=f"signature_date_preview_{day_offset + 1}.png"
            )
            if not upload_result.get("success"):
                log_event(
                    "lark_preview_upload_failed",
                    date=preview_date.isoformat(),
                    error=upload_result.get("error"),
                    lark_code=upload_result.get("code")
                )
                continue

            date_label = composite_result.get("date_string")
            if not date_label:
                date_label = handwriting_gan._format_custom_date(preview_date, "M.D.YY")

            previews.append({
                "date_label": date_label,
                "day_name": preview_date.strftime("%A"),
                "image_key": upload_result.get("image_key", "")
            })

        return previews

    def _build_preview_elements(
        self,
        date_previews: Optional[List[Dict[str, str]]],
        signature_preview_url: str
    ) -> List[Dict[str, Any]]:
        elements: List[Dict[str, Any]] = [
            {"tag": "hr"},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "**Handwritten Date Preview (Auto-Generated):**"
                }
            }
        ]

        if date_previews:
            for row_start in range(0, len(date_previews), 3):
                row_items = date_previews[row_start:row_start + 3]
                columns = []
                for preview in row_items:
                    columns.append({
                        "tag": "column",
                        "width": "weighted",
                        "weight": 1,
                        "vertical_align": "top",
                        "elements": [
                            {
                                "tag": "img",
                                "img_key": preview.get("image_key", ""),
                                "scale_type": "fit_horizontal",
                                "alt": {
                                    "tag": "plain_text",
                                    "content": preview.get("date_label", "Signature and date preview")
                                }
                            }
                        ]
                    })
                elements.append({
                    "tag": "column_set",
                    "flex_mode": "none",
                    "background_style": "default",
                    "columns": columns
                })
        elif signature_preview_url:
            elements.append({
                "tag": "img",
                "img_key": signature_preview_url,
                "alt": {"tag": "plain_text", "content": "Signature Preview"}
            })
        else:
            elements.append({
                "tag": "note",
                "elements": [
                    {"tag": "plain_text", "content": "Signature preview not available."}
                ]
            })

        return elements

    def _build_final_action_block(self, final_status: str) -> Dict[str, Any]:
        if final_status == STATUS_APPROVED:
            actions = [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "APPROVED"},
                    "type": "primary",
                    "disabled": True,
                    "value": {"action": "approve", "signature_id": 0}
                }
            ]
        elif final_status == STATUS_REJECTED:
            actions = [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "REJECTED"},
                    "type": "danger",
                    "disabled": True,
                    "value": {"action": "reject", "signature_id": 0}
                }
            ]
        else:
            actions = []

        return {
            "tag": "action",
            "actions": actions
        }

    def _build_superseded_action_block(self) -> Dict[str, Any]:
        return {
            "tag": "action",
            "actions": [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "SUPERSEDED"},
                    "type": "default",
                    "disabled": True,
                    "value": {"action": "noop", "signature_id": 0}
                }
            ]
        }
    
    # =========================================================================
    # 5️⃣ Card Builder Functions
    # =========================================================================
    
    def build_pending_card(
        self,
        signature_id: int,
        signature_preview_url: str,
        requested_by: str,
        validity_period: str = "1 Week",
        purpose: str = "DL Generation",
        admin_message: Optional[str] = None,
        date_previews: Optional[List[Dict[str, str]]] = None,
        request_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Build a pending approval card with active Approve/Reject buttons.
        
        Follows Lark Card v2.0 schema.
        Reference: https://open.larksuite.com/document/client-docs/messenger-builder/overview
        """
        today = format_ph_datetime(get_ph_now(), "%A, %B %d, %Y")
        
        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📅 Date Today:** {today}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**🔸 Status:** 🟡 PENDING"
                }
            },
            {"tag": "hr"},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**👤 Requested By:** {requested_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**⏱️ Validity Period:** {validity_period}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**📝 Purpose:** {purpose}"
                }
            }
        ]
        
        # Add admin message if provided
        if admin_message:
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**💬 Message:** {admin_message}"
                }
            })
        
        elements.extend(self._build_preview_elements(date_previews, signature_preview_url))
        
        # Add Approve/Reject buttons
        elements.append({"tag": "hr"})
        elements.append({
            "tag": "action",
            "actions": [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "✅ Approve"},
                    "type": "primary",
                    "value": {
                        "action": "approve",
                        "signature_id": signature_id,
                        "request_id": request_id
                    }
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "❌ Reject"},
                    "type": "danger",
                    "value": {
                        "action": "reject",
                        "signature_id": signature_id,
                        "request_id": request_id
                    }
                }
            ]
        })
        
        return {
            "config": {"wide_screen_mode": True, "update_multi": True},
            "header": {
                "title": {"tag": "plain_text", "content": "📋 Signature Approval Request"},
                "template": "orange"
            },
            "elements": elements
        }
    
    def build_approved_card(
        self,
        signature_id: int,
        signature_preview_url: str,
        requested_by: str,
        approved_by: str,
        approved_at: str,
        validity_period: str = "1 Week",
        purpose: str = "DL Generation",
        admin_message: Optional[str] = None,
        date_previews: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Build an approved card with disabled buttons and approval info.

        Key differences from pending card:
        - Status shows "APPROVED" in green
        - Approver name and timestamp displayed
        - Buttons are removed (card is final state)
        - Header template is green
        """
        today = format_ph_datetime(get_ph_now(), "%A, %B %d, %Y")

        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Date Today:** {today}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "**Status:** **APPROVED**"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Signature ID:** {signature_id}"
                }
            },
            {"tag": "hr"},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Requested By:** {requested_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Approved By:** {approved_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Approved At:** {approved_at}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Validity Period:** {validity_period}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Purpose:** {purpose}"
                }
            }
        ]

        if admin_message:
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Message:** {admin_message}"
                }
            })

        elements.extend(self._build_preview_elements(date_previews, signature_preview_url))
        elements.append({"tag": "hr"})
        elements.append({
            "tag": "note",
            "elements": [
                {
                    "tag": "plain_text",
                    "content": "This signature has been approved and is now active."
                }
            ]
        })
        elements.append(self._build_final_action_block(STATUS_APPROVED))

        return {
            "config": {"wide_screen_mode": True, "update_multi": True},
            "header": {
                "title": {"tag": "plain_text", "content": "Signature Approved"},
                "template": "green"
            },
            "elements": elements
        }

    def build_rejected_card(
        self,
        signature_id: int,
        signature_preview_url: str,
        requested_by: str,
        rejected_by: str,
        rejected_at: str,
        validity_period: str = "1 Week",
        purpose: str = "DL Generation",
        admin_message: Optional[str] = None,
        rejection_reason: Optional[str] = None,
        date_previews: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Build a rejected card with disabled buttons and rejection info.

        Key differences from pending card:
        - Status shows "REJECTED" in red
        - Rejector name and timestamp displayed
        - Optional rejection reason
        - Buttons are removed (card is final state)
        - Header template is red
        """
        today = format_ph_datetime(get_ph_now(), "%A, %B %d, %Y")

        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Date Today:** {today}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "**Status:** **REJECTED**"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Signature ID:** {signature_id}"
                }
            },
            {"tag": "hr"},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Requested By:** {requested_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Rejected By:** {rejected_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Rejected At:** {rejected_at}"
                }
            }
        ]

        if rejection_reason:
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Reason:** {rejection_reason}"
                }
            })

        elements.extend([
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Validity Period:** {validity_period}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Purpose:** {purpose}"
                }
            }
        ])

        if admin_message:
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Message:** {admin_message}"
                }
            })

        elements.extend(self._build_preview_elements(date_previews, signature_preview_url))
        elements.append({"tag": "hr"})
        elements.append({
            "tag": "note",
            "elements": [
                {
                    "tag": "plain_text",
                    "content": "This signature request has been rejected."
                }
            ]
        })
        elements.append(self._build_final_action_block(STATUS_REJECTED))

        return {
            "config": {"wide_screen_mode": True, "update_multi": True},
            "header": {
                "title": {"tag": "plain_text", "content": "Signature Rejected"},
                "template": "red"
            },
            "elements": elements
        }

    def build_superseded_card(
        self,
        signature_id: int,
        signature_preview_url: str,
        requested_by: str,
        superseded_by: str,
        superseded_at: str,
        validity_period: str = "1 Week",
        purpose: str = "DL Generation",
        admin_message: Optional[str] = None,
        date_previews: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        today = format_ph_datetime(get_ph_now(), "%A, %B %d, %Y")

        elements = [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Date Today:** {today}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "**Status:** **SUPERSEDED**"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Signature ID:** {signature_id}"
                }
            },
            {"tag": "hr"},
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Requested By:** {requested_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Superseded By:** {superseded_by}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Superseded At:** {superseded_at}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Validity Period:** {validity_period}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Purpose:** {purpose}"
                }
            }
        ]

        if admin_message:
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Message:** {admin_message}"
                }
            })

        elements.extend(self._build_preview_elements(date_previews, signature_preview_url))
        elements.append({"tag": "hr"})
        elements.append({
            "tag": "note",
            "elements": [
                {
                    "tag": "plain_text",
                    "content": "This request was superseded by a newer approval request."
                }
            ]
        })
        elements.append(self._build_superseded_action_block())

        return {
            "config": {"wide_screen_mode": True, "update_multi": True},
            "header": {
                "title": {"tag": "plain_text", "content": "Signature Request Superseded"},
                "template": "grey"
            },
            "elements": elements
        }


    # =========================================================================
    # 6️⃣ Message Update API Call
    # =========================================================================
    
    async def update_message_card(
        self,
        message_id: str,
        card_content: Dict[str, Any],
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Update the original Lark message card using PATCH API.
        
        API Endpoint:
        PATCH https://open.larksuite.com/open-apis/im/v1/messages/{message_id}
        
        Headers:
        - Content-Type: application/json; charset=utf-8
        - Authorization: Bearer {tenant_access_token}
        
        Payload Structure:
        {
            "msg_type": "interactive",
            "content": <JSON string of card content>
        }
        
        Retry Strategy:
        - Retry once on 401 to refresh token
        - Do not retry other errors to keep webhook fast
        """
        access_token = await self.get_access_token()
        if not access_token:
            return {"success": False, "error": "Failed to get access token"}
        
        url = f"{LARK_BASE_URL}/im/v1/messages/{message_id}"
        headers = self._get_auth_headers(access_token)
        
        # Payload for message update
        payload = {
            "msg_type": "interactive",
            "content": json.dumps(card_content)
        }
        
        last_error = None
        methods = ["PATCH", "PUT"]

        for method in methods:
            attempts = 0
            while attempts < max_retries:
                attempts += 1
                try:
                    log_event(
                        "lark_message_update_request",
                        method=method,
                        message_id=message_id,
                        attempt=attempts
                    )
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        response = await client.request(method, url, json=payload, headers=headers)

                    try:
                        data = response.json()
                    except ValueError:
                        data = {}

                    if response.status_code == 401:
                        log_event(
                            "lark_message_update_unauthorized",
                            message_id=message_id,
                            http_status=response.status_code,
                            attempt=attempts
                        )
                        self.access_token = None
                        self.token_expires_at = None
                        access_token = await self.get_access_token()
                        if not access_token:
                            return {"success": False, "error": "Failed to refresh access token"}
                        headers = self._get_auth_headers(access_token)
                        continue

                    if data.get("code") == 0:
                        log_event(
                            "lark_message_update_success",
                            message_id=message_id,
                            method=method,
                            http_status=response.status_code,
                            lark_code=0
                        )
                        return {
                            "success": True,
                            "data": data,
                            "status_code": response.status_code,
                            "method": method
                        }

                    if method == "PATCH" and response.status_code in (404, 405):
                        log_event(
                            "lark_message_update_fallback",
                            message_id=message_id,
                            http_status=response.status_code,
                            lark_code=data.get("code"),
                            lark_msg=data.get("msg")
                        )
                        break

                    error_code = data.get("code")
                    error_msg = data.get("msg", "Unknown error")
                    log_event(
                        "lark_message_update_failed",
                        message_id=message_id,
                        method=method,
                        http_status=response.status_code,
                        lark_code=error_code,
                        lark_msg=error_msg,
                        response=data
                    )
                    return {
                        "success": False,
                        "error": error_msg,
                        "code": error_code,
                        "status_code": response.status_code,
                        "data": data,
                        "method": method
                    }
                except httpx.TimeoutException:
                    last_error = "Request timeout"
                    log_event(
                        "lark_message_update_timeout",
                        message_id=message_id,
                        method=method,
                        attempt=attempts
                    )
                    break
                except Exception as e:
                    last_error = str(e)
                    log_event(
                        "lark_message_update_error",
                        message_id=message_id,
                        method=method,
                        attempt=attempts,
                        error=str(e)
                    )
                    break

        return {"success": False, "error": last_error or "Message update failed"}

    async def delete_message(self, message_id: str) -> Dict[str, Any]:
        """
        Delete (recall) a Lark message by message_id.
        """
        access_token = await self.get_access_token()
        if not access_token:
            return {"success": False, "error": "Failed to get access token"}

        url = f"{LARK_BASE_URL}/im/v1/messages/{message_id}"
        headers = self._get_auth_headers(access_token)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(url, headers=headers)
            data = response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

        if data.get("code") == 0:
            log_event("lark_message_delete_success", message_id=message_id)
            return {"success": True, "data": data}

        error_msg = data.get("msg", "Unknown error")
        log_event(
            "lark_message_delete_failed",
            message_id=message_id,
            http_status=response.status_code,
            lark_code=data.get("code"),
            lark_msg=error_msg
        )
        return {"success": False, "error": error_msg, "data": data}

    async def send_card_message(
        self,
        receive_id: str,
        receive_id_type: str,
        card_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send a new interactive card message to a chat or user.
        """
        access_token = await self.get_access_token()
        if not access_token:
            return {"success": False, "error": "Failed to get access token"}

        url = f"{LARK_BASE_URL}/im/v1/messages"
        headers = self._get_auth_headers(access_token)
        payload = {
            "receive_id": receive_id,
            "msg_type": "interactive",
            "content": json.dumps(card_content)
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    params={"receive_id_type": receive_id_type},
                    json=payload,
                    headers=headers
                )
            data = response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

        if data.get("code") == 0:
            message_id = data.get("data", {}).get("message_id")
            log_event(
                "lark_message_send_success",
                message_id=message_id,
                receive_id_type=receive_id_type
            )
            return {"success": True, "data": data, "message_id": message_id}

        error_msg = data.get("msg", "Unknown error")
        log_event(
            "lark_message_send_failed",
            receive_id_type=receive_id_type,
            lark_code=data.get("code"),
            lark_msg=error_msg
        )
        return {"success": False, "error": error_msg, "data": data}
    
    # =========================================================================
    # 2️⃣ & 3️⃣ Webhook Handler with Idempotency
    # =========================================================================
    
    async def process_signature_action(
        self,
        signature_id: Optional[int],
        request_id: Optional[int],
        action: str,
        operator_open_id: str,
        operator_user_id: str,
        event_id: Optional[str],
        event_type: Optional[str],
        open_message_id: str
    ) -> Dict[str, Any]:
        """
        Update approval request and signature asset with idempotent DB guards.
        """
        approver_name = operator_user_id or operator_open_id or "Unknown User"
        responded_at = datetime.now(timezone.utc)
        responded_at_ph = format_ph_datetime(get_ph_now(), "%B %d, %Y at %I:%M %p PHT")
        new_status = STATUS_APPROVED if action == "approve" else STATUS_REJECTED

        async with async_session() as session:
            async with session.begin():
                approval_request = None
                if request_id:
                    result = await session.execute(
                        select(SignatureApprovalRequest)
                        .where(SignatureApprovalRequest.id == request_id)
                    )
                    approval_request = result.scalar_one_or_none()
                elif signature_id:
                    result = await session.execute(
                        select(SignatureApprovalRequest)
                        .where(SignatureApprovalRequest.signature_id == signature_id)
                        .order_by(SignatureApprovalRequest.created_at.desc())
                        .limit(1)
                    )
                    approval_request = result.scalar_one_or_none()

                if not approval_request:
                    return {
                        "changed": False,
                        "already_processed": False,
                        "error": "No approval request found"
                    }

                signature_id = approval_request.signature_id
                sig_result = await session.execute(
                    select(SignatureAsset).where(SignatureAsset.id == signature_id)
                )
                signature = sig_result.scalar_one_or_none()
                if not signature:
                    return {
                        "changed": False,
                        "already_processed": False,
                        "error": f"Signature {signature_id} not found"
                    }

                approval_snapshot = {
                    "status": approval_request.status,
                    "responded_by": approval_request.responded_by,
                    "responded_at": approval_request.responded_at,
                    "approval_request_id": approval_request.id,
                    "requested_by": str(approval_request.requested_by) if approval_request.requested_by else "Admin",
                    "request_created_at": approval_request.created_at,
                    "message_id": approval_request.lark_message_id or open_message_id
                }
                signature_snapshot = {
                    "lark_image_key": signature.lark_image_key,
                    "file_path": signature.file_path,
                    "validity_period": signature.validity_period,
                    "purpose": signature.purpose,
                    "admin_message": signature.admin_message
                }

                if event_id:
                    existing_event = await session.execute(
                        select(LarkEventDedupe.id)
                        .where(LarkEventDedupe.event_id == event_id)
                        .limit(1)
                    )
                    if existing_event.scalar_one_or_none():
                        responded_at_display = format_ph_datetime(
                            approval_snapshot["responded_at"], "%B %d, %Y at %I:%M %p PHT"
                        ) if approval_snapshot["responded_at"] else ""
                        log_event(
                            "lark_event_deduped",
                            event_id=event_id,
                            event_type=event_type,
                            signature_id=signature_id,
                            open_message_id=open_message_id
                        )
                        return {
                            "changed": False,
                            "already_processed": True,
                            "final_status": approval_snapshot["status"],
                            "responded_by": approval_snapshot["responded_by"],
                            "responded_at": responded_at_display,
                            "rows_updated": 0,
                            "signature_id": signature_id,
                            "approval_request_id": approval_snapshot["approval_request_id"],
                            "requested_by": approval_snapshot["requested_by"],
                            "request_created_at": approval_snapshot["request_created_at"],
                            "message_id": approval_snapshot["message_id"],
                            "signature": signature_snapshot
                        }
                    try:
                        session.add(LarkEventDedupe(
                            event_id=event_id,
                            event_type=event_type,
                            open_message_id=open_message_id,
                            signature_id=signature_id,
                            operator_open_id=operator_open_id,
                            operator_user_id=operator_user_id
                        ))
                        await session.flush()
                    except IntegrityError:
                        await session.rollback()
                        responded_at_display = format_ph_datetime(
                            approval_snapshot["responded_at"], "%B %d, %Y at %I:%M %p PHT"
                        ) if approval_snapshot["responded_at"] else ""
                        log_event(
                            "lark_event_deduped",
                            event_id=event_id,
                            event_type=event_type,
                            signature_id=signature_id,
                            open_message_id=open_message_id
                        )
                        return {
                            "changed": False,
                            "already_processed": True,
                            "final_status": approval_snapshot["status"],
                            "responded_by": approval_snapshot["responded_by"],
                            "responded_at": responded_at_display,
                            "rows_updated": 0,
                            "signature_id": signature_id,
                            "approval_request_id": approval_snapshot["approval_request_id"],
                            "requested_by": approval_snapshot["requested_by"],
                            "request_created_at": approval_snapshot["request_created_at"],
                            "message_id": approval_snapshot["message_id"],
                            "signature": signature_snapshot
                        }

                if request_id and approval_request.status == STATUS_PENDING:
                    latest_pending_result = await session.execute(
                        select(SignatureApprovalRequest.id)
                        .where(SignatureApprovalRequest.signature_id == signature_id)
                        .where(SignatureApprovalRequest.status == STATUS_PENDING)
                        .order_by(SignatureApprovalRequest.created_at.desc())
                        .limit(1)
                    )
                    latest_pending_id = latest_pending_result.scalar_one_or_none()
                    if latest_pending_id and approval_request.id != latest_pending_id:
                        await session.execute(
                            update(SignatureApprovalRequest)
                            .where(SignatureApprovalRequest.id == approval_request.id)
                            .where(SignatureApprovalRequest.status == STATUS_PENDING)
                            .values(
                                status=STATUS_SUPERSEDED,
                                responded_by=approver_name,
                                responded_at=responded_at
                            )
                        )
                        log_event(
                            "lark_request_superseded",
                            event_id=event_id,
                            signature_id=signature_id,
                            approval_request_id=approval_request.id,
                            latest_request_id=latest_pending_id
                        )
                        return {
                            "changed": False,
                            "already_processed": True,
                            "final_status": STATUS_SUPERSEDED,
                            "responded_by": approver_name,
                            "responded_at": responded_at_ph,
                            "rows_updated": 0,
                            "signature_id": signature_id,
                            "approval_request_id": approval_request.id,
                            "requested_by": approval_snapshot["requested_by"],
                            "request_created_at": approval_request.created_at,
                            "message_id": approval_snapshot["message_id"],
                            "signature": signature_snapshot,
                            "superseded_requests": []
                        }

                message_id = open_message_id or approval_request.lark_message_id or ""
                update_values = {
                    "status": new_status,
                    "responded_by": approver_name,
                    "responded_at": responded_at,
                    "lark_user_id": operator_open_id
                }
                if message_id:
                    update_values["lark_message_id"] = message_id

                update_result = await session.execute(
                    update(SignatureApprovalRequest)
                    .where(SignatureApprovalRequest.id == approval_request.id)
                    .where(SignatureApprovalRequest.status == STATUS_PENDING)
                    .values(**update_values)
                )
                rows_updated = update_result.rowcount or 0

                if rows_updated == 0:
                    current_result = await session.execute(
                        select(SignatureApprovalRequest)
                        .where(SignatureApprovalRequest.id == approval_request.id)
                    )
                    current = current_result.scalar_one_or_none() or approval_request
                    responded_at_display = format_ph_datetime(
                        current.responded_at, "%B %d, %Y at %I:%M %p PHT"
                    )
                    return {
                        "changed": False,
                        "already_processed": True,
                        "final_status": current.status,
                        "responded_by": current.responded_by,
                        "responded_at": responded_at_display,
                        "rows_updated": rows_updated,
                        "signature_id": signature_id,
                        "approval_request_id": approval_request.id,
                        "requested_by": str(approval_request.requested_by) if approval_request.requested_by else "Admin",
                        "request_created_at": approval_request.created_at,
                        "message_id": current.lark_message_id or message_id
                        ,
                        "signature": {
                            "lark_image_key": signature.lark_image_key,
                            "file_path": signature.file_path,
                            "validity_period": signature.validity_period,
                            "purpose": signature.purpose,
                            "admin_message": signature.admin_message
                        },
                        "superseded_requests": []
                    }

                superseded_requests: List[Dict[str, Any]] = []
                other_pending_result = await session.execute(
                    select(SignatureApprovalRequest)
                    .where(SignatureApprovalRequest.signature_id == signature_id)
                    .where(SignatureApprovalRequest.status == STATUS_PENDING)
                    .where(SignatureApprovalRequest.id != approval_request.id)
                )
                other_pending = other_pending_result.scalars().all()
                if other_pending:
                    for pending_req in other_pending:
                        superseded_requests.append({
                            "approval_request_id": pending_req.id,
                            "message_id": pending_req.lark_message_id,
                            "requested_by": str(pending_req.requested_by) if pending_req.requested_by else "Admin",
                            "request_created_at": pending_req.created_at
                        })
                    await session.execute(
                        update(SignatureApprovalRequest)
                        .where(SignatureApprovalRequest.signature_id == signature_id)
                        .where(SignatureApprovalRequest.status == STATUS_PENDING)
                        .where(SignatureApprovalRequest.id != approval_request.id)
                        .values(
                            status=STATUS_SUPERSEDED,
                            responded_by=approver_name,
                            responded_at=responded_at
                        )
                    )

                if action == "approve":
                    await session.execute(
                        update(SignatureAsset)
                        .where(SignatureAsset.id == signature_id)
                        .values(
                            status=STATUS_APPROVED,
                            approved_by=approver_name,
                            approved_at=responded_at
                        )
                    )
                else:
                    await session.execute(
                        update(SignatureAsset)
                        .where(SignatureAsset.id == signature_id)
                        .values(status=STATUS_REJECTED)
                    )

                audit_log = AuditLog(
                    action="signature_approved_lark" if action == "approve" else "signature_rejected_lark",
                    resource_type="signature",
                    resource_id=signature_id,
                    details=json.dumps({
                        "signature_id": signature_id,
                        "approval_request_id": approval_request.id,
                        "action": action,
                        "operator_open_id": operator_open_id,
                        "operator_user_id": operator_user_id,
                        "message_id": open_message_id,
                        "event_id": event_id,
                        "via": "lark_button_callback"
                    }),
                    status="success"
                )
                session.add(audit_log)

            requested_by_label = (
                str(approval_request.requested_by)
                if approval_request.requested_by
                else "Admin"
            )
            return {
                "changed": True,
                "already_processed": False,
                "final_status": new_status,
                "responded_by": approver_name,
                "responded_at": responded_at_ph,
                "rows_updated": rows_updated,
                "signature_id": signature_id,
                "approval_request_id": approval_request.id,
                "requested_by": requested_by_label,
                "request_created_at": approval_request.created_at,
                "message_id": message_id,
                "signature": {
                    "lark_image_key": signature.lark_image_key,
                    "file_path": signature.file_path,
                    "validity_period": signature.validity_period,
                    "purpose": signature.purpose,
                    "admin_message": signature.admin_message
                },
                "superseded_requests": superseded_requests
            }

    async def process_button_callback(
        self,
        payload: Dict[str, Any]
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Process a button callback from Lark webhook.

        This function handles:
        1. Request validation and parsing
        2. Idempotency check (prevent double execution)
        3. Database update with DB guard
        4. Card update via Message Update API
        """
        try:
            header = payload.get("header", {})
            event = payload.get("event", {})
            event_id = header.get("event_id", "")
            event_type = header.get("event_type", "")

            operator = event.get("operator", {})
            operator_open_id = operator.get("open_id", "")
            operator_user_id = operator.get("user_id", "")

            action_data = event.get("action", {})
            raw_value = action_data.get("value")
            button_value = parse_lark_action_value(raw_value)

            action = button_value.get("action")
            signature_id_raw = button_value.get("signature_id") or button_value.get("signatureId")
            request_id_raw = button_value.get("request_id") or button_value.get("requestId")

            if button_value.get("click") == "button_clicked" and not action:
                log_event("lark_old_card_value_detected", event_id=event_id)
                return False, "This is an old template-based card. Please send a new approval request.", None

            def _parse_int(value):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    return None

            signature_id = _parse_int(signature_id_raw)
            request_id = _parse_int(request_id_raw)

            context = event.get("context", {}) or {}
            message = event.get("message", {}) or {}
            open_message_id = (
                context.get("open_message_id")
                or message.get("message_id")
                or message.get("open_message_id")
                or event.get("open_message_id")
                or payload.get("open_message_id")
                or ""
            )
            open_chat_id = (
                context.get("open_chat_id")
                or message.get("chat_id")
                or event.get("open_chat_id")
                or payload.get("open_chat_id")
                or ""
            )

            raw_event_token = event.get("token") or payload.get("token") or ""
            if not event_id and raw_event_token:
                event_id = raw_event_token
            if not event_id and open_message_id:
                event_id = f"legacy-{open_message_id}"
            if not event_type:
                event_type = "card.action.trigger"

            log_event(
                "lark_button_event",
                event_id=event_id,
                event_type=event_type,
                open_message_id=open_message_id,
                open_chat_id=open_chat_id,
                operator_open_id=operator_open_id,
                operator_user_id=operator_user_id,
                action=action,
                signature_id=signature_id,
                request_id=request_id
            )

            if not action or action not in ["approve", "reject"]:
                return False, f"Invalid action: {action}", None

            if signature_id is None and request_id is None:
                return False, "Missing signature_id or request_id", None

            if not open_message_id:
                log_event("lark_message_id_missing", event_id=event_id)

            message_id_for_update = open_message_id
            lock_id = signature_id or request_id
            if lock_id:
                lock = _get_approval_lock(lock_id)
                async with lock:
                    result = await self.process_signature_action(
                        signature_id=signature_id,
                        request_id=request_id,
                        action=action,
                        operator_open_id=operator_open_id,
                        operator_user_id=operator_user_id,
                        event_id=event_id,
                        event_type=event_type,
                        open_message_id=open_message_id
                    )
            else:
                result = await self.process_signature_action(
                    signature_id=signature_id,
                    request_id=request_id,
                    action=action,
                    operator_open_id=operator_open_id,
                    operator_user_id=operator_user_id,
                    event_id=event_id,
                    event_type=event_type,
                    open_message_id=open_message_id
                )

            if result.get("error"):
                return False, result["error"], None

            if not message_id_for_update:
                message_id_for_update = result.get("message_id") or ""

            status_message = "Signature approved successfully" if action == "approve" else "Signature rejected"
            log_event(
                "lark_approval_updated",
                event_id=event_id,
                status=result.get("final_status"),
                signature_id=result.get("signature_id"),
                rows_updated=result.get("rows_updated")
            )

            if result.get("already_processed"):
                log_event(
                    "lark_approval_already_processed",
                    event_id=event_id,
                    status=result.get("final_status"),
                    signature_id=result.get("signature_id"),
                    request_id=result.get("approval_request_id"),
                    rows_updated=result.get("rows_updated")
                )

            if message_id_for_update:
                async def _apply_card_update() -> None:
                    try:
                        signature_data = result.get("signature", {})
                        signature_preview_key = signature_data.get("lark_image_key") or ""
                        request_created_at = result.get("request_created_at")
                        week_monday, week_friday = self._get_week_window(request_created_at)
                        validity_label = f"{format_ph_datetime(week_monday, '%B %d, %Y')} - {format_ph_datetime(week_friday, '%B %d, %Y')}"
                        validity_period = f"1 Week ({validity_label})"
                        week_key = week_monday.date().isoformat()
                        date_previews = get_cached_previews(result.get("signature_id"), week_key)
                        if not date_previews:
                            date_previews = await self._build_date_previews(
                                signature_data.get("file_path"),
                                week_monday,
                                signature_id=result.get("signature_id")
                            )
                            if date_previews:
                                set_cached_previews(result.get("signature_id"), week_key, date_previews)

                        final_status = result.get("final_status") or ""
                        normalized_action = action
                        if final_status == STATUS_APPROVED:
                            normalized_action = "approve"
                        elif final_status == STATUS_REJECTED:
                            normalized_action = "reject"
                        elif final_status == STATUS_SUPERSEDED:
                            normalized_action = "superseded"

                        if normalized_action == "approve":
                            updated_card = self.build_approved_card(
                                signature_id=result.get("signature_id"),
                                signature_preview_url=signature_preview_key,
                                requested_by=result.get("requested_by") or "Admin",
                                approved_by=result.get("responded_by") or "Unknown User",
                                approved_at=result.get("responded_at") or "",
                                validity_period=validity_period,
                                purpose=signature_data.get("purpose") or "DL Generation",
                                admin_message=signature_data.get("admin_message"),
                                date_previews=date_previews
                            )
                        elif normalized_action == "reject":
                            updated_card = self.build_rejected_card(
                                signature_id=result.get("signature_id"),
                                signature_preview_url=signature_preview_key,
                                requested_by=result.get("requested_by") or "Admin",
                                rejected_by=result.get("responded_by") or "Unknown User",
                                rejected_at=result.get("responded_at") or "",
                                validity_period=validity_period,
                                purpose=signature_data.get("purpose") or "DL Generation",
                                admin_message=signature_data.get("admin_message"),
                                date_previews=date_previews
                            )
                        else:
                            updated_card = self.build_superseded_card(
                                signature_id=result.get("signature_id"),
                                signature_preview_url=signature_preview_key,
                                requested_by=result.get("requested_by") or "Admin",
                                superseded_by=result.get("responded_by") or "System",
                                superseded_at=result.get("responded_at") or "",
                                validity_period=validity_period,
                                purpose=signature_data.get("purpose") or "DL Generation",
                                admin_message=signature_data.get("admin_message"),
                                date_previews=date_previews
                            )

                        update_result = await self.update_message_card(
                            message_id=message_id_for_update,
                            card_content=updated_card
                        )
                        if not update_result.get("success"):
                            log_event(
                                "lark_card_update_failed",
                                event_id=event_id,
                                message_id=message_id_for_update,
                                error=update_result.get("error"),
                                lark_code=update_result.get("code"),
                                http_status=update_result.get("status_code")
                            )
                        else:
                            log_event(
                                "lark_card_update_applied",
                                event_id=event_id,
                                message_id=message_id_for_update,
                                http_status=update_result.get("status_code"),
                                method=update_result.get("method")
                            )

                        superseded_requests = result.get("superseded_requests") or []
                        if superseded_requests:
                            async def _apply_superseded_updates() -> None:
                                for superseded in superseded_requests:
                                    superseded_message_id = superseded.get("message_id")
                                    if not superseded_message_id:
                                        continue
                                    superseded_card = self.build_superseded_card(
                                        signature_id=result.get("signature_id"),
                                        signature_preview_url=signature_preview_key,
                                        requested_by=superseded.get("requested_by") or "Admin",
                                        superseded_by=result.get("responded_by") or "System",
                                        superseded_at=result.get("responded_at") or "",
                                        validity_period=validity_period,
                                        purpose=signature_data.get("purpose") or "DL Generation",
                                        admin_message=signature_data.get("admin_message"),
                                        date_previews=date_previews
                                    )
                                    update = await self.update_message_card(
                                        message_id=superseded_message_id,
                                        card_content=superseded_card
                                    )
                                    if update.get("success"):
                                        log_event(
                                            "lark_superseded_card_updated",
                                            message_id=superseded_message_id,
                                            approval_request_id=superseded.get("approval_request_id")
                                        )
                                    else:
                                        log_event(
                                            "lark_superseded_card_update_failed",
                                            message_id=superseded_message_id,
                                            approval_request_id=superseded.get("approval_request_id"),
                                            error=update.get("error")
                                        )

                            asyncio.create_task(_apply_superseded_updates())
                    except Exception as exc:
                        log_event(
                            "lark_card_update_error",
                            event_id=event_id,
                            message_id=message_id_for_update,
                            error=str(exc)
                        )

                asyncio.create_task(_apply_card_update())

            if result.get("already_processed"):
                return True, f"Already {result.get('final_status')}", {
                    "status": result.get("final_status"),
                    "responded_by": result.get("responded_by"),
                    "responded_at": result.get("responded_at"),
                    "rows_updated": result.get("rows_updated")
                }

            return True, status_message, {
                "status": result.get("final_status"),
                "responded_by": result.get("responded_by"),
                "responded_at": result.get("responded_at"),
                "rows_updated": result.get("rows_updated")
            }

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            log_event("lark_button_callback_error", error=str(e), traceback=error_details)
            return False, str(e), None



# =============================================================================
# Singleton Instance
# =============================================================================

lark_card_update_service = LarkCardUpdateService()
