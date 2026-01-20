import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from PIL import Image

from tools.utils_io import ensure_dir, read_config, write_md


def read_csv(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        return [row for row in reader]


def build_lookup(rows: List[Dict[str, str]], key: str) -> Dict[str, Dict[str, str]]:
    return {row[key]: row for row in rows if key in row}


def copy_thumbnail(src: Path, dst: Path, size: Tuple[int, int] = (300, 120)) -> None:
    ensure_dir(dst.parent)
    with Image.open(src) as img:
        img.thumbnail(size)
        img.save(dst, format="PNG")


def render_image_grid(title: str, items: List[Dict[str, str]], assets_dir: Path) -> str:
    html = [f"<h3>{title}</h3>", '<div class="grid">']
    for item in items:
        img_src = Path(item["output_path"])
        thumb_path = assets_dir / img_src.name
        copy_thumbnail(img_src, thumb_path)
        html.append(
            f'<div class="cell"><img src="{thumb_path.as_posix()}" />'
            f'<div class="caption">{item.get("caption", "")}</div></div>'
        )
    html.append("</div>")
    return "\n".join(html)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build HTML/Markdown report.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--run-dir", required=True)
    args = parser.parse_args()

    config = read_config(Path(args.config))
    thresholds = config["metrics"]
    run_dir = Path(args.run_dir)
    report_assets = run_dir / "report_assets"
    ensure_dir(report_assets)

    metadata = read_csv(run_dir / "metadata.csv")
    style_rows = read_csv(run_dir / "metrics_style.csv")
    ocr_rows = read_csv(run_dir / "metrics_ocr.csv")
    layout_rows = read_csv(run_dir / "metrics_layout.csv")
    artifact_rows = read_csv(run_dir / "metrics_artifacts.csv")
    diversity_rows = read_csv(run_dir / "metrics_diversity.csv")

    by_path = build_lookup(metadata, "output_path")
    style_by_path = build_lookup(style_rows, "output_path")
    ocr_by_path = build_lookup(ocr_rows, "output_path")
    layout_by_path = build_lookup(layout_rows, "output_path")
    artifact_by_path = build_lookup(artifact_rows, "output_path")

    buckets = {
        "ocr_mismatch": [],
        "style_fail": [],
        "layout_outlier": [],
        "artifact_fail": [],
    }

    diversity_fail_dates = []
    for row in diversity_rows:
        min_dist = float(row.get("min_distance", 0.0))
        mean_dist = float(row.get("mean_distance", 0.0))
        if min_dist < thresholds["diversity_min_distance"] or mean_dist < thresholds["diversity_mean_distance"]:
            diversity_fail_dates.append(row.get("date_iso", ""))

    for path, meta in by_path.items():
        style = style_by_path.get(path, {})
        ocr = ocr_by_path.get(path, {})
        layout = layout_by_path.get(path, {})
        artifact = artifact_by_path.get(path, {})

        if ocr and str(ocr.get("ocr_match", "")).lower() == "false":
            buckets["ocr_mismatch"].append({**meta, "caption": ocr.get("ocr_raw", "")})

        style_distance = float(style.get("style_distance", 0.0)) if style else 0.0
        ssim = float(style.get("ssim", 0.0)) if style else 0.0
        if style and (style_distance > thresholds["style_distance_max"] or ssim < thresholds["ssim_min"]):
            buckets["style_fail"].append(
                {
                    **meta,
                    "caption": f"dist={style_distance:.3f} ssim={ssim:.3f}",
                }
            )

        if layout and str(layout.get("layout_ok", "")).lower() == "false":
            buckets["layout_outlier"].append(
                {**meta, "caption": f"max_z={layout.get('max_z', '')}"}
            )

        if artifact and str(artifact.get("artifact_ok", "")).lower() == "false":
            buckets["artifact_fail"].append(
                {
                    **meta,
                    "caption": f"lap={artifact.get('laplacian_var', '')}",
                }
            )

    total_images = len(metadata)
    ocr_mismatch = len(buckets["ocr_mismatch"])
    style_fail = len(buckets["style_fail"])
    layout_outlier = len(buckets["layout_outlier"])
    artifact_fail = len(buckets["artifact_fail"])

    ocr_exact = (total_images - ocr_mismatch) / total_images if total_images else 0.0
    style_pass = (total_images - style_fail) / total_images if total_images else 0.0
    layout_pass = (total_images - layout_outlier) / total_images if total_images else 0.0
    artifact_rate = artifact_fail / total_images if total_images else 0.0

    summary = {
        "total_images": total_images,
        "ocr_mismatch": ocr_mismatch,
        "style_fail": style_fail,
        "layout_outlier": layout_outlier,
        "artifact_fail": artifact_fail,
        "diversity_fail_dates": len(set(diversity_fail_dates)),
        "ocr_exact_match_rate": round(ocr_exact, 4),
        "style_pass_rate": round(style_pass, 4),
        "layout_pass_rate": round(layout_pass, 4),
        "artifact_rate": round(artifact_rate, 4),
    }

    # Build combined metrics.csv
    combined_path = run_dir / "metrics.csv"
    with combined_path.open("w", newline="", encoding="utf-8") as out_csv:
        fieldnames = [
            "output_path",
            "date_string",
            "date_iso",
            "seed",
            "style_distance",
            "ssim",
            "psnr",
            "perceptual_distance",
            "perceptual_backend",
            "ocr_raw",
            "ocr_normalized",
            "ocr_match",
            "cer",
            "max_z",
            "layout_ok",
            "laplacian_var",
            "checkerboard_score",
            "touches_border",
            "artifact_ok",
        ]
        writer = csv.DictWriter(out_csv, fieldnames=fieldnames)
        writer.writeheader()
        for path, meta in by_path.items():
            style = style_by_path.get(path, {})
            ocr = ocr_by_path.get(path, {})
            layout = layout_by_path.get(path, {})
            artifact = artifact_by_path.get(path, {})
            writer.writerow(
                {
                    "output_path": path,
                    "date_string": meta.get("date_string", ""),
                    "date_iso": meta.get("date_iso", ""),
                    "seed": meta.get("seed", ""),
                    "style_distance": style.get("style_distance", ""),
                    "ssim": style.get("ssim", ""),
                    "psnr": style.get("psnr", ""),
                    "perceptual_distance": style.get("perceptual_distance", ""),
                    "perceptual_backend": style.get("perceptual_backend", ""),
                    "ocr_raw": ocr.get("ocr_raw", ""),
                    "ocr_normalized": ocr.get("ocr_normalized", ""),
                    "ocr_match": ocr.get("ocr_match", ""),
                    "cer": ocr.get("cer", ""),
                    "max_z": layout.get("max_z", ""),
                    "layout_ok": layout.get("layout_ok", ""),
                    "laplacian_var": artifact.get("laplacian_var", ""),
                    "checkerboard_score": artifact.get("checkerboard_score", ""),
                    "touches_border": artifact.get("touches_border", ""),
                    "artifact_ok": artifact.get("artifact_ok", ""),
                }
            )

    html_sections = [
        "<html><head><style>",
        ".grid{display:flex;flex-wrap:wrap;gap:8px}.cell{width:220px}",
        ".cell img{max-width:220px;border:1px solid #ccc}",
        ".caption{font-size:12px}",
        "</style></head><body>",
        "<h1>Stress Test Report</h1>",
        f"<pre>{json.dumps(summary, indent=2)}</pre>",
    ]

    # Golden samples per month based on style distance
    month_best = {}
    month_worst = {}
    for path, meta in by_path.items():
        date_iso = meta.get("date_iso", "")
        if len(date_iso) < 7:
            continue
        month = date_iso[:7]
        style_distance = float(style_by_path.get(path, {}).get("style_distance", 0.0))
        if month not in month_best or style_distance < month_best[month][0]:
            month_best[month] = (style_distance, path)
        if month not in month_worst or style_distance > month_worst[month][0]:
            month_worst[month] = (style_distance, path)

    best_items = []
    worst_items = []
    for month, (_, path) in sorted(month_best.items()):
        if path in by_path:
            best_items.append({**by_path[path], "output_path": path, "caption": month})
    for month, (_, path) in sorted(month_worst.items()):
        if path in by_path:
            worst_items.append({**by_path[path], "output_path": path, "caption": month})

    if best_items:
        html_sections.append(render_image_grid("best_per_month", best_items[:50], report_assets / "best_per_month"))
    if worst_items:
        html_sections.append(render_image_grid("worst_per_month", worst_items[:50], report_assets / "worst_per_month"))

    for bucket_name, items in buckets.items():
        worst = items[:50]
        html_sections.append(
            render_image_grid(bucket_name, worst, report_assets / bucket_name)
        )

    html_sections.append("</body></html>")
    (run_dir / "report.html").write_text("\n".join(html_sections), encoding="utf-8")

    md_lines = ["# Stress Test Report", "", "## Summary", ""]
    for key, value in summary.items():
        md_lines.append(f"- {key}: {value}")
    md_lines.append("")
    write_md(run_dir / "report.md", md_lines)


if __name__ == "__main__":
    main()
