"""
Auto-Approval Scheduler Service (Legacy)
=======================================
Automatically sends approval requests every Sunday at 8:00 AM and 5:00 PM (PHT).
The 5:00 PM send happens only if still pending or rejected.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional
import threading

from app.services.lark_bot_service import lark_bot_service
from app.database import async_session, SignatureApprovalRequest, SignatureAsset
from sqlalchemy import select, update


class AutoApprovalScheduler:
    """Legacy scheduler helper (not used by main app)."""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._check_interval_seconds = 60
        self._slot_window_minutes = 15
        self._last_sent_slot: dict[str, str] = {}

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
                    await self._check_and_send_approval(ph_now, slot="morning", hour=8, minute=0)
                    await self._check_and_send_approval(ph_now, slot="afternoon", hour=17, minute=0)

                # Wait before next check
                await asyncio.sleep(self._check_interval_seconds)

            except Exception as e:
                print(f"[WARN] Scheduler error: {e}")
                await asyncio.sleep(60)

    async def _check_and_send_approval(self, now_ph: datetime, slot: str, hour: int, minute: int):
        """Check if approval needs to be sent on Sunday for the given slot."""
        slot_start = now_ph.replace(hour=hour, minute=minute, second=0, microsecond=0)
        slot_end = slot_start + timedelta(minutes=self._slot_window_minutes)

        if not (slot_start <= now_ph < slot_end):
            return

        day_key = slot_start.date().isoformat()
        slot_key = f"{day_key}:{slot}"
        if self._last_sent_slot.get(slot_key):
            return

        async with async_session() as db:
            # Get the latest signature that needs approval
            result = await db.execute(
                select(SignatureAsset)
                .where(SignatureAsset.status.in_(["Approved", "Pending", "Rejected"]))
                .order_by(SignatureAsset.created_at.desc())
                .limit(1)
            )
            signature = result.scalar_one_or_none()

            if signature:
                if slot == "afternoon":
                    day_start = slot_start.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
                    day_end = (slot_start.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).astimezone(timezone.utc)
                    approved_result = await db.execute(
                        select(SignatureApprovalRequest.id)
                        .where(SignatureApprovalRequest.signature_id == signature.id)
                        .where(SignatureApprovalRequest.status == "Approved")
                        .where(SignatureApprovalRequest.responded_at.is_not(None))
                        .where(SignatureApprovalRequest.responded_at >= day_start)
                        .where(SignatureApprovalRequest.responded_at < day_end)
                        .limit(1)
                    )
                    if approved_result.scalar_one_or_none():
                        return

                # Send approval request
                await self._send_approval_request(signature)
                self._last_sent_slot[slot_key] = now_ph.isoformat()

    async def _send_approval_request(self, signature: SignatureAsset, is_retry: bool = False):
        """Send approval request to Lark."""
        try:
            from app.utils.timezone import get_ph_now, format_ph_datetime
            
            ph_now = get_ph_now()
            
            result = await lark_bot_service.send_signature_approval_card(
                request_id=signature.id,
                signature_preview_url=f"http://localhost:8000{signature.file_path}",
                requested_by="Auto-Scheduler",
                requested_date=format_ph_datetime(ph_now, "%A, %B %d, %Y %I:%M %p PHT"),
                validity_period="1 Week",
                purpose="DL Generation",
                admin_message="Automatic weekly approval request. This request is auto-sent every Sunday at 8:00 AM and 5:00 PM (PHT)."
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
