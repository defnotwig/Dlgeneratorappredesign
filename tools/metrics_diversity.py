import argparse
import csv
import sys
from itertools import combinations
from pathlib import Path
from typing import Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from PIL import Image
from skimage.feature import hog

from tools.utils_image import align_baseline, pad_to_canvas, resize_to_height, to_gray_alpha
from tools.utils_io import read_config


def preprocess(img: Image.Image, prep: Dict[str, int]) -> Image.Image:
    img = to_gray_alpha(img)
    img = resize_to_height(img, prep["target_height"])
    img = align_baseline(img, prep["baseline_ratio"], prep["ink_threshold"])
    img = pad_to_canvas(img, prep["canvas_width"], prep["canvas_height"])
    return img


def compute_embedding(img: Image.Image) -> np.ndarray:
    gray = np.array(img.convert("L"))
    vec = hog(gray, pixels_per_cell=(8, 8), cells_per_block=(2, 2), feature_vector=True)
    return vec.astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute diversity metrics.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True)
    args = parser.parse_args()

    config = read_config(Path(args.config))
    prep = config["preprocess"]

    run_dir = Path(args.run_dir)
    metadata_path = run_dir / "metadata.csv"
    output_path = run_dir / "metrics_diversity.csv"

    rows_by_date: Dict[str, List[Dict[str, str]]] = {}
    with metadata_path.open("r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            rows_by_date.setdefault(row["date_iso"], []).append(row)

    with output_path.open("w", newline="", encoding="utf-8") as out_csv:
        fieldnames = [
            "date_iso",
            "count",
            "min_distance",
            "mean_distance",
        ]
        writer = csv.DictWriter(out_csv, fieldnames=fieldnames)
        writer.writeheader()
        for date_iso, rows in rows_by_date.items():
            embeddings = []
            for row in rows:
                img_path = Path(row["output_path"])
                with Image.open(img_path) as img:
                    proc = preprocess(img, prep)
                embeddings.append(compute_embedding(proc))
            distances = []
            for a, b in combinations(embeddings, 2):
                distances.append(float(np.linalg.norm(a - b)))
            min_dist = min(distances) if distances else 0.0
            mean_dist = float(np.mean(distances)) if distances else 0.0
            writer.writerow(
                {
                    "date_iso": date_iso,
                    "count": len(rows),
                    "min_distance": min_dist,
                    "mean_distance": mean_dist,
                }
            )


if __name__ == "__main__":
    main()
