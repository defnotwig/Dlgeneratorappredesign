import argparse
import csv
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from PIL import Image

from tools.utils_image import (
    checkerboard_score,
    extract_date_region,
    get_ink_mask,
    laplacian_variance,
    to_gray_alpha,
)
from tools.utils_io import read_config


def touches_border(mask: np.ndarray, border: int = 1) -> bool:
    if mask.size == 0:
        return False
    top = mask[:border, :].any()
    bottom = mask[-border:, :].any()
    left = mask[:, :border].any()
    right = mask[:, -border:].any()
    return bool(top or bottom or left or right)


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute artifact detection metrics.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True)
    args = parser.parse_args()

    config = read_config(Path(args.config))
    prep = config["preprocess"]
    thresholds = config["metrics"]

    run_dir = Path(args.run_dir)
    metadata_path = run_dir / "metadata.csv"
    output_path = run_dir / "metrics_artifacts.csv"

    with metadata_path.open("r", encoding="utf-8") as csvfile, output_path.open(
        "w", newline="", encoding="utf-8"
    ) as out_csv:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames + [
            "laplacian_var",
            "checkerboard_score",
            "touches_border",
            "artifact_ok",
        ]
        writer = csv.DictWriter(out_csv, fieldnames=fieldnames)
        writer.writeheader()
        for row in reader:
            img_path = Path(row["output_path"])
            with Image.open(img_path) as img:
                img = to_gray_alpha(img)
                if prep.get("extract_date_region", True):
                    img = extract_date_region(
                        img,
                        ink_threshold=prep["ink_threshold"],
                        height_ratio=prep.get("date_region_height_ratio", 0.4),
                        margin_px=prep.get("crop_margin_px", 4),
                    )
                lap_var = laplacian_variance(img)
                cb_score = checkerboard_score(img)
                mask = get_ink_mask(img, prep["ink_threshold"])
                border_px = thresholds["border_touch_px"]
                border = touches_border(mask, border=border_px) if border_px > 0 else False
            artifact_ok = (
                lap_var >= thresholds["blur_min_variance"]
                and cb_score <= thresholds["checkerboard_max"]
                and not border
            )
            row.update(
                {
                    "laplacian_var": lap_var,
                    "checkerboard_score": cb_score,
                    "touches_border": border,
                    "artifact_ok": artifact_ok,
                }
            )
            writer.writerow(row)


if __name__ == "__main__":
    main()
