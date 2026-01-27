"""
Lark Message Card Builder Service
=================================
Integrates with Lark Open API to send message cards using the Message Card Builder templates.

Reference: https://open.larksuite.com/document/client-docs/messenger-builder/overview

Key features:
- Uses Template Messages with template_id for rich card messages
- Sends approval request cards to designated users or self
- Auto-scheduler for Sunday requests with hourly retry
- Support for self-testing via Send Message API
"""

import asyncio
import json
import base64
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, LarkBotConfig, SignatureApprovalRequest, SignatureAsset, AuditLog
from app.services.handwriting_gan import handwriting_gan
from app.services.lark_preview_cache import get_cached_previews, set_cached_previews
from app.services.preview_storage import load_latest_preview_set

# Constants
LARK_BASE_URL = "https://open.larksuite.com/open-apis"
CONTENT_TYPE_JSON = "application/json; charset=utf-8"
ERROR_TOKEN_FAILED = "Failed to get access token"


class LarkMessageCardService:
    """
    Service for Lark Message Card Builder integration.
    
    Uses Lark Open API with template messages instead of custom webhooks.
    The Message Card Builder allows creating cards via drag-and-drop UI,
    then referencing them by template_id when sending messages.
    """
    
    def __init__(self):
        self.timeout = 30.0
        self.app_id: Optional[str] = None
        self.app_secret: Optional[str] = None
        self.template_id: Optional[str] = None
        self.self_user_id: Optional[str] = None
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        self._scheduler_running = False
        self._scheduler_task: Optional[asyncio.Task] = None
    
    # =========================================================================
    # Configuration Management
    # =========================================================================
    
    async def configure(
        self,
        app_id: str,
        app_secret: Optional[str] = None,
        template_id: Optional[str] = None,
        self_user_id: Optional[str] = None,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Configure Lark Open API credentials."""
        self.app_id = app_id
        
        # If no secret provided, load existing from database
        if not app_secret:
            existing_config = await self.get_config()
            if existing_config and existing_config.get("has_secret"):
                # Load existing secret from database
                async with async_session() as session:
                    result = await session.execute(
                        select(LarkBotConfig)
                        .where(LarkBotConfig.app_id == app_id)
                        .where(LarkBotConfig.is_active == True)
                        .order_by(LarkBotConfig.id.desc())
                        .limit(1)
                    )
                    config = result.scalar_one_or_none()
                    if config:
                        self.app_secret = config.secret_key
                    else:
                        return {"success": False, "message": "App Secret is required for new configuration"}
            else:
                return {"success": False, "message": "App Secret is required for new configuration"}
        else:
            self.app_secret = app_secret
        
        self.template_id = template_id
        self.self_user_id = self_user_id
        
        # Save to database
        await self._save_config(webhook_url)
        
        # Test access token
        token_result = await self._refresh_access_token()
        
        return {
            "success": token_result,
            "message": "Configuration saved successfully" if token_result else "Configuration saved but token refresh failed"
        }
    
    async def _save_config(self, webhook_url: Optional[str] = None):
        """Save configuration to database."""
        async with async_session() as session:
            # Deactivate existing configs
            await session.execute(
                update(LarkBotConfig).values(is_active=False)
            )
            
            # Create new config
            config = LarkBotConfig(
                app_id=self.app_id,
                secret_key=self.app_secret,
                template_id=self.template_id,
                self_user_id=self.self_user_id,
                webhook_url=webhook_url or "",
                is_active=True
            )
            session.add(config)
            await session.commit()
    
    async def _load_config(self) -> bool:
        """Load configuration from database."""
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
                self.template_id = config.template_id
                self.self_user_id = config.self_user_id
                return bool(self.app_id and self.app_secret)
            return False
    
    async def get_config(self) -> Optional[Dict[str, Any]]:
        """Get current configuration."""
        async with async_session() as session:
            result = await session.execute(
                select(LarkBotConfig)
                .where(LarkBotConfig.is_active == True)
                .order_by(LarkBotConfig.id.desc())
                .limit(1)
            )
            config = result.scalar_one_or_none()
            
            if config:
                return {
                    "id": config.id,
                    "app_id": config.app_id,
                    "template_id": config.template_id,
                    "self_user_id": config.self_user_id,
                    "webhook_url": config.webhook_url,
                    "has_secret": bool(config.secret_key),
                    "is_active": config.is_active,
                    "last_used_at": config.last_used_at.isoformat() if config.last_used_at else None
                }
            return None
    
    # =========================================================================
    # Access Token Management
    # =========================================================================
    
    async def _refresh_access_token(self) -> bool:
        """Get or refresh the tenant access token from Lark Open API."""
        if not self.app_id or not self.app_secret:
            loaded = await self._load_config()
            if not loaded:
                return False
        
        # Check if token is still valid (with 5 minute buffer)
        if self.access_token and self.token_expires_at:
            if datetime.now(timezone.utc) < self.token_expires_at - timedelta(minutes=5):
                return True
        
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
                    expires_in = data.get("expire", 7200)
                    self.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                    print(f" Lark access token refreshed (expires in {expires_in}s)")
                    return True
                else:
                    print(f" Failed to get Lark access token: {data.get('msg')}")
                    return False
        except Exception as e:
            print(f" Error getting Lark access token: {e}")
            return False
    
    # =========================================================================
    # Message Card Sending
    # =========================================================================
    
    async def send_template_message(
        self,
        receive_id: str,
        receive_id_type: str = "open_id",
        template_variable: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a message card using template_id.
        
        Uses the Lark Send Message API with template message format:
        {
            "type": "template",
            "data": {
                "template_id": "ctp_xxxxxxxxxxxx",
                "template_variable": {...}
            }
        }
        
        Args:
            receive_id: The recipient's ID (open_id, user_id, chat_id, email)
            receive_id_type: Type of receive_id (open_id, user_id, chat_id, email)
            template_variable: Variables to pass to the template
        """
        if not await self._refresh_access_token():
            return {"success": False, "error": "Failed to get access token. Please check App ID and App Secret."}
        
        if not self.template_id:
            return {"success": False, "error": "Template ID not configured. Please set up your Message Card template."}
        
        # Build template message content
        content = {
            "type": "template",
            "data": {
                "template_id": self.template_id,
                "template_variable": template_variable or {}
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{LARK_BASE_URL}/im/v1/messages",
                    params={"receive_id_type": receive_id_type},
                    json={
                        "receive_id": receive_id,
                        "msg_type": "interactive",
                        "content": json.dumps(content)
                    },
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": CONTENT_TYPE_JSON
                    }
                )
                data = response.json()
                
                if data.get("code") == 0:
                    return {
                        "success": True,
                        "message_id": data.get("data", {}).get("message_id"),
                        "message": "Message sent successfully!"
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("msg", "Unknown error"),
                        "code": data.get("code")
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def upload_image(self, image_path: str) -> Dict[str, Any]:
        """
        Upload an image to Lark and get the image_key.
        
        Reference: https://open.larksuite.com/document/server-docs/im-v1/image/create
        
        Args:
            image_path: Path to the image file on disk
        
        Returns:
            Dict with success status and image_key if successful
        """
        if not await self._refresh_access_token():
            return {"success": False, "error": ERROR_TOKEN_FAILED}
        
        try:
            # Read image file
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            # Prepare multipart form data
            files = {
                'image': ('signature.png', image_data, 'image/png'),
                'image_type': (None, 'message')
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{LARK_BASE_URL}/im/v1/images",
                    files=files,
                    headers={
                        "Authorization": f"Bearer {self.access_token}"
                    }
                )
                data = response.json()
                
                if data.get("code") == 0:
                    image_key = data.get("data", {}).get("image_key")
                    return {
                        "success": True,
                        "image_key": image_key,
                        "message": "Image uploaded successfully!"
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("msg", "Unknown error"),
                        "code": data.get("code")
                    }
        except Exception as e:
            return {"success": False, "error": f"Failed to upload image: {str(e)}"}

    async def upload_image_bytes(self, image_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Upload in-memory image bytes to Lark and get the image_key.
        """
        if not await self._refresh_access_token():
            return {"success": False, "error": ERROR_TOKEN_FAILED}

        try:
            files = {
                "image": (filename, image_bytes, "image/png"),
                "image_type": (None, "message")
            }
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{LARK_BASE_URL}/im/v1/images",
                    files=files,
                    headers={"Authorization": f"Bearer {self.access_token}"}
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

    def _get_week_window(self, reference_dt: datetime) -> Tuple[datetime, datetime]:
        """
        Get the Monday-Friday window for the week containing reference_dt.
        Falls back to the next Monday if called on Saturday/Sunday.
        """
        from app.utils.timezone import utc_to_ph

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
        signature_path: Path,
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
                        continue
                    
                    preview_date = monday + timedelta(days=day_offset)
                    date_label = date_labels[day_offset] if day_offset < len(date_labels) else file_info.get("date_label", "")
                    
                    previews.append({
                        "date_label": date_label,
                        "day_name": preview_date.strftime("%A"),
                        "image_key": upload_result.get("image_key", "")
                    })
                
                if len(previews) == 5:
                    print(f"✅ Using {len(previews)} frontend-captured previews for signature {signature_id}")
                    return previews
                else:
                    print(f"⚠️ Only {len(previews)} frontend previews found, falling back to backend generation")
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
                continue

            upload_result = await self.upload_image_bytes(
                composite_result.get("image_bytes", b""),
                filename=f"signature_date_preview_{day_offset + 1}.png"
            )
            if not upload_result.get("success"):
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
    
    async def send_text_message(
        self,
        receive_id: str,
        text: str,
        receive_id_type: str = "open_id"
    ) -> Dict[str, Any]:
        """Send a simple text message (for testing connectivity)."""
        if not await self._refresh_access_token():
            return {"success": False, "error": ERROR_TOKEN_FAILED}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{LARK_BASE_URL}/im/v1/messages",
                    params={"receive_id_type": receive_id_type},
                    json={
                        "receive_id": receive_id,
                        "msg_type": "text",
                        "content": json.dumps({"text": text})
                    },
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": CONTENT_TYPE_JSON
                    }
                )
                data = response.json()
                
                if data.get("code") == 0:
                    return {"success": True, "message": "Message sent!"}
                else:
                    return {"success": False, "error": data.get("msg", "Unknown error")}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def send_interactive_card(
        self,
        receive_id: str,
        card_content: Dict[str, Any],
        receive_id_type: str = "open_id"
    ) -> Dict[str, Any]:
        """
        Send an interactive card directly (without template).
        Useful for dynamic cards or when template is not set up.
        """
        if not await self._refresh_access_token():
            return {"success": False, "error": ERROR_TOKEN_FAILED}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{LARK_BASE_URL}/im/v1/messages",
                    params={"receive_id_type": receive_id_type},
                    json={
                        "receive_id": receive_id,
                        "msg_type": "interactive",
                        "content": json.dumps(card_content)
                    },
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": CONTENT_TYPE_JSON
                    }
                )
                data = response.json()
                
                if data.get("code") == 0:
                    return {"success": True, "message_id": data.get("data", {}).get("message_id")}
                else:
                    return {"success": False, "error": data.get("msg")}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # =========================================================================
    # Signature Approval Request
    # =========================================================================
    
    async def send_approval_request(
        self,
        signature_id: int,
        requested_by: str = "System",
        is_auto_request: bool = False,
        is_retry: bool = False
    ) -> Dict[str, Any]:
        """
        Send a signature approval request via Lark Message Card.
        
        If template_id is configured, uses template message.
        Otherwise, sends a dynamic interactive card.
        """
        async with async_session() as session:
            # Get the signature
            result = await session.execute(
                select(SignatureAsset).where(SignatureAsset.id == signature_id)
            )
            signature = result.scalar_one_or_none()
            
            if not signature:
                return {"success": False, "error": "Signature not found"}
            
            # Upload signature image to Lark if not already uploaded
            signature_image_key = signature.lark_image_key
            if not signature_image_key and signature.file_path:
                # Upload image and get image_key
                image_path = Path(__file__).resolve().parent.parent.parent / signature.file_path.lstrip("/")
                upload_result = await self.upload_image(str(image_path))
                if upload_result.get("success"):
                    signature_image_key = upload_result.get("image_key")
                    # Save image_key to database
                    signature.lark_image_key = signature_image_key
                    await session.commit()
                    print(f" Signature image uploaded to Lark: {signature_image_key}")
                else:
                    error_msg = upload_result.get('error', 'Unknown error')
                    print(f"⚠️ Failed to upload signature image: {error_msg}")
                    # Check if it's a permission error
                    if "im:resource" in str(error_msg):
                        print("💡 TIP: Add 'im:resource' permission in Lark Developer Console → Permissions & Scopes")
                    # Continue without image - card will still work
            
            # Calculate validity dates (Mon-Fri of current week, PH timezone)
            from app.utils.timezone import get_ph_now, format_ph_datetime

            ph_now = get_ph_now()
            week_monday, week_friday = self._get_week_window(ph_now)
            validity_start = format_ph_datetime(week_monday, "%B %d, %Y")
            validity_end = format_ph_datetime(week_friday, "%B %d, %Y")
            
            # Build template variables
            if is_retry:
                request_type = "Retry"
            elif is_auto_request:
                request_type = "Auto"
            else:
                request_type = "Manual"
            
            template_vars = {
                "request_type": request_type,
                "request_date": format_ph_datetime(ph_now, "%A, %B %d, %Y %I:%M %p PHT"),
                "requested_by": requested_by,
                "validity_period": f"1 Week ({validity_start} - {validity_end})",
                "purpose": "DL Generation",
                "signature_id": str(signature_id),
                "signature_image_key": signature_image_key or "",  # Use image_key for Lark
                "is_auto": "Yes" if is_auto_request else "No"
            }

            date_previews: List[Dict[str, str]] = []
            week_key = week_monday.date().isoformat()
            signature_path = None
            if signature.file_path:
                signature_path = Path(__file__).resolve().parent.parent.parent / signature.file_path.lstrip("/")
            if signature_path and signature_path.exists():
                cached_previews = get_cached_previews(signature_id, week_key)
                if cached_previews:
                    date_previews = cached_previews
                else:
                    date_previews = await self._build_date_previews(signature_path, week_monday, signature_id=signature_id)
                    if date_previews:
                        set_cached_previews(signature_id, week_key, date_previews)
            else:
                print("signature_preview_missing: skipping date previews")
            
            approval_request = SignatureApprovalRequest(
                signature_id=signature_id,
                status="Pending",
                created_at=datetime.now(timezone.utc)
            )
            session.add(approval_request)
            await session.flush()
            request_id = approval_request.id

            # Send the message
            if not self.self_user_id:
                await self._load_config()

            if self.self_user_id:
                # IMPORTANT: Always use dynamic interactive cards for approval requests
                # Template messages do NOT support dynamic button values (action/signature_id/request_id)
                card = self._build_approval_card(
                    signature_id=signature_id,
                    request_id=request_id,
                    request_type=request_type,
                    requested_by=requested_by,
                    validity=f"{validity_start} - {validity_end}",
                    signature_preview_key=signature_image_key,
                    is_auto=is_auto_request,
                    date_previews=date_previews
                )
                result = await self.send_interactive_card(
                    receive_id=self.self_user_id,
                    card_content=card
                )

                if self.template_id:
                    print("ℹ️ Using dynamic card instead of template for approval - buttons require dynamic values")
            else:
                result = {"success": False, "error": "No recipient configured. Please set your User ID in Lark Setup."}

            message_id = result.get("message_id") if result.get("success") else None
            if message_id:
                approval_request.lark_message_id = message_id
            await session.commit()
            
            # Log the action
            await self._log_audit(
                action="Lark Approval Request Sent",
                resource_type="signature_approval",
                resource_id=signature_id,
                details={
                    "is_auto_request": is_auto_request,
                    "is_retry": is_retry,
                    "requested_by": requested_by,
                    "validity": f"{validity_start} - {validity_end}",
                    "result": result
                }
            )
            
            return result
    
    def _build_approval_card(
        self,
        signature_id: int,
        request_id: Optional[int],
        request_type: str,
        requested_by: str,
        validity: str,
        signature_preview_key: Optional[str] = None,
        is_auto: bool = False,
        date_previews: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Build a dynamic approval card for when template_id is not set."""
        from app.utils.timezone import get_ph_now, format_ph_datetime
        
        ph_now = get_ph_now()
        
        elements = [
            {
                "tag": "column_set",
                "flex_mode": "none",
                "background_style": "default",
                "columns": [
                    {
                        "tag": "column",
                        "width": "weighted",
                        "weight": 1,
                        "vertical_align": "top",
                        "elements": [
                            {"tag": "div", "text": {"tag": "lark_md", "content": f"**Request Date:**\n{format_ph_datetime(ph_now, '%B %d, %Y %I:%M %p PHT')}"}}
                        ]
                    },
                    {
                        "tag": "column",
                        "width": "weighted",
                        "weight": 1,
                        "vertical_align": "top",
                        "elements": [
                            {"tag": "div", "text": {"tag": "lark_md", "content": f"**Requested By:**\n{requested_by}"}}
                        ]
                    }
                ]
            },
            {
                "tag": "column_set",
                "flex_mode": "none",
                "background_style": "default",
                "columns": [
                    {
                        "tag": "column",
                        "width": "weighted",
                        "weight": 1,
                        "vertical_align": "top",
                        "elements": [
                            {"tag": "div", "text": {"tag": "lark_md", "content": f"**Validity Period:**\n1 Week ({validity})"}}
                        ]
                    },
                    {
                        "tag": "column",
                        "width": "weighted",
                        "weight": 1,
                        "vertical_align": "top",
                        "elements": [
                            {"tag": "div", "text": {"tag": "lark_md", "content": "**Purpose:**\nDL Generation"}}
                        ]
                    }
                ]
            },
            {"tag": "hr"},
            {
                "tag": "note",
                "elements": [{
                    "tag": "plain_text",
                    "content": "Auto-sent every Sunday. Retries hourly if not approved." if is_auto else "Manual approval request."
                }]
            },
            {"tag": "hr"}
        ]

        preview_elements: List[Dict[str, Any]] = [
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
                preview_elements.append({
                    "tag": "column_set",
                    "flex_mode": "none",
                    "background_style": "default",
                    "columns": columns
                })
        elif signature_preview_key:
            preview_elements.append({
                "tag": "img",
                "img_key": signature_preview_key,
                "alt": {"tag": "plain_text", "content": "Signature Preview"}
            })
        else:
            preview_elements.append({
                "tag": "note",
                "elements": [
                    {"tag": "plain_text", "content": "Signature preview not available."}
                ]
            })

        elements.extend(preview_elements)
        elements.append({"tag": "hr"})
        elements.append({
            "tag": "action",
            "actions": [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "APPROVE"},
                    "type": "primary",
                    "value": {
                        "action": "approve",
                        "signature_id": signature_id,
                        "request_id": request_id
                    }
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "REJECT"},
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
                "title": {"tag": "plain_text", "content": f"{request_type} Signature Approval Request"},
                "template": "green"
            },
            "elements": elements
        }
    
    # =========================================================================
    # Self-Test Messaging
    # =========================================================================
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test the Lark connection by sending a message to yourself."""
        if not await self._load_config():
            return {"success": False, "error": "Lark not configured. Please set up App ID and App Secret."}
        
        if not self.self_user_id:
            return {"success": False, "error": "Self User ID not configured. Please set your Lark User ID to receive test messages."}
        
        # First try template message if configured
        if self.template_id:
            # FIXED: Use Philippines timezone for request_date
            from app.utils.timezone import get_ph_now
            ph_now = get_ph_now()
            
            result = await self.send_template_message(
                receive_id=self.self_user_id,
                template_variable={
                    "request_type": "🧪 TEST",
                    "request_date": ph_now.strftime("%A, %B %d, %Y %I:%M %p PHT"),
                    "requested_by": "Connection Test",
                    "validity_period": "Test Message",
                    "purpose": "Verify Lark Integration",
                    "signature_id": "0",
                    "is_auto": "No"
                }
            )
            if result.get("success"):
                return {"success": True, "message": " Template message sent successfully! Check your Lark app."}
        
        # Fallback to text message
        text_result = await self.send_text_message(
            receive_id=self.self_user_id,
            text=" DL Generator Connection Test\n\n Connection successful!\nThis message confirms that the Lark integration is working properly."
        )
        
        if text_result.get("success"):
            return {"success": True, "message": " Text message sent successfully! Check your Lark app."}
        
        return {"success": False, "error": text_result.get("error", "Failed to send test message")}
    
    async def send_self_approval_test(self) -> Dict[str, Any]:
        """Send a test approval request card to yourself."""
        if not await self._load_config():
            return {"success": False, "error": "Lark not configured"}
        
        if not self.self_user_id:
            return {"success": False, "error": "Self User ID not configured"}
        
        # Get latest signature or create test card
        async with async_session() as session:
            result = await session.execute(
                select(SignatureAsset)
                .order_by(SignatureAsset.created_at.desc())
                .limit(1)
            )
            signature = result.scalar_one_or_none()
            signature_id = signature.id if signature else 0
        
        return await self.send_approval_request(
            signature_id=signature_id if signature_id else 1,
            requested_by="Self Test",
            is_auto_request=False
        )
    
    # =========================================================================
    # Auto-Approval Scheduler
    # =========================================================================
    
    async def start_scheduler(self):
        """Start the auto-approval scheduler."""
        if self._scheduler_running:
            return
        self._scheduler_running = True
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        print(" Lark auto-approval scheduler started (sends requests every Sunday)")
    
    async def stop_scheduler(self):
        """Stop the scheduler."""
        self._scheduler_running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass  # Expected when cancelling, no need to re-raise from stop method
        print(" Lark auto-approval scheduler stopped")
    
    async def _scheduler_loop(self):
        """Main scheduler loop - sends approval requests on Sundays and retries hourly."""
        while self._scheduler_running:
            try:
                now = datetime.now(timezone.utc)
                
                # Check if it's Sunday (weekday 6)
                if now.weekday() == 6:
                    await self._send_sunday_approval()
                
                # Check for pending requests that need hourly retry
                await self._retry_pending_requests()
                
                # Wait 5 minutes before next check
                await asyncio.sleep(300)
                
            except asyncio.CancelledError:
                print("Scheduler loop cancelled")
                raise  # Re-raise as per best practice
            except Exception as e:
                print(f"Scheduler error: {e}")
                await asyncio.sleep(60)
    
    async def _send_sunday_approval(self):
        """Send automatic approval request on Sunday."""
        async with async_session() as session:
            # Get the active signature asset
            result = await session.execute(
                select(SignatureAsset)
                .where(SignatureAsset.status.in_(["Approved", "Pending"]))
                .order_by(SignatureAsset.created_at.desc())
                .limit(1)
            )
            signature = result.scalar_one_or_none()
            
            if not signature:
                print("No signature asset found for auto-approval")
                return
            
            # Check if we already sent a request today
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            result = await session.execute(
                select(SignatureApprovalRequest)
                .where(SignatureApprovalRequest.signature_id == signature.id)
                .where(SignatureApprovalRequest.created_at >= today_start)
                .where(SignatureApprovalRequest.status == "Pending")
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print("Already sent approval request today, skipping...")
                return
            
            # Send the approval request
            print(f" Sending automatic Sunday approval request for signature #{signature.id}")
            await self.send_approval_request(
                signature_id=signature.id,
                requested_by="Auto-Scheduler",
                is_auto_request=True
            )
    
    async def _retry_pending_requests(self):
        """Retry pending requests that haven't been responded to within an hour."""
        async with async_session() as session:
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            
            result = await session.execute(
                select(SignatureApprovalRequest)
                .where(SignatureApprovalRequest.status == "Pending")
                .where(SignatureApprovalRequest.created_at < one_hour_ago)
                .limit(1)  # Only retry ONE request at a time to prevent spam
            )
            pending_requests = result.scalars().all()
            
            if not pending_requests:
                return
            
            for req in pending_requests:
                # Get the signature
                sig_result = await session.execute(
                    select(SignatureAsset).where(SignatureAsset.id == req.signature_id)
                )
                signature = sig_result.scalar_one_or_none()
                
                if signature and signature.status != "Approved":
                    print(f"Retrying approval request for signature #{req.signature_id}")
                    result = await self.send_approval_request(
                        signature_id=req.signature_id,
                        requested_by="Auto-Scheduler",
                        is_auto_request=True,
                        is_retry=True
                    )
                    
                    # If template error, mark old requests as failed to prevent retry spam
                    if not result.get("success") and "11310" in str(result.get("error", "")):
                        print(f"Template visibility error detected. Marking old pending requests as failed to stop retry spam...")
                        await session.execute(
                            update(SignatureApprovalRequest)
                            .where(SignatureApprovalRequest.status == "Pending")
                            .where(SignatureApprovalRequest.created_at < one_hour_ago)
                            .values(status="Failed", response_reason="Template not visible to app (Error 11310)")
                        )
                        await session.commit()
                        print(f"Marked old pending requests as failed. Fix template visibility in Lark Developer Console.")
    
    def get_scheduler_status(self) -> Dict[str, Any]:
        """Get scheduler status."""
        now = datetime.now(timezone.utc)
        days_until_sunday = (6 - now.weekday()) % 7
        if days_until_sunday == 0 and now.hour >= 12:
            days_until_sunday = 7
        next_sunday = now + timedelta(days=days_until_sunday)
        next_sunday = next_sunday.replace(hour=9, minute=0, second=0, microsecond=0)
        
        return {
            "running": self._scheduler_running,
            "nextSunday": next_sunday.isoformat(),
            "description": "Auto-sends approval requests every Sunday at 9:00 AM. Retries hourly if rejected or pending."
        }
    
    async def trigger_manual_approval(self) -> Dict[str, Any]:
        """Manually trigger an approval request for testing."""
        async with async_session() as session:
            # Get the latest signature asset
            result = await session.execute(
                select(SignatureAsset)
                .order_by(SignatureAsset.created_at.desc())
                .limit(1)
            )
            signature = result.scalar_one_or_none()
            
            if not signature:
                return {"success": False, "error": "No signature asset found. Please upload a signature first."}
            
            print(f"📤 Triggering manual approval for signature ID: {signature.id}")
            result = await self.send_approval_request(
                signature_id=signature.id,
                requested_by="Manual Test",
                is_auto_request=False
            )
            print(f"📨 Approval request result: {result}")
            return result
    
    # =========================================================================
    # Utility Methods
    # =========================================================================
    
    async def _log_audit(
        self,
        action: str,
        resource_type: str,
        resource_id: int,
        details: Dict[str, Any]
    ):
        """Log an action to audit trail."""
        async with async_session() as session:
            log = AuditLog(
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=json.dumps(details),
                status="success"
            )
            session.add(log)
            await session.commit()
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get current user info from Lark (useful for getting open_id)."""
        if not await self._refresh_access_token():
            return {"success": False, "error": ERROR_TOKEN_FAILED}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{LARK_BASE_URL}/authen/v1/user_info",
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": CONTENT_TYPE_JSON
                    }
                )
                data = response.json()
                return {"success": data.get("code") == 0, "data": data}
        except Exception as e:
            return {"success": False, "error": str(e)}


# Create singleton instance
lark_approval_service = LarkMessageCardService()
