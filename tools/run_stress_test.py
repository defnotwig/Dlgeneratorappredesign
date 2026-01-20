import argparse
import json
import platform
import subprocess
import sys
import time
import traceback
from pathlib import Path
from typing import Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np

from tools.utils_io import ensure_dir, init_logging, read_config


def run_step(logger, name: str, cmd: List[str], cwd: Path) -> float:
    logger.info("Running step: %s", name)
    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(cwd))
    duration = time.time() - start
    logger.info("Step %s finished in %.2fs", name, duration)
    if result.stdout:
        logger.info("%s stdout:\n%s", name, result.stdout)
    if result.stderr:
        logger.info("%s stderr:\n%s", name, result.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"Step {name} failed with code {result.returncode}")
    return duration


def collect_runtime_info() -> Dict[str, object]:
    info = {
        "python_version": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "numpy_version": np.__version__,
    }
    try:
        import torch

        info["torch_version"] = torch.__version__
        info["cuda_available"] = torch.cuda.is_available()
        if torch.cuda.is_available():
            info["cuda_device"] = torch.cuda.get_device_name(0)
            info["cuda_memory_allocated"] = int(torch.cuda.memory_allocated(0))
    except Exception:
        info["torch_version"] = "unavailable"
    return info


def main() -> None:
    parser = argparse.ArgumentParser(description="Run full stress test pipeline.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--tier", required=True, choices=["A", "B", "C"])
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--start-date", default=None)
    args = parser.parse_args()

    config_path = Path(args.config)
    if not config_path.is_absolute():
        config_path = (Path.cwd() / config_path).resolve()
    config = read_config(config_path)
    run_id = args.run_id or time.strftime("%Y%m%d_%H%M%S")
    run_dir = Path(config["paths"]["stress_runs_dir"]) / run_id
    ensure_dir(run_dir)
    logger = init_logging(run_dir / "run.log")

    runtime_info = collect_runtime_info()
    step_durations = {}
    try:
        step_durations["scan_datasets"] = run_step(
            logger,
            "scan_datasets",
            [
                sys.executable,
                str(Path(__file__).parent / "scan_datasets.py"),
                "--datefont",
                config["paths"]["datefont_dir"],
                "--dated",
                config["paths"]["dated_signatures_dir"],
                "--reports-dir",
                config["paths"]["reports_dir"],
            ],
            PROJECT_ROOT,
        )
        step_durations["preprocess"] = run_step(
            logger,
            "preprocess",
            [
                sys.executable,
                str(Path(__file__).parent / "preprocess.py"),
                "--config",
                str(config_path),
            ],
            PROJECT_ROOT,
        )
        step_durations["generate_dates"] = run_step(
            logger,
            "generate_dates",
            [
                sys.executable,
                str(Path(__file__).parent / "generate_dates.py"),
                "--config",
                str(config_path),
                "--tier",
                args.tier,
                "--run-id",
                run_id,
                *(["--start-date", args.start_date] if args.start_date else []),
            ],
            PROJECT_ROOT,
        )
        step_durations["metrics_style"] = run_step(
            logger,
            "metrics_style",
            [
                sys.executable,
                str(Path(__file__).parent / "metrics_style.py"),
                "--config",
                str(config_path),
                "--run-dir",
                str(run_dir),
            ],
            PROJECT_ROOT,
        )
        step_durations["metrics_diversity"] = run_step(
            logger,
            "metrics_diversity",
            [
                sys.executable,
                str(Path(__file__).parent / "metrics_diversity.py"),
                "--config",
                str(config_path),
                "--run-dir",
                str(run_dir),
            ],
            PROJECT_ROOT,
        )
        step_durations["metrics_ocr"] = run_step(
            logger,
            "metrics_ocr",
            [
                sys.executable,
                str(Path(__file__).parent / "metrics_ocr.py"),
                "--config",
                str(config_path),
                "--run-dir",
                str(run_dir),
            ],
            PROJECT_ROOT,
        )
        step_durations["metrics_layout"] = run_step(
            logger,
            "metrics_layout",
            [
                sys.executable,
                str(Path(__file__).parent / "metrics_layout.py"),
                "--config",
                str(config_path),
                "--run-dir",
                str(run_dir),
            ],
            PROJECT_ROOT,
        )
        step_durations["metrics_artifacts"] = run_step(
            logger,
            "metrics_artifacts",
            [
                sys.executable,
                str(Path(__file__).parent / "metrics_artifacts.py"),
                "--config",
                str(config_path),
                "--run-dir",
                str(run_dir),
            ],
            PROJECT_ROOT,
        )
        step_durations["report_builder"] = run_step(
            logger,
            "report_builder",
            [
                sys.executable,
                str(Path(__file__).parent / "report_builder.py"),
                "--config",
                str(config_path),
                "--run-dir",
                str(run_dir),
            ],
            PROJECT_ROOT,
        )
        metrics_path = run_dir / "metadata.csv"
        if metrics_path.exists():
            with metrics_path.open("r", encoding="utf-8") as csvfile:
                total = sum(1 for _ in csvfile) - 1
            if total > 0 and step_durations.get("generate_dates"):
                img_per_sec = total / step_durations["generate_dates"]
                logger.info("Generation throughput: %.2f images/sec", img_per_sec)

        (run_dir / "run_config.json").write_text(
            json.dumps(
                {
                    "run_id": run_id,
                    "tier": args.tier,
                    "config_path": str(config_path),
                    "start_date": args.start_date,
                    "runtime": runtime_info,
                    "step_durations_sec": step_durations,
                },
                indent=2,
            ),
            encoding="utf-8",
        )
    except Exception as exc:
        logger.error("Stress test failed: %s", exc)
        error_report = run_dir / "report_error.md"
        error_report.write_text(
            "# Stress Test Failure\n\n```\n" + traceback.format_exc() + "\n```\n",
            encoding="utf-8",
        )
        raise


if __name__ == "__main__":
    main()
