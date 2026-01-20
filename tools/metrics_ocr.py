import argparse
import csv
import sys
from pathlib import Path
from typing import Dict, List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from PIL import Image

from tools.utils_dates import normalize_date_text
from tools.utils_image import (
    align_baseline,
    extract_date_region,
    get_ink_mask,
    pad_to_canvas,
    resize_to_height,
    to_gray_alpha,
)
from tools.utils_io import read_config


def preprocess(img: Image.Image, prep: Dict[str, int]) -> Image.Image:
    img = to_gray_alpha(img)
    if prep.get("extract_date_region", True):
        img = extract_date_region(
            img,
            ink_threshold=prep["ink_threshold"],
            height_ratio=prep.get("date_region_height_ratio", 0.4),
            margin_px=prep.get("crop_margin_px", 4),
        )
    img = resize_to_height(img, prep["target_height"])
    img = align_baseline(img, prep["baseline_ratio"], prep["ink_threshold"])
    img = pad_to_canvas(img, prep["canvas_width"], prep["canvas_height"])
    return img


def build_templates(datefont_dir: Path) -> Dict[str, np.ndarray]:
    templates = {}
    for char in list("0123456789."):
        name = "dot" if char == "." else char
        for ext in [".png", ".PNG"]:
            path = datefont_dir / f"{name}{ext}"
            if path.exists():
                with Image.open(path) as img:
                    temp = np.array(img.convert("L"), dtype=np.float32)
                    templates[char] = temp
                break
    if "." not in templates:
        templates["."] = np.ones((8, 8), dtype=np.float32) * 255
    return templates


def segment_ink(
    img: Image.Image,
    threshold: int,
    min_gap_px: int,
    min_col_ink: int,
) -> List[np.ndarray]:
    gray = np.array(img.convert("L"))
    mask = get_ink_mask(img, ink_threshold=threshold)
    col_sum = mask.sum(axis=0)
    segments = []
    in_segment = False
    start = 0
    blank_run = 0
    last_ink = -1
    for idx, val in enumerate(col_sum):
        if val > min_col_ink:
            if not in_segment:
                start = idx
                in_segment = True
            last_ink = idx
            blank_run = 0
        else:
            if in_segment:
                blank_run += 1
                if blank_run >= min_gap_px:
                    end = last_ink + 1
                    segments.append((start, end))
                    in_segment = False
                    blank_run = 0
    if in_segment and last_ink >= 0:
        segments.append((start, last_ink + 1))

    components = []
    for start, end in segments:
        if end - start < 2:
            continue
        col_mask = mask[:, start:end]
        if not col_mask.any():
            continue
        rows = col_mask.sum(axis=1)
        row_indices = np.where(rows > 0)[0]
        if row_indices.size == 0:
            continue
        minr, maxr = row_indices.min(), row_indices.max()
        comp = gray[minr : maxr + 1, start:end]
        components.append((start, comp))
    components.sort(key=lambda item: item[0])
    return [c[1] for c in components]


def match_component(component: np.ndarray, templates: Dict[str, np.ndarray]) -> str:
    best_char = ""
    best_score = -1.0
    for char, temp in templates.items():
        temp_resized = Image.fromarray(temp).resize(
            (component.shape[1], component.shape[0]), Image.Resampling.LANCZOS
        )
        temp_arr = np.array(temp_resized, dtype=np.float32)
        comp_arr = component.astype(np.float32)
        score = _normalized_cross_corr(comp_arr, temp_arr)
        if score > best_score:
            best_score = score
            best_char = char
    return best_char


def _normalized_cross_corr(a: np.ndarray, b: np.ndarray) -> float:
    a = a - a.mean()
    b = b - b.mean()
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return -1.0
    return float((a * b).sum() / denom)


def ocr_template(
    img: Image.Image,
    templates: Dict[str, np.ndarray],
    threshold: int,
    min_gap_px: int,
    min_col_ink: int,
    dot_height_ratio: float,
) -> str:
    components = segment_ink(img, threshold, min_gap_px, min_col_ink)
    if not components:
        return ""
    heights = [comp.shape[0] for comp in components]
    median_height = np.median(heights) if heights else 0
    chars = []
    for comp in components:
        if median_height and comp.shape[0] < median_height * dot_height_ratio:
            chars.append(".")
            continue
        chars.append(match_component(comp, {k: v for k, v in templates.items() if k != "."}))
    return "".join(chars)


def _build_sequence_templates(
    templates: Dict[str, np.ndarray],
    target_height: int,
    dot_height_ratio: float,
) -> Dict[str, np.ndarray]:
    seq_templates = {}
    for char, arr in templates.items():
        img = Image.fromarray(arr.astype(np.uint8))
        if char == ".":
            dot_height = max(2, int(round(target_height * dot_height_ratio)))
            img = img.resize((max(1, int(img.width * dot_height / img.height)), dot_height), Image.Resampling.LANCZOS)
            canvas = Image.new("L", (img.width, target_height), 255)
            y = (target_height - img.height) // 2
            canvas.paste(img, (0, y))
            seq_templates[char] = np.array(canvas, dtype=np.float32)
        else:
            img = img.resize((max(1, int(img.width * target_height / img.height)), target_height), Image.Resampling.LANCZOS)
            seq_templates[char] = np.array(img, dtype=np.float32)
    return seq_templates


def ocr_template_sequence(
    img: Image.Image,
    templates: Dict[str, np.ndarray],
    threshold: int,
    min_score: float,
    dot_height_ratio: float,
) -> str:
    mask = get_ink_mask(img, ink_threshold=threshold)
    if mask.sum() == 0:
        return ""
    ys, xs = np.where(mask > 0)
    min_x, max_x = xs.min(), xs.max()
    min_y, max_y = ys.min(), ys.max()
    region = img.convert("L").crop((min_x, min_y, max_x + 1, max_y + 1))
    region_arr = np.array(region, dtype=np.float32)
    seq_templates = _build_sequence_templates(templates, region_arr.shape[0], dot_height_ratio)
    output = []
    x = 0
    max_x = region_arr.shape[1]
    while x < max_x:
        best_char = ""
        best_score = -1.0
        best_width = 1
        for char, temp in seq_templates.items():
            w = temp.shape[1]
            if x + w > max_x:
                continue
            slice_arr = region_arr[:, x : x + w]
            score = _normalized_cross_corr(slice_arr, temp)
            if score > best_score:
                best_score = score
                best_char = char
                best_width = w
        if best_score < min_score:
            x += 1
            continue
        output.append(best_char)
        x += best_width
    return "".join(output)


def character_error_rate(expected: str, observed: str) -> float:
    if not expected:
        return 1.0
    dp = np.zeros((len(expected) + 1, len(observed) + 1), dtype=np.int32)
    for i in range(len(expected) + 1):
        dp[i, 0] = i
    for j in range(len(observed) + 1):
        dp[0, j] = j
    for i in range(1, len(expected) + 1):
        for j in range(1, len(observed) + 1):
            cost = 0 if expected[i - 1] == observed[j - 1] else 1
            dp[i, j] = min(
                dp[i - 1, j] + 1,
                dp[i, j - 1] + 1,
                dp[i - 1, j - 1] + cost,
            )
    return float(dp[len(expected), len(observed)] / len(expected))


def prepare_for_tesseract(
    img: Image.Image,
    resize_scale: float,
    threshold: int,
    crop_margin_px: int,
    target_height: int,
    invert: bool,
) -> Image.Image:
    from PIL import ImageOps

    if img.mode in ("RGBA", "LA"):
        background = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(background, img.convert("RGBA")).convert("RGB")
    gray = img.convert("L")
    mask = get_ink_mask(img, ink_threshold=200)
    if mask.sum() > 0:
        ys, xs = mask.nonzero()
        min_x = max(0, int(xs.min()) - crop_margin_px)
        max_x = min(mask.shape[1] - 1, int(xs.max()) + crop_margin_px)
        min_y = max(0, int(ys.min()) - crop_margin_px)
        max_y = min(mask.shape[0] - 1, int(ys.max()) + crop_margin_px)
        gray = gray.crop((min_x, min_y, max_x + 1, max_y + 1))
    if target_height and gray.height != target_height:
        new_w = max(1, int(round(gray.width * target_height / gray.height)))
        gray = gray.resize((new_w, target_height), Image.Resampling.LANCZOS)
    gray = ImageOps.autocontrast(gray)
    if resize_scale != 1.0:
        new_w = max(1, int(round(gray.width * resize_scale)))
        new_h = max(1, int(round(gray.height * resize_scale)))
        gray = gray.resize((new_w, new_h), Image.Resampling.LANCZOS)
    if threshold > 0:
        gray = gray.point(lambda p: 255 if p > threshold else 0)
    if invert:
        gray = ImageOps.invert(gray)
    return gray


def ocr_tesseract(
    img: Image.Image,
    whitelist: str,
    psm: int,
    oem: int,
    resize_scale: float,
    threshold: int,
    crop_margin_px: int,
    target_height: int,
    invert: bool,
) -> str:
    import pytesseract  # type: ignore

    prepared = prepare_for_tesseract(
        img,
        resize_scale,
        threshold,
        crop_margin_px,
        target_height,
        invert,
    )
    config = f"-c tessedit_char_whitelist={whitelist} --psm {psm} --oem {oem}"
    text = pytesseract.image_to_string(prepared, config=config).strip()
    return text.replace(",", ".")


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute OCR correctness metrics.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True)
    args = parser.parse_args()

    config = read_config(Path(args.config))
    prep = config["preprocess"]
    datefont_dir = Path(config["paths"]["datefont_dir"])
    templates = build_templates(datefont_dir)
    ocr_backend = config.get("ocr", {}).get("backend", "template")
    whitelist = config.get("ocr", {}).get("whitelist", "0123456789.")
    min_gap_px = int(config.get("ocr", {}).get("min_gap_px", 3))
    min_col_ink = int(config.get("ocr", {}).get("min_col_ink", 1))
    dot_height_ratio = float(config.get("ocr", {}).get("dot_height_ratio", 0.5))
    seq_min_score = float(config.get("ocr", {}).get("sequence_min_score", 0.3))
    tesseract_cmd = config.get("ocr", {}).get("tesseract_cmd")
    tesseract_psm = int(config.get("ocr", {}).get("tesseract_psm", 7))
    tesseract_oem = int(config.get("ocr", {}).get("tesseract_oem", 3))
    tesseract_resize = float(config.get("ocr", {}).get("tesseract_resize", 2.0))
    tesseract_threshold = int(config.get("ocr", {}).get("tesseract_threshold", 160))
    tesseract_crop_margin = int(config.get("ocr", {}).get("tesseract_crop_margin_px", 6))
    tesseract_target_height = int(config.get("ocr", {}).get("tesseract_target_height", 64))
    tesseract_invert = bool(config.get("ocr", {}).get("tesseract_invert", False))
    if ocr_backend == "tesseract":
        try:
            import pytesseract  # type: ignore
            if tesseract_cmd:
                import os

                if os.path.exists(tesseract_cmd):
                    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        except Exception as exc:
            raise RuntimeError("pytesseract not available but ocr.backend=tesseract") from exc

    run_dir = Path(args.run_dir)
    metadata_path = run_dir / "metadata.csv"
    output_path = run_dir / "metrics_ocr.csv"

    with metadata_path.open("r", encoding="utf-8") as csvfile, output_path.open(
        "w", newline="", encoding="utf-8"
    ) as out_csv:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames + [
            "ocr_raw",
            "ocr_normalized",
            "ocr_match",
            "cer",
        ]
        writer = csv.DictWriter(out_csv, fieldnames=fieldnames)
        writer.writeheader()
        for row in reader:
            img_path = Path(row["output_path"])
            with Image.open(img_path) as img:
                raw_img = img.copy()
            if ocr_backend == "tesseract":
                ocr_raw = ocr_tesseract(
                    raw_img,
                    whitelist,
                    tesseract_psm,
                    tesseract_oem,
                    tesseract_resize,
                    tesseract_threshold,
                    tesseract_crop_margin,
                    tesseract_target_height,
                    tesseract_invert,
                )
                proc = raw_img
            elif ocr_backend == "template_sequence":
                proc = preprocess(raw_img, prep)
                ocr_raw = ocr_template_sequence(
                    proc,
                    templates,
                    prep["ink_threshold"],
                    seq_min_score,
                    dot_height_ratio,
                )
            else:
                proc = preprocess(raw_img, prep)
                ocr_raw = ocr_template(
                    proc,
                    templates,
                    prep["ink_threshold"],
                    min_gap_px,
                    min_col_ink,
                    dot_height_ratio,
                )
            try:
                normalized = normalize_date_text(ocr_raw, config["generation"]["format"])
            except Exception:
                normalized = ""
            expected = row["date_string"]
            match = normalized == expected
            cer = character_error_rate(expected, normalized)
            row.update(
                {
                    "ocr_raw": ocr_raw,
                    "ocr_normalized": normalized,
                    "ocr_match": match,
                    "cer": cer,
                }
            )
            writer.writerow(row)


if __name__ == "__main__":
    main()
