"""
Lark Bot Service
================
Handles all Lark Bot communication for signature approval workflow.
"""

import hmac
import hashlib
import base64
import time
from typing import Optional, Dict, Any, List
from datetime import datetime

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, LarkBotConfig, SignatureApprovalRequest, SignatureAsset, AuditLog


class LarkBotService:
    """Service for Lark Bot integration."""

    def __init__(self):
        self.timeout = 10.0

    def _generate_signature(self, timestamp: str, secret: str) -> str:
        """Generate HMAC-SHA256 signature for Lark Bot authentication."""
        string_to_sign = f"{timestamp}\n{secret}"
        hmac_code = hmac.new(
            string_to_sign.encode("utf-8"),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(hmac_code).decode("utf-8")

    async def get_active_config(self) -> Optional[LarkBotConfig]:
        """Get active Lark Bot configuration from database."""
        async with async_session() as session:
            result = await session.execute(
                select(LarkBotConfig)
                .where(LarkBotConfig.is_active == True)
                .order_by(LarkBotConfig.id.desc())
                .limit(1)
            )
            return result.scalar_one_or_none()

    async def save_config(
        self,
        webhook_url: str,
        secret_key: Optional[str] = None
    ) -> LarkBotConfig:
        """Save new Lark Bot configuration."""
        async with async_session() as session:
            # Deactivate existing configs
            await session.execute(
                update(LarkBotConfig).values(is_active=False)
            )

            # Create new config
            config = LarkBotConfig(
                webhook_url=webhook_url,
                secret_key=secret_key,
                is_active=True
            )
            session.add(config)
            await session.commit()
            await session.refresh(config)
            return config

    async def send_message(
        self,
        payload: Dict[str, Any],
        webhook_url: Optional[str] = None,
        secret_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a message to Lark Bot webhook."""
        # Get config if not provided
        if not webhook_url:
            config = await self.get_active_config()
            if not config:
                return {"success": False, "error": "Lark Bot not configured"}
            webhook_url = config.webhook_url
            secret_key = config.secret_key

        request_body = {**payload}

        # Add signature if secret key is provided
        if secret_key:
            timestamp = str(int(time.time()))
            sign = self._generate_signature(timestamp, secret_key)
            request_body["timestamp"] = timestamp
            request_body["sign"] = sign

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    webhook_url,
                    json=request_body,
                    headers={"Content-Type": "application/json"}
                )
                data = response.json()

                return {
                    "success": data.get("code", -1) == 0,
                    "data": data,
                    "status_code": data.get("code"),
                    "message": data.get("msg", "")
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def send_text_message(self, text: str) -> Dict[str, Any]:
        """Send a simple text message."""
        return await self.send_message({
            "msg_type": "text",
            "content": {"text": text}
        })

    async def send_signature_approval_card(
        self,
        request_id: int,
        signature_preview_url: str,
        requested_by: str,
        requested_date: str,
        validity_period: str = "Indefinite",
        purpose: str = "DL Generation",
        admin_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send interactive approval card for signature request."""

        from app.utils.timezone import get_ph_now, format_ph_datetime
        today = format_ph_datetime(get_ph_now(), "%A, %B %d, %Y")

        # Build card elements
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
                    "content": f"[PENDING] **Validity Period:** {validity_period}"
                }
            },
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"[TARGET] **Purpose:**\n- {purpose}"
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
                    "content": f"**Request Date:** {requested_date}"
                }
            }
        ]

        if admin_message:
            elements.append({
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": f"**Message from Admin:**\n{admin_message}"
                }
            })

        elements.extend([
            {
                "tag": "note",
                "elements": [{
                    "tag": "plain_text",
                    "content": "Signature preview attached. Please review before approving."
                }]
            },
            {"tag": "hr"},
            {
            "tag": "action",
            "actions": [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "[OK] ALLOW"},
                    "type": "primary",
                    "value": {"action": "approve", "requestId": request_id}
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "[ERROR] REJECT"},
                    "type": "danger",
                    "value": {"action": "reject", "requestId": request_id}
                }
            ]
        }
        ])

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": "Signature Approval Request"},
                    "template": "blue"
                },
                "elements": elements
            }
        }

        result = await self.send_message(card)

        # Log the action
        if result.get("success"):
            await self._log_audit(
                action="Lark Approval Sent",
                resource_type="signature_approval",
                resource_id=request_id,
                details={"purpose": purpose, "requested_by": requested_by}
            )

        return result

    async def send_approval_result(
        self,
        request_id: int,
        status: str,
        responded_by: str,
        requested_by: str,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send notification about approval/rejection result."""
        is_approved = status == "Approved"
        emoji = "[OK]" if is_approved else "[ERROR]"
        template = "green" if is_approved else "red"
        status_text = "APPROVED" if is_approved else "REJECTED"

        elements = [
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**Request ID:** #{request_id}"}
            },
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**Status:** {status_text}"}
            },
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**Responded By:** {responded_by}"}
            },
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**Original Requester:** {requested_by}"}
            }
        ]

        if reason:
            elements.append({
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"**Reason:** {reason}"}
            })

        note_text = (
            "The signature asset is now active and can be used for DL generation."
            if is_approved else
            "Please upload a new signature and submit for approval again."
        )

        elements.append({
            "tag": "note",
            "elements": [{"tag": "plain_text", "content": note_text}]
        })

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": f"{emoji} Signature {status_text}"},
                    "template": template
                },
                "elements": elements
            }
        }

        return await self.send_message(card)

    async def test_connection(
        self,
        webhook_url: str,
        secret_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Test Lark Bot connection."""
        result = await self.send_message(
            {
                "msg_type": "text",
                "content": {
                    "text": "DL Generator Bot Connection Test\n\nThis is a test message from the DL Generator system. If you see this message, the Lark Bot integration is working correctly!"
                }
            },
            webhook_url=webhook_url,
            secret_key=secret_key
        )

        return {
            "success": result.get("success", False),
            "message": (
                "Connection successful! Test message sent to Lark."
                if result.get("success")
                else f"Connection failed: {result.get('error', result.get('message', 'Unknown error'))}"
            )
        }

    async def _log_audit(
        self,
        action: str,
        resource_type: str,
        resource_id: int,
        details: Dict[str, Any],
        user_id: Optional[int] = None,
        user_name: Optional[str] = None
    ):
        """Log an action to audit trail."""
        async with async_session() as session:
            log = AuditLog(
                user_id=user_id,
                user_name=user_name,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=str(details),
                status="success"
            )
            session.add(log)
            await session.commit()


# Create default instance
lark_bot_service = LarkBotService()
