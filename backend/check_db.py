import sqlite3
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent / "database" / "dl_generator.db"

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check signatures
    cursor.execute('SELECT id, file_name, status, lark_image_key FROM signature_assets ORDER BY id DESC LIMIT 3')
    signatures = cursor.fetchall()
    print("\n Latest Signatures:")
    for row in signatures:
    img_key = row[3][:30] + "..." if row[3] else "None"
    print(f" ID={row[0]}, File={row[1]}, Status={row[2]}, ImageKey={img_key}")

    # Check pending approval requests
    cursor.execute('SELECT id, signature_id, status, created_at FROM signature_approval_requests WHERE status="Pending" ORDER BY created_at DESC LIMIT 5')
    pending = cursor.fetchall()
    print(f"\n[PENDING] Pending Approval Requests: {len(pending)}")
    for row in pending:
    print(f" ReqID={row[0]}, SigID={row[1]}, Status={row[2]}, Created={row[3][:19]}")

    # Check total requests
    cursor.execute('SELECT COUNT(*) FROM signature_approval_requests')
    total = cursor.fetchone()[0]
    print(f"\n Total approval requests in database: {total}")

    conn.close()
    print("\n[OK] Database check complete")

except Exception as e:
    print(f"[ERROR] Database error: {e}")
