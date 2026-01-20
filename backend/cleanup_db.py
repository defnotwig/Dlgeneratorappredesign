"""
Clean up spam approval requests caused by retry loop
"""
import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "database" / "dl_generator.db"

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count pending requests
    cursor.execute('SELECT COUNT(*) FROM signature_approval_requests WHERE status="Pending"')
    pending_count = cursor.fetchone()[0]
    print(f"\n Found {pending_count} pending approval requests")

    if pending_count > 10:
    print(f"[WARN] Too many pending requests detected! This is caused by retry spam.")
    print(f"[CLEAN] Marking old failed requests as 'Failed' to clean up...")

    # Mark all but the most recent as Failed
    cursor.execute('''
    UPDATE signature_approval_requests
    SET status = 'Failed',
    response_reason = 'Template visibility error (11310) - cleaned up spam'
    WHERE status = 'Pending'
    AND id NOT IN (
    SELECT id FROM signature_approval_requests
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 1
    )
    ''')

    updated = cursor.rowcount
    conn.commit()
    print(f"[OK] Marked {updated} old requests as 'Failed'")
    print(f"[OK] Kept 1 most recent pending request for retry")
    else:
    print(f" Pending request count is reasonable (< 10)")

    # Show current state
    cursor.execute('SELECT status, COUNT(*) FROM signature_approval_requests GROUP BY status')
    stats = cursor.fetchall()
    print(f"\n Approval Request Status Summary:")
    for status, count in stats:
    print(f" {status}: {count}")

    conn.close()
    print(f"\n[OK] Database cleanup complete!")

except Exception as e:
    print(f"[ERROR] Error: {e}")
