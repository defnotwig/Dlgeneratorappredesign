import sqlite3

conn = sqlite3.connect('database/dl_generator.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = cursor.fetchall()
print("\n Tables in database:")
for table in tables:
    print(f" - {table[0]}")

# Check lark config tables
for table in tables:
    if 'lark' in table[0].lower():
    print(f"\n Schema for {table[0]}:")
    cursor.execute(f'PRAGMA table_info({table[0]})')
    cols = cursor.fetchall()
    for col in cols:
    print(f" {col[1]} - {col[2]}")

    # Get count
    cursor.execute(f'SELECT COUNT(*) FROM {table[0]}')
    count = cursor.fetchone()[0]
    print(f" Total rows: {count}")

conn.close()
