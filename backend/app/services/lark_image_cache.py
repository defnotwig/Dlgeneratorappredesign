import json
import threading
from pathlib import Path
from typing import Dict, Optional

_LOCK = threading.Lock()
_CACHE: Dict[str, str] = {}


def _cache_path() -> Path:
    repo_root = Path(__file__).resolve().parents[3]
    cache_dir = repo_root / "sign" / "lark_preview_images"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir / "lark_image_key_cache.json"


def _load_cache() -> None:
    if _CACHE:
        return
    cache_file = _cache_path()
    if not cache_file.exists():
        return
    try:
        data = json.loads(cache_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return
    if isinstance(data, dict):
        _CACHE.update({str(k): str(v) for k, v in data.items()})


def get_cached_image_key(image_hash: str) -> Optional[str]:
    if not image_hash:
        return None
    with _LOCK:
        _load_cache()
        return _CACHE.get(image_hash)


def set_cached_image_key(image_hash: str, image_key: str) -> None:
    if not image_hash or not image_key:
        return
    with _LOCK:
        _load_cache()
        _CACHE[image_hash] = image_key
        cache_file = _cache_path()
        cache_file.write_text(json.dumps(_CACHE, indent=2), encoding="utf-8")
