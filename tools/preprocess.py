import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from PIL import Image
from skimage.feature import hog

from tools.utils_image import (
    align_baseline,
    compute_layout_features,
    extract_date_region,
    pad_to_canvas,
    resize_to_height,
    to_gray_alpha,
)
from tools.utils_io import ensure_dir, list_images, read_config, write_json


def preprocess_images(
    input_dir: Path,
    output_dir: Path,
    target_height: int,
    canvas_width: int,
    canvas_height: int,
    baseline_ratio: float,
    ink_threshold: int,
    do_extract_date_region: bool = False,
    date_region_height_ratio: float = 0.4,
    crop_margin_px: int = 4,
) -> List[Path]:
    ensure_dir(output_dir)
    outputs: List[Path] = []
    for path in list_images(input_dir):
        with Image.open(path) as img:
            img = to_gray_alpha(img)
            if do_extract_date_region:
                img = extract_date_region(
                    img,
                    ink_threshold=ink_threshold,
                    height_ratio=date_region_height_ratio,
                    margin_px=crop_margin_px,
                )
            img = resize_to_height(img, target_height)
            img = align_baseline(img, baseline_ratio, ink_threshold)
            img = pad_to_canvas(img, canvas_width, canvas_height)
            out_path = output_dir / path.name
            img.save(out_path, format="PNG", optimize=True)
            outputs.append(out_path)
    return outputs




def compute_reference_stats(
    image_paths: List[Path],
    ink_threshold: int,
    hog_pixels_per_cell: int = 8,
    hog_cells_per_block: int = 2,
) -> Dict[str, object]:
    layout_rows = []
    embeddings = []
    for path in image_paths:
        with Image.open(path) as img:
            features = compute_layout_features(img, ink_threshold)
            layout_rows.append(features)
            gray = np.array(img.convert("L"))
            vec = hog(
                gray,
                pixels_per_cell=(hog_pixels_per_cell, hog_pixels_per_cell),
                cells_per_block=(hog_cells_per_block, hog_cells_per_block),
                feature_vector=True,
            )
            embeddings.append(vec.astype(np.float32))
    layout_matrix = np.array(
        [
            [
                row.left_margin,
                row.right_margin,
                row.top_margin,
                row.bottom_margin,
                row.baseline_ratio,
                row.height_ratio,
                row.width_ratio,
                row.stroke_thickness,
            ]
            for row in layout_rows
        ],
        dtype=np.float32,
    )
    style_distance_p95 = 0.0
    if embeddings:
        emb_matrix = np.stack(embeddings)
        if emb_matrix.shape[0] > 1:
            sample_count = min(200, emb_matrix.shape[0])
            sample = emb_matrix[:sample_count]
            dists = []
            for i in range(sample.shape[0]):
                for j in range(i + 1, sample.shape[0]):
                    dists.append(float(np.linalg.norm(sample[i] - sample[j])))
            if dists:
                style_distance_p95 = float(np.percentile(np.array(dists), 95))

    summary = {
        "layout_feature_order": [
            "left_margin",
            "right_margin",
            "top_margin",
            "bottom_margin",
            "baseline_ratio",
            "height_ratio",
            "width_ratio",
            "stroke_thickness",
        ],
        "layout_mean": layout_matrix.mean(axis=0).tolist() if layout_matrix.size else [],
        "layout_std": layout_matrix.std(axis=0).tolist() if layout_matrix.size else [],
        "layout_rows": [row.__dict__ for row in layout_rows],
        "embedding_count": len(embeddings),
        "style_distance_p95": style_distance_p95,
    }
    return summary, embeddings


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess datasets for stress testing.")
    parser.add_argument("--config", required=True, help="Path to stress_test config file")
    args = parser.parse_args()

    config = read_config(Path(args.config))
    paths = config["paths"]
    prep = config["preprocess"]

    datefont_dir = Path(paths["datefont_dir"])
    dated_dir = Path(paths["dated_signatures_dir"])
    normalized_root = Path(paths["normalized_dir"])

    datefont_out = normalized_root / "datefont"
    dated_out = normalized_root / "dated_signatures"

    preprocess_images(
        datefont_dir,
        datefont_out,
        prep["target_height"],
        prep["canvas_width"],
        prep["canvas_height"],
        prep["baseline_ratio"],
        prep["ink_threshold"],
        do_extract_date_region=False,
    )
    dated_images = preprocess_images(
        dated_dir,
        dated_out,
        prep["target_height"],
        prep["canvas_width"],
        prep["canvas_height"],
        prep["baseline_ratio"],
        prep["ink_threshold"],
        do_extract_date_region=prep.get("extract_date_region", True),
        date_region_height_ratio=prep.get("date_region_height_ratio", 0.4),
        crop_margin_px=prep.get("crop_margin_px", 4),
    )

    ref_summary, embeddings = compute_reference_stats(
        dated_images, prep["ink_threshold"]
    )
    ensure_dir(normalized_root)
    write_json(normalized_root / "dated_signatures_reference.json", ref_summary)
    embedding_path = normalized_root / "dated_signatures_embeddings.npz"
    np.savez_compressed(
        embedding_path,
        embeddings=np.stack(embeddings) if embeddings else np.zeros((0, 1)),
        paths=[str(p) for p in dated_images],
    )
    index_path = normalized_root / "dated_signatures_index.json"
    write_json(index_path, {"paths": [str(p) for p in dated_images]})


if __name__ == "__main__":
    main()
