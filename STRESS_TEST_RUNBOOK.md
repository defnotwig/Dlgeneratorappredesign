# GAN Date Generation Stress Test Runbook

This runbook describes how to execute the date generation stress test pipeline
and how to interpret its outputs. Paths and defaults match the local Windows
setup described in `configs/stress_test.yaml`.

## Prerequisites
- Python with packages listed in `backend/requirements.txt`.
- Optional: `lpips` for true LPIPS distance (fallback uses VGG proxy).
- Optional: `pytesseract` + Tesseract binary if `ocr.backend` is set to tesseract.

## Pipeline Order
1) Dataset scan
2) Preprocess and reference stats
3) Date generation
4) Metrics (style, diversity, OCR, layout, artifacts)
5) Report generation

## Quick Start (Tier A)
```
python tools/scan_datasets.py --datefont "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\sign\datefont" --dated "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\sign\dated_signatures" --reports-dir reports
python tools/preprocess.py --config configs\stress_test.yaml
python tools/run_stress_test.py --config configs\stress_test.yaml --tier A --start-date 2025-01-01
```

## Tier Runs
- Tier A (smoke): `--tier A`
- Tier B (standard): `--tier B`
- Tier C (full): `--tier C`

## Outputs
- `reports/dataset_summary.json`
- `reports/dataset_summary.md`
- `normalized_cache/dated_signatures_reference.json`
- `stress_runs/<run_id>/metadata.csv`
- `stress_runs/<run_id>/metrics_style.csv`
- `stress_runs/<run_id>/metrics_diversity.csv`
- `stress_runs/<run_id>/metrics_ocr.csv`
- `stress_runs/<run_id>/metrics_layout.csv`
- `stress_runs/<run_id>/metrics_artifacts.csv`
- `stress_runs/<run_id>/metrics.csv`
- `stress_runs/<run_id>/report.html`
- `stress_runs/<run_id>/report.md`
- `stress_runs/<run_id>/run.log`
- `stress_runs/<run_id>/run_config.json`

## Interpreting Results
- `report.html` shows failure buckets with thumbnail grids.
- `metrics.csv` is the combined per-image view.
- Style threshold guidance: check `normalized_cache/dated_signatures_reference.json`
  for `style_distance_p95` and tune `metrics.style_distance_max` as needed.

## Acceptance Criteria
- OCR exact match rate >= 0.98 on Tier B
- Style pass rate >= 0.95
- Diversity thresholds met (see `metrics_diversity.csv`)
- Layout outliers <= 2%
- Artifact rate <= 2%

## Notes
- If you switch the generator to a real GAN, update the `generation.generator`
  section in `configs/stress_test.yaml` to point at the correct callable.
