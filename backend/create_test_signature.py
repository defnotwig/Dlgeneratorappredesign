"""
Create test signature for DL Generator
"""

import sqlite3
from pathlib import Path
from datetime import datetime, timezone

# Database path
DB_PATH = Path(__file__).parent / "database" / "dl_generator.db"
# Test signature path (using the one mentioned in the code)
TEST_SIGNATURE_PATH = "uploads/signatures/test_signature.png"

def create_test_signature():
    """Create a test signature record in the database"""
    print(" Creating test signature record...")

    try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if test signature already exists
    cursor.execute("SELECT id FROM signature_assets WHERE file_name = 'test_signature.png'")
    existing = cursor.fetchone()

    if existing:
    print(f"[OK] Test signature already exists (ID: {existing[0]})")
    conn.close()
    return existing[0]

    # Create test signature record
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO signature_assets
    (file_path, file_name, uploaded_by, status, validity_period, purpose,
    style_vector, lark_image_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
    TEST_SIGNATURE_PATH,
    "test_signature.png",
    1, # Admin user ID
    "Pending", # Initial status
    "1 Week",
    "DL Generation",
    None, # No style vector yet
    None, # Will be populated when uploaded to Lark
    now,
    now
    ))

    conn.commit()
    signature_id = cursor.lastrowid

    print(f"[OK] Test signature created successfully!")
    print(f" Signature ID: {signature_id}")
    print(f" File Path: {TEST_SIGNATURE_PATH}")
    print(f" Status: Pending")

    # Create the actual test signature file
    uploads_dir = Path(__file__).parent / "uploads" / "signatures"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    test_file = uploads_dir / "test_signature.png"
    if not test_file.exists():
    # Create a simple 1x1 transparent PNG
    import base64
    # Minimal valid PNG (1x1 transparent pixel)
    png_data = base64.b64decode(
    b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )
    with open(test_file, 'wb') as f:
    f.write(png_data)
    print(f"[OK] Test signature file created: {test_file}")

    conn.close()
    return signature_id

    except sqlite3.Error as e:
    print(f"[ERROR] Failed to create test signature: {e}")
    raise
    except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
    raise

if __name__ == "__main__":
    signature_id = create_test_signature()
    print(f"\n[SUCCESS] Test signature ready! You can now test approval requests.")
    print(f" Use Signature ID: {signature_id}")
