import math
from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np
from PIL import Image


@dataclass
class LayoutFeatures:
    left_margin: float
    right_margin: float
    top_margin: float
    bottom_margin: float
    baseline_ratio: float
    height_ratio: float
    width_ratio: float
    stroke_thickness: float


def to_gray_alpha(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    arr = np.array(rgba).astype(np.float32)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    gray = (0.299 * r + 0.587 * g + 0.114 * b).astype(np.uint8)
    out = np.stack([gray, gray, gray, a.astype(np.uint8)], axis=-1)
    return Image.fromarray(out, mode="RGBA")


def resize_to_height(img: Image.Image, target_height: int) -> Image.Image:
    if img.height == target_height:
        return img
    scale = target_height / float(img.height)
    new_width = max(1, int(round(img.width * scale)))
    return img.resize((new_width, target_height), Image.Resampling.LANCZOS)


def pad_to_canvas(
    img: Image.Image,
    canvas_width: int,
    canvas_height: int,
    fill=(255, 255, 255, 0),
) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_width, canvas_height), fill)
    x = max(0, (canvas_width - img.width) // 2)
    y = max(0, (canvas_height - img.height) // 2)
    canvas.paste(img, (x, y), img)
    return canvas


def get_ink_mask(img: Image.Image, ink_threshold: int = 200) -> np.ndarray:
    rgba = np.array(img.convert("RGBA"))
    gray = rgba[..., 0].astype(np.uint8)
    alpha = rgba[..., 3].astype(np.uint8)
    ink = (gray < ink_threshold) & (alpha > 10)
    return ink.astype(np.uint8)


def extract_date_region(
    img: Image.Image,
    ink_threshold: int = 200,
    height_ratio: float = 0.4,
    margin_px: int = 4,
) -> Image.Image:
    mask = get_ink_mask(img, ink_threshold=ink_threshold)
    if mask.sum() == 0:
        return img
    h, w = mask.shape
    start_row = int(h * (1.0 - height_ratio))
    start_row = max(0, min(start_row, h - 1))
    bottom_mask = mask[start_row:, :]
    if bottom_mask.sum() == 0:
        return img
    ys, xs = np.where(bottom_mask > 0)
    ys = ys + start_row
    min_y = max(0, ys.min() - margin_px)
    max_y = min(h - 1, ys.max() + margin_px)
    min_x = max(0, xs.min() - margin_px)
    max_x = min(w - 1, xs.max() + margin_px)
    return img.crop((min_x, min_y, max_x + 1, max_y + 1))


def align_baseline(
    img: Image.Image,
    baseline_ratio: float,
    ink_threshold: int = 200,
) -> Image.Image:
    mask = get_ink_mask(img, ink_threshold=ink_threshold)
    if mask.sum() == 0:
        return img
    rows = mask.sum(axis=1)
    baseline_row = int(np.argmax(rows))
    target_row = int(round(img.height * baseline_ratio))
    shift = target_row - baseline_row
    canvas = Image.new("RGBA", img.size, (255, 255, 255, 0))
    canvas.paste(img, (0, shift), img)
    return canvas


def compute_layout_features(
    img: Image.Image,
    ink_threshold: int = 200,
) -> LayoutFeatures:
    mask = get_ink_mask(img, ink_threshold=ink_threshold)
    h, w = mask.shape
    if mask.sum() == 0:
        return LayoutFeatures(
            left_margin=1.0,
            right_margin=1.0,
            top_margin=1.0,
            bottom_margin=1.0,
            baseline_ratio=1.0,
            height_ratio=0.0,
            width_ratio=0.0,
            stroke_thickness=0.0,
        )
    ys, xs = np.where(mask > 0)
    min_x, max_x = xs.min(), xs.max()
    min_y, max_y = ys.min(), ys.max()
    left_margin = min_x / float(w)
    right_margin = (w - 1 - max_x) / float(w)
    top_margin = min_y / float(h)
    bottom_margin = (h - 1 - max_y) / float(h)
    height_ratio = (max_y - min_y + 1) / float(h)
    width_ratio = (max_x - min_x + 1) / float(w)
    rows = mask.sum(axis=1)
    baseline_row = int(np.argmax(rows))
    baseline_ratio = baseline_row / float(h)
    stroke_thickness = estimate_stroke_thickness(mask)
    return LayoutFeatures(
        left_margin=left_margin,
        right_margin=right_margin,
        top_margin=top_margin,
        bottom_margin=bottom_margin,
        baseline_ratio=baseline_ratio,
        height_ratio=height_ratio,
        width_ratio=width_ratio,
        stroke_thickness=stroke_thickness,
    )


def estimate_stroke_thickness(mask: np.ndarray) -> float:
    if mask.sum() == 0:
        return 0.0
    widths = []
    for row in mask:
        runs = _run_lengths(row)
        widths.extend(runs)
    if not widths:
        return 0.0
    return float(np.median(widths))


def _run_lengths(row: np.ndarray) -> list:
    lengths = []
    current = 0
    for val in row:
        if val:
            current += 1
        elif current > 0:
            lengths.append(current)
            current = 0
    if current > 0:
        lengths.append(current)
    return lengths


def laplacian_variance(img: Image.Image) -> float:
    import cv2

    gray = np.array(img.convert("L"))
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return float(lap.var())


def checkerboard_score(img: Image.Image) -> float:
    gray = np.array(img.convert("L")).astype(np.float32)
    gray -= gray.mean()
    fft = np.fft.fftshift(np.fft.fft2(gray))
    mag = np.abs(fft)
    h, w = mag.shape
    cy, cx = h // 2, w // 2
    y, x = np.ogrid[:h, :w]
    radius = np.sqrt((y - cy) ** 2 + (x - cx) ** 2)
    max_r = radius.max()
    mid_mask = (radius > 0.3 * max_r) & (radius < 0.6 * max_r)
    low_mask = radius < 0.1 * max_r
    mid_energy = mag[mid_mask].mean() if mid_mask.any() else 0.0
    low_energy = mag[low_mask].mean() if low_mask.any() else 1.0
    return float(mid_energy / max(low_energy, 1e-6))
