import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def list_images(root: Path) -> List[Path]:
    files: List[Path] = []
    for ext in SUPPORTED_IMAGE_EXTENSIONS:
        files.extend(root.rglob(f"*{ext}"))
    return sorted(files)


def read_config(path: Path) -> Dict[str, Any]:
    raw = path.read_text(encoding="utf-8")
    try:
        import yaml  # type: ignore

        return yaml.safe_load(raw)
    except Exception:
        return json.loads(raw)


def write_json(path: Path, data: Dict[str, Any]) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def write_md(path: Path, lines: Iterable[str]) -> None:
    ensure_dir(path.parent)
    content = "\n".join(lines).rstrip() + "\n"
    path.write_text(content, encoding="utf-8")


def init_logging(log_path: Path, level: int = logging.INFO) -> logging.Logger:
    ensure_dir(log_path.parent)
    logger = logging.getLogger(str(log_path))
    logger.setLevel(level)
    logger.handlers.clear()
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    return logger

