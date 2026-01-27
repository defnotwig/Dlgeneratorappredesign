import time
from typing import Dict, List, Optional

_PREVIEW_CACHE: Dict[str, Dict[str, object]] = {}
_DEFAULT_TTL_SECONDS = 6 * 60 * 60


def _cache_key(signature_id: int, week_start_iso: str) -> str:
    return f"{signature_id}:{week_start_iso}"


def get_cached_previews(signature_id: int, week_start_iso: str) -> Optional[List[Dict[str, str]]]:
    key = _cache_key(signature_id, week_start_iso)
    entry = _PREVIEW_CACHE.get(key)
    if not entry:
        return None
    if entry["expires_at"] < time.time():
        _PREVIEW_CACHE.pop(key, None)
        return None
    return entry.get("previews")


def set_cached_previews(
    signature_id: int,
    week_start_iso: str,
    previews: List[Dict[str, str]],
    ttl_seconds: int = _DEFAULT_TTL_SECONDS
) -> None:
    _PREVIEW_CACHE[_cache_key(signature_id, week_start_iso)] = {
        "previews": previews,
        "expires_at": time.time() + ttl_seconds
    }


def clear_all_preview_cache() -> None:
    """Clear all cached previews. Called on startup to ensure fresh images."""
    global _PREVIEW_CACHE
    _PREVIEW_CACHE.clear()


def clear_signature_cache(signature_id: int) -> None:
    """Clear cache entries for a specific signature."""
    global _PREVIEW_CACHE
    keys_to_remove = [k for k in _PREVIEW_CACHE.keys() if k.startswith(f"{signature_id}:")]
    for key in keys_to_remove:
        _PREVIEW_CACHE.pop(key, None)
