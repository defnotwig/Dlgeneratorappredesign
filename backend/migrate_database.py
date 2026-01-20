"""
Database Migration Script
Adds lark_image_key column to signature_assets table
"""

import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "database" / "dl_generator.db"

def migrate_database():
    """Add lark_image_key column to signature_assets table"""
    print(" Starting database migration...")

    try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(signature_assets)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'lark_image_key' in columns:
    print("[OK] Column 'lark_image_key' already exists. No migration needed.")
    conn.close()
    return

    # Add the new column
    print(" Adding 'lark_image_key' column to signature_assets table...")
    cursor.execute("""
    ALTER TABLE signature_assets
    ADD COLUMN lark_image_key VARCHAR(255)
    """)

    conn.commit()
    print("[OK] Migration completed successfully!")
    print("[OK] Database schema updated: signature_assets.lark_image_key added")

    # Verify the column was added
    cursor.execute("PRAGMA table_info(signature_assets)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'lark_image_key' in columns:
    print("[OK] Verification passed: Column exists in database")
    else:
    print("[ERROR] Verification failed: Column not found")

    conn.close()

    except sqlite3.Error as e:
    print(f"[ERROR] Migration failed: {e}")
    raise
    except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
    raise

if __name__ == "__main__":
    migrate_database()
    print("\n[SUCCESS] Migration complete! You can now restart the backend.")
