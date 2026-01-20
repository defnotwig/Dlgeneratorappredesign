import argparse
import csv
import sys
from pathlib import Path
from typing import Dict

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from PIL import Image

from tools.utils_image import (
    align_baseline,
    compute_layout_features,
    extract_date_region,
    pad_to_canvas,
    resize_to_height,
    to_gray_alpha,
)
from tools.utils_io import read_config


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute layout conformity metrics.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True)
    args = parser.parse_args()

    config = read_config(Path(args.config))
    prep = config["preprocess"]
    normalized_dir = Path(config["paths"]["normalized_dir"])
    ref_stats = read_config(normalized_dir / "dated_signatures_reference.json")
    means = np.array(ref_stats["layout_mean"], dtype=np.float32)
    stds = np.array(ref_stats["layout_std"], dtype=np.float32)
    feature_names = ref_stats["layout_feature_order"]

    run_dir = Path(args.run_dir)
    metadata_path = run_dir / "metadata.csv"
    output_path = run_dir / "metrics_layout.csv"

    with metadata_path.open("r", encoding="utf-8") as csvfile, output_path.open(
        "w", newline="", encoding="utf-8"
    ) as out_csv:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames + feature_names + ["max_z", "layout_ok"]
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
                img = resize_to_height(img, prep["target_height"])
                img = align_baseline(img, prep["baseline_ratio"], prep["ink_threshold"])
                img = pad_to_canvas(img, prep["canvas_width"], prep["canvas_height"])
                features = compute_layout_features(img, prep["ink_threshold"])
            values = np.array(
                [
                    features.left_margin,
                    features.right_margin,
                    features.top_margin,
                    features.bottom_margin,
                    features.baseline_ratio,
                    features.height_ratio,
                    features.width_ratio,
                    features.stroke_thickness,
                ],
                dtype=np.float32,
            )
            min_std = float(config["metrics"].get("layout_min_std", 1e-3))
            z = np.abs((values - means) / np.maximum(stds, min_std))
            max_z = float(z.max()) if z.size else 0.0
            layout_ok = max_z <= config["metrics"]["layout_z_max"]
            for name, value in zip(feature_names, values):
                row[name] = float(value)
            row["max_z"] = max_z
            row["layout_ok"] = layout_ok
            writer.writerow(row)


if __name__ == "__main__":
    main()
