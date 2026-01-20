import csv
import hashlib
import json
import logging
import math
import os
import random
import subprocess
import time
from pathlib import Path

import numpy as np
from PIL import Image

DEFAULT_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}


def setup_logger(name, log_path=None, level=logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.handlers = []
    handler = logging.StreamHandler()
    handler.setLevel(level)
    fmt = logging.Formatter("[%(levelname)s] %(message)s")
    handler.setFormatter(fmt)
    logger.addHandler(handler)
    if log_path:
        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setLevel(level)
        file_handler.setFormatter(fmt)
        logger.addHandler(file_handler)
    return logger


def load_config(path):
    path = Path(path)
    text = path.read_text(encoding="utf-8")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise ValueError(f"Config file is not valid JSON: {path}")


def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)


def list_images(root):
    root = Path(root)
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in DEFAULT_IMAGE_EXTS:
            yield path


def load_image(path):
    img = Image.open(path)
    img.load()
    return img


def to_rgba(img):
    if img.mode != "RGBA":
        return img.convert("RGBA")
    return img


def to_gray(img):
    if img.mode != "L":
        return img.convert("L")
    return img


def resize_to_height(img, target_height):
    if img.height == target_height:
        return img
    scale = target_height / float(img.height)
    new_width = max(1, int(round(img.width * scale)))
    return img.resize((new_width, target_height), Image.Resampling.LANCZOS)


def pad_image(img, pad_x=10, pad_y=10, color=255, alpha=True):
    if alpha:
        bg = Image.new("RGBA", (img.width + 2 * pad_x, img.height + 2 * pad_y), (color, color, color, 0))
        bg.paste(img, (pad_x, pad_y), img)
        return bg
    bg = Image.new("L", (img.width + 2 * pad_x, img.height + 2 * pad_y), color)
    bg.paste(img, (pad_x, pad_y))
    return bg


def normalize_image(img, target_height=128, pad_x=10, pad_y=10, alpha=True, bg_color=255):
    img = to_rgba(img) if alpha else to_gray(img)
    img = resize_to_height(img, target_height)
    img = pad_image(img, pad_x=pad_x, pad_y=pad_y, color=bg_color, alpha=alpha)
    return img


def image_to_mask(img, threshold=245):
    if img.mode == "RGBA":
        rgba = np.array(img)
        alpha = rgba[:, :, 3]
        gray = np.mean(rgba[:, :, :3], axis=2)
        ink = (alpha > 0) & (gray < threshold)
        return ink.astype(np.uint8)
    gray = np.array(to_gray(img))
    return (gray < threshold).astype(np.uint8)


def bbox_from_mask(mask):
    ys, xs = np.where(mask > 0)
    if ys.size == 0 or xs.size == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def baseline_from_mask(mask):
    rows = np.where(mask.sum(axis=1) > 0)[0]
    if rows.size == 0:
        return None
    return int(rows.max())


def stroke_thickness(mask):
    try:
        from skimage.morphology import skeletonize

        skel = skeletonize(mask > 0)
        area = float(mask.sum())
        length = float(skel.sum())
        if length <= 0:
            return 0.0
        return area / length
    except Exception:
        return float(mask.sum()) / float(mask.shape[0] * mask.shape[1])


def laplacian_var(gray):
    try:
        import cv2

        return float(cv2.Laplacian(gray, cv2.CV_64F).var())
    except Exception:
        gy, gx = np.gradient(gray.astype(np.float32))
        return float((gx ** 2 + gy ** 2).mean())


def fft_highfreq_energy(gray):
    f = np.fft.fft2(gray.astype(np.float32))
    fshift = np.fft.fftshift(f)
    mag = np.abs(fshift)
    h, w = mag.shape
    cy, cx = h // 2, w // 2
    r = int(min(h, w) * 0.1)
    mag[cy - r: cy + r, cx - r: cx + r] = 0
    total = mag.sum()
    if total <= 0:
        return 0.0
    return float(mag.sum() / total)


def safe_relpath(path, start):
    try:
        return str(Path(path).relative_to(start))
    except Exception:
        return str(path)


def write_json(path, data):
    Path(path).write_text(json.dumps(data, indent=2), encoding="utf-8")


def write_csv(path, rows, fieldnames):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def read_csv(path):
    with open(path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except Exception:
        pass


def run_subprocess(cmd, timeout=10):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
        return result.returncode, result.stdout, result.stderr
    except Exception as exc:
        return 1, "", str(exc)


def now_timestamp():
    return time.strftime("%Y%m%d_%H%M%S")

