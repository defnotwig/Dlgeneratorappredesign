from pathlib import Path
import shutil


def update_active_signature(signature_file_path: str) -> None:
    if not signature_file_path:
        return

    backend_root = Path(__file__).resolve().parents[2]
    project_root = backend_root.parent
    source_path = backend_root / signature_file_path.lstrip("/")
    if not source_path.exists():
        return

    targets = [
        project_root / "sign" / "atty_signature.png",
        project_root / "public" / "sign" / "atty_signature.png",
    ]

    for target in targets:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, target)
