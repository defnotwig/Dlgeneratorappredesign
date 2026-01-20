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

from tools.utils_io import list_images, write_json, write_md


def scan_images(root: Path) -> Dict[str, object]:
    files = list_images(root)
    stats: List[Dict[str, object]] = []
    errors = 0
    for path in files:
        try:
            with Image.open(path) as img:
                img.verify()
            with Image.open(path) as img:
                mode = img.mode
                width, height = img.size
                arr = np.array(img.convert("RGBA"), dtype=np.float32)
                alpha = arr[..., 3]
                alpha_usage = float((alpha < 255).mean())
                gray = arr[..., 0]
                stats.append(
                    {
                        "path": str(path),
                        "mode": mode,
                        "width": width,
                        "height": height,
                        "aspect_ratio": width / float(height),
                        "mean": float(gray.mean()),
                        "var": float(gray.var()),
                        "alpha_usage": alpha_usage,
                    }
                )
        except Exception as exc:
            stats.append({"path": str(path), "error": str(exc)})
            errors += 1
    widths = [s["width"] for s in stats if "width" in s]
    heights = [s["height"] for s in stats if "height" in s]
    aspect = [s["aspect_ratio"] for s in stats if "aspect_ratio" in s]
    means = [s["mean"] for s in stats if "mean" in s]
    variances = [s["var"] for s in stats if "var" in s]
    alpha_usage = [s["alpha_usage"] for s in stats if "alpha_usage" in s]
    summary = {
        "root": str(root),
        "count": len(files),
        "errors": errors,
        "widths": _describe(widths),
        "heights": _describe(heights),
        "aspect_ratio": _describe(aspect),
        "mean": _describe(means),
        "variance": _describe(variances),
        "alpha_usage": _describe(alpha_usage),
        "files": stats,
    }
    return summary


def _describe(values: List[float]) -> Dict[str, float]:
    if not values:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "std": 0.0}
    arr = np.array(values, dtype=np.float32)
    return {
        "min": float(arr.min()),
        "max": float(arr.max()),
        "mean": float(arr.mean()),
        "std": float(arr.std()),
    }


def build_markdown(summary: Dict[str, object], name: str) -> List[str]:
    lines = [f"# Dataset Summary: {name}", ""]
    lines.append(f"- root: {summary['root']}")
    lines.append(f"- count: {summary['count']}")
    lines.append(f"- errors: {summary['errors']}")
    for key in ["widths", "heights", "aspect_ratio", "mean", "variance", "alpha_usage"]:
        desc = summary[key]
        lines.append(
            f"- {key}: min={desc['min']:.3f} max={desc['max']:.3f} "
            f"mean={desc['mean']:.3f} std={desc['std']:.3f}"
        )
    return lines


def main() -> None:
    parser = argparse.ArgumentParser(description="Scan datasets and write summaries.")
    parser.add_argument("--datefont", required=True, help="Path to datefont directory")
    parser.add_argument("--dated", required=True, help="Path to dated_signatures directory")
    parser.add_argument("--reports-dir", default="reports", help="Reports output directory")
    args = parser.parse_args()

    reports_dir = Path(args.reports_dir)
    datefont_summary = scan_images(Path(args.datefont))
    dated_summary = scan_images(Path(args.dated))

    output = {"datefont": datefont_summary, "dated_signatures": dated_summary}
    write_json(reports_dir / "dataset_summary.json", output)

    md_lines = ["# Dataset Summary", ""]
    md_lines.extend(build_markdown(datefont_summary, "datefont"))
    md_lines.append("")
    md_lines.extend(build_markdown(dated_summary, "dated_signatures"))
    write_md(reports_dir / "dataset_summary.md", md_lines)


if __name__ == "__main__":
    main()
