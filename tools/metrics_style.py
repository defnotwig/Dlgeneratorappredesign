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
from skimage.feature import hog
from skimage.metrics import peak_signal_noise_ratio, structural_similarity

from tools.utils_image import (
    align_baseline,
    extract_date_region,
    pad_to_canvas,
    resize_to_height,
    to_gray_alpha,
)
from tools.utils_io import read_config


def preprocess_for_metrics(
    img: Image.Image,
    target_height: int,
    canvas_width: int,
    canvas_height: int,
    baseline_ratio: float,
    ink_threshold: int,
    extract_region: bool,
    date_region_height_ratio: float,
    crop_margin_px: int,
) -> Image.Image:
    img = to_gray_alpha(img)
    if extract_region:
        img = extract_date_region(
            img,
            ink_threshold=ink_threshold,
            height_ratio=date_region_height_ratio,
            margin_px=crop_margin_px,
        )
    img = resize_to_height(img, target_height)
    img = align_baseline(img, baseline_ratio, ink_threshold)
    img = pad_to_canvas(img, canvas_width, canvas_height)
    return img


def load_reference_embeddings(normalized_dir: Path) -> Tuple[np.ndarray, List[str]]:
    data = np.load(normalized_dir / "dated_signatures_embeddings.npz", allow_pickle=True)
    embeddings = data["embeddings"]
    paths = [str(p) for p in data["paths"]]
    return embeddings, paths


def compute_embedding(img: Image.Image, pixels_per_cell: int = 8, cells_per_block: int = 2) -> np.ndarray:
    gray = np.array(img.convert("L"))
    vec = hog(
        gray,
        pixels_per_cell=(pixels_per_cell, pixels_per_cell),
        cells_per_block=(cells_per_block, cells_per_block),
        feature_vector=True,
    )
    return vec.astype(np.float32)


def compute_perceptual_distance(img: Image.Image, ref: Image.Image) -> Tuple[float, str]:
    try:
        import torch
        import lpips  # type: ignore

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        loss_fn = lpips.LPIPS(net="alex").to(device)
        img_t = torch.from_numpy(np.array(img.convert("RGB"))).permute(2, 0, 1).unsqueeze(0).float()
        ref_t = torch.from_numpy(np.array(ref.convert("RGB"))).permute(2, 0, 1).unsqueeze(0).float()
        img_t = img_t / 127.5 - 1.0
        ref_t = ref_t / 127.5 - 1.0
        with torch.no_grad():
            dist = loss_fn(img_t.to(device), ref_t.to(device)).item()
        return float(dist), "lpips"
    except Exception:
        pass

    try:
        import torch
        from torchvision import models, transforms

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1).features.to(device).eval()
        transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )
        with torch.no_grad():
            t_img = transform(img.convert("RGB")).unsqueeze(0).to(device)
            t_ref = transform(ref.convert("RGB")).unsqueeze(0).to(device)
            feat_img = model(t_img).flatten()
            feat_ref = model(t_ref).flatten()
            dist = torch.nn.functional.mse_loss(feat_img, feat_ref).item()
        return float(dist), "vgg_proxy"
    except Exception:
        return 0.0, "unavailable"


def main() -> None:
    parser = argparse.ArgumentParser(description="Compute style similarity metrics.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True, help="Stress run directory")
    args = parser.parse_args()

    config = read_config(Path(args.config))
    prep = config["preprocess"]
    normalized_dir = Path(config["paths"]["normalized_dir"])
    embeddings, ref_paths = load_reference_embeddings(normalized_dir)

    run_dir = Path(args.run_dir)
    metadata_path = run_dir / "metadata.csv"
    output_path = run_dir / "metrics_style.csv"

    with metadata_path.open("r", encoding="utf-8") as csvfile, output_path.open(
        "w", newline="", encoding="utf-8"
    ) as out_csv:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames + [
            "style_distance",
            "ssim",
            "psnr",
            "perceptual_distance",
            "perceptual_backend",
            "nearest_reference",
        ]
        writer = csv.DictWriter(out_csv, fieldnames=fieldnames)
        writer.writeheader()
        for row in reader:
            img_path = Path(row["output_path"])
            with Image.open(img_path) as img:
                proc = preprocess_for_metrics(
                    img,
                    prep["target_height"],
                    prep["canvas_width"],
                    prep["canvas_height"],
                    prep["baseline_ratio"],
                    prep["ink_threshold"],
                    prep.get("extract_date_region", True),
                    prep.get("date_region_height_ratio", 0.4),
                    prep.get("crop_margin_px", 4),
                )
            emb = compute_embedding(proc)
            if embeddings.size == 0:
                nearest_idx = -1
                style_distance = 0.0
            else:
                dists = np.linalg.norm(embeddings - emb, axis=1)
                nearest_idx = int(np.argmin(dists))
                style_distance = float(dists[nearest_idx])
            nearest_ref = ref_paths[nearest_idx] if nearest_idx >= 0 else ""
            ssim_val = 0.0
            psnr_val = 0.0
            perceptual = 0.0
            perceptual_backend = "unavailable"
            if nearest_ref:
                with Image.open(nearest_ref) as ref_img:
                    ref_gray = np.array(ref_img.convert("L"))
                    gen_gray = np.array(proc.convert("L"))
                    ssim_val = float(
                        structural_similarity(gen_gray, ref_gray, data_range=255)
                    )
                    psnr_val = float(
                        peak_signal_noise_ratio(ref_gray, gen_gray, data_range=255)
                    )
                    perceptual, perceptual_backend = compute_perceptual_distance(proc, ref_img)
            row.update(
                {
                    "style_distance": style_distance,
                    "ssim": ssim_val,
                    "psnr": psnr_val,
                    "perceptual_distance": perceptual,
                    "perceptual_backend": perceptual_backend,
                    "nearest_reference": nearest_ref,
                }
            )
            writer.writerow(row)


if __name__ == "__main__":
    main()
