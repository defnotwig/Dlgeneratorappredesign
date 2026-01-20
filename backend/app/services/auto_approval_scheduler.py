"""
Auto-Approval Scheduler Service
===============================
Automatically sends approval requests every Sunday and retries hourly if rejected/no response.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional
import threading

from app.services.lark_bot_service import lark_bot_service
from app.database import async_session, SignatureApprovalRequest, SignatureAsset
from sqlalchemy import select, update


class AutoApprovalScheduler:
    """Service for automatic Sunday approval requests with hourly retry."""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._retry_interval_hours = 1
        self._check_interval_minutes = 5

    async def start(self):
        """Start the scheduler."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        print("[OK] Auto-approval scheduler started (sends requests every Sunday)")

    async def stop(self):
        """Stop the scheduler."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("[STOP] Auto-approval scheduler stopped")

    async def _scheduler_loop(self):
        """Main scheduler loop."""
        while self._running:
            try:
                from app.utils.timezone import get_ph_now
                ph_now = get_ph_now()

                # Check if it's Sunday (weekday 6) in Philippines timezone
                if ph_now.weekday() == 6:
                    await self._check_and_send_approval()

                # Also check for pending requests that need retry
                await self._retry_pending_requests()

                # Wait before next check
                await asyncio.sleep(self._check_interval_minutes * 60)

            except Exception as e:
                print(f"[WARN] Scheduler error: {e}")
                await asyncio.sleep(60)

    async def _check_and_send_approval(self):
        """Check if approval needs to be sent on Sunday."""
        async with async_session() as db:
            # Get the latest signature that needs approval
            result = await db.execute(
                select(SignatureAsset)
                .where(SignatureAsset.status == 'Pending')
                .order_by(SignatureAsset.created_at.desc())
                .limit(1)
            )
            signature = result.scalar_one_or_none()

            if signature:
                # Send approval request
                await self._send_approval_request(signature)

    async def _retry_pending_requests(self):
        """Retry sending approval for requests that are pending or rejected."""
        async with async_session() as db:
            # Find pending approval requests that haven't been retried recently
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

            result = await db.execute(
                select(SignatureApprovalRequest)
                .where(SignatureApprovalRequest.status == 'Pending')
                .where(SignatureApprovalRequest.created_at < one_hour_ago)
            )
            pending_requests = result.scalars().all()

            for req in pending_requests:
                # Get the associated signature
                sig_result = await db.execute(
                    select(SignatureAsset).where(SignatureAsset.id == req.signature_id)
                )
                signature = sig_result.scalar_one_or_none()

                if signature and signature.status != 'Approved':
                    print(f"[RETRY] Retrying approval request #{req.id}")
                    await self._send_approval_request(signature, is_retry=True)

    async def _send_approval_request(self, signature: SignatureAsset, is_retry: bool = False):
        """Send approval request to Lark."""
        try:
            from app.utils.timezone import get_ph_now, format_ph_datetime
            
            prefix = "[RETRY] " if is_retry else ""
            ph_now = get_ph_now()
            
            result = await lark_bot_service.send_signature_approval_card(
                request_id=signature.id,
                signature_preview_url=f"http://localhost:8000{signature.file_path}",
                requested_by="Auto-Scheduler",
                requested_date=format_ph_datetime(ph_now, "%A, %B %d, %Y %I:%M %p PHT"),
                validity_period="1 Week",
                purpose="DL Generation",
                admin_message=f"{prefix}Automatic weekly approval request. This request is auto-sent every Sunday and will retry hourly until approved."
            )
            if result.get("success"):
                print(f"[OK] Approval request sent for signature #{signature.id}")
            else:
                print(f"[ERROR] Failed to send approval: {result.get('error')}")
        except Exception as e:
            print(f"[ERROR] Error sending approval request: {e}")

    async def send_manual_approval_request(self, signature_id: int, requested_by: str = "Admin"):
        """Manually trigger an approval request."""
        async with async_session() as db:
            result = await db.execute(
                select(SignatureAsset).where(SignatureAsset.id == signature_id)
            )
            signature = result.scalar_one_or_none()

            if signature:
                await self._send_approval_request(signature)
                return {"success": True, "message": "Approval request sent"}
            return {"success": False, "error": "Signature not found"}

    def is_running(self) -> bool:
        """Check if scheduler is running."""
        return self._running

    def get_next_sunday(self) -> datetime:
        """Get the next Sunday date."""
        from app.utils.timezone import get_ph_now
        
        ph_today = get_ph_now()
        days_until_sunday = (6 - ph_today.weekday()) % 7
        if days_until_sunday == 0 and ph_today.hour >= 12:
            days_until_sunday = 7
        return ph_today + timedelta(days=days_until_sunday)


# Create default instance
auto_approval_scheduler = AutoApprovalScheduler()
