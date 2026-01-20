import argparse
import asyncio
import csv
import importlib
import json
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Tuple

from io import BytesIO

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from PIL import Image

from tools.utils_dates import format_date, generate_date_range
from tools.utils_io import ensure_dir, read_config


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except Exception:
        pass


def _load_callable(module_path: str, callable_path: str) -> Callable[..., Any]:
    module = importlib.import_module(module_path)
    target = module
    for part in callable_path.split("."):
        target = getattr(target, part)
    return target


async def _call_generator(
    generator: Callable[..., Any],
    kwargs: Dict[str, Any],
) -> Dict[str, Any]:
    result = generator(**kwargs)
    if asyncio.iscoroutine(result):
        return await result
    return result


def _load_datefont_renderer(module_path: str = "sign.signature_dater"):
    module = importlib.import_module(module_path)
    load_images = getattr(module, "load_custom_font_images")
    render_text = getattr(module, "render_date_with_custom_font")
    return load_images, render_text


def render_with_datefont(
    date_str: str,
    datefont_dir: Path,
    canvas_width: Optional[int] = None,
    canvas_height: Optional[int] = None,
    align_bottom: bool = False,
    bottom_margin_px: int = 4,
) -> Image.Image:
    load_images, render_text = _load_datefont_renderer()
    font_images = load_images(str(datefont_dir))
    if not font_images:
        raise RuntimeError("datefont images missing; cannot render")
    text_img = render_text(date_str, font_images, spacing=2)
    if canvas_width and canvas_height:
        canvas = Image.new("RGBA", (canvas_width, canvas_height), (255, 255, 255, 0))
        x = max(0, (canvas_width - text_img.width) // 2)
        if align_bottom:
            y = canvas_height - text_img.height - bottom_margin_px
        else:
            y = max(0, (canvas_height - text_img.height) // 2)
        y = max(0, min(y, canvas_height - text_img.height))
        canvas.paste(text_img, (x, y), text_img)
        return canvas
    return text_img


def resolve_generator(config: Dict[str, Any]) -> Dict[str, Any]:
    gen_cfg = config["generation"]["generator"]
    gen_type = gen_cfg["type"]
    project_root = Path(__file__).resolve().parents[1]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    # Add backend directory to sys.path for GAN module import
    backend_root = project_root / "backend"
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))
    if gen_type == "handwriting_gan":
        generator = _load_callable(gen_cfg["module"], gen_cfg["callable"])
        return {
            "type": gen_type,
            "callable": generator,
            "uses_datetime": bool(gen_cfg.get("uses_datetime", True)),
            "args": gen_cfg.get("args", {}),
        }
    if gen_type == "datefont_renderer":
        return {"type": gen_type, "callable": None, "uses_datetime": False, "args": gen_cfg.get("args", {})}
    raise ValueError(f"Unsupported generator type: {gen_type}")


def _resolve_date_range(
    tier: str,
    start_date: Optional[date],
    config: Dict[str, Any],
) -> Tuple[date, date]:
    tier_cfg = config["generation"]["tier_ranges"][tier]
    if start_date:
        start = start_date
    else:
        start = date.today()
    if "days" in tier_cfg:
        end = start + timedelta(days=tier_cfg["days"] - 1)
    else:
        years = tier_cfg.get("years", 1)
        try:
            end = date(start.year + years, start.month, start.day) - timedelta(days=1)
        except ValueError:
            end = date(start.year + years, start.month, 28) - timedelta(days=1)
    return start, end


async def generate_images(
    run_dir: Path,
    config: Dict[str, Any],
    tier: str,
    start_date: Optional[date],
) -> Dict[str, Any]:
    generator = resolve_generator(config)
    gen_cfg = config["generation"]
    seeds_per_date = gen_cfg["seeds_per_date"][tier]
    date_format = gen_cfg["format"]
    datefont_dir = Path(config["paths"]["datefont_dir"])

    start, end = _resolve_date_range(tier, start_date, config)
    dates = generate_date_range(start, end)
    output_images = run_dir / "images"
    ensure_dir(output_images)

    metadata_path = run_dir / "metadata.csv"
    ensure_dir(metadata_path.parent)

    with metadata_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=[
                "output_path",
                "date_string",
                "date_iso",
                "seed",
                "tier",
                "generator_type",
                "model_checkpoint",
            ],
        )
        writer.writeheader()
        for date_value in dates:
            date_str = format_date(date_value, date_format)
            for seed_offset in range(seeds_per_date):
                seed = gen_cfg["seed_base"] + seed_offset + (date_value.toordinal() % 100000)
                set_seed(seed)
                out_dir = output_images / f"{date_value.year:04d}" / f"{date_value.month:02d}"
                ensure_dir(out_dir)
                out_path = out_dir / f"{date_value.day:02d}_seed{seed}.png"

                if generator["type"] == "datefont_renderer":
                    gen_args = dict(generator.get("args", {}))
                    img = render_with_datefont(
                        date_str,
                        datefont_dir,
                        canvas_width=gen_args.get("canvas_width"),
                        canvas_height=gen_args.get("canvas_height"),
                        align_bottom=bool(gen_args.get("align_bottom", False)),
                        bottom_margin_px=int(gen_args.get("bottom_margin_px", 4)),
                    )
                else:
                    gen_args = dict(generator.get("args", {}))
                    if generator["uses_datetime"]:
                        gen_args["date"] = date_value
                    else:
                        gen_args["date"] = date_str
                    gen_out = await _call_generator(generator["callable"], gen_args)
                    img = _resolve_image_from_output(gen_out)

                img.save(out_path, format="PNG", optimize=True)
                writer.writerow(
                    {
                        "output_path": str(out_path),
                        "date_string": date_str,
                        "date_iso": date_value.isoformat(),
                        "seed": seed,
                        "tier": tier,
                        "generator_type": generator["type"],
                        "model_checkpoint": gen_cfg.get("model_checkpoint", "unknown"),
                    }
                )
    return {"start_date": start.isoformat(), "end_date": end.isoformat(), "total": len(dates)}


def _resolve_image_from_output(output: Dict[str, Any]) -> Image.Image:
    if isinstance(output, Image.Image):
        return output
    if isinstance(output, dict):
        if "image_bytes" in output:
            return Image.open(BytesIO(output["image_bytes"])).convert("RGBA")
        if "image_base64" in output:
            import base64
            return Image.open(BytesIO(base64.b64decode(output["image_base64"]))).convert("RGBA")
        if "image_path" in output:
            return Image.open(output["image_path"]).convert("RGBA")
    raise ValueError("Unsupported generator output format")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate date images for stress testing.")
    parser.add_argument("--config", required=True, help="Path to config file")
    parser.add_argument("--tier", required=True, choices=["A", "B", "C"])
    parser.add_argument("--run-id", default=None, help="Run identifier")
    parser.add_argument("--start-date", default=None, help="YYYY-MM-DD")
    args = parser.parse_args()

    config = read_config(Path(args.config))
    run_id = args.run_id or datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = Path(config["paths"]["stress_runs_dir"]) / run_id
    ensure_dir(run_dir)

    start_date = date.fromisoformat(args.start_date) if args.start_date else None
    result = asyncio.run(generate_images(run_dir, config, args.tier, start_date))

    run_config_path = run_dir / "generation_config.json"
    run_config_path.write_text(
        json.dumps(
            {
                "tier": args.tier,
                "run_id": run_id,
                "start_date": result["start_date"],
                "end_date": result["end_date"],
                "config_path": args.config,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
