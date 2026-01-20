"""
Timezone Utility for Philippines Standard Time (PST/PHT)
=========================================================
All timestamps in the system should use this utility for consistency.
"""

from datetime import datetime, timezone, timedelta

# Philippines Standard Time (UTC+8)
PH_TIMEZONE = timezone(timedelta(hours=8))


def get_ph_now() -> datetime:
    """Get current datetime in Philippines timezone."""
    return datetime.now(PH_TIMEZONE)


def utc_to_ph(utc_dt: datetime) -> datetime:
    """Convert UTC datetime to Philippines timezone."""
    if utc_dt is None:
        return None
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    return utc_dt.astimezone(PH_TIMEZONE)


def format_ph_datetime(dt: datetime, format_str: str = "%b %d, %Y %I:%M %p") -> str:
    """Format datetime to Philippines timezone string."""
    if dt is None:
        return ""
    ph_dt = utc_to_ph(dt) if dt.tzinfo != PH_TIMEZONE else dt
    return ph_dt.strftime(format_str)


def format_ph_date(dt: datetime) -> str:
    """Format date only in Philippines timezone."""
    return format_ph_datetime(dt, "%b %d, %Y")


def format_ph_time(dt: datetime) -> str:
    """Format time only in Philippines timezone."""
    return format_ph_datetime(dt, "%I:%M %p")
