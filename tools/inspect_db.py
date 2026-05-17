import sqlite3, os, sys
p = os.path.join('prisma', 'prisma', 'dev.db')
print('PATH:', os.path.abspath(p))
print('EXISTS:', os.path.exists(p))
if not os.path.exists(p):
    sys.exit(1)
conn = sqlite3.connect(p)
cur = conn.cursor()
rows = cur.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table','index')").fetchall()
print('OBJECTS:')
for r in rows:
    print('  ', r)
print('INTEGRITY:', conn.execute('PRAGMA integrity_check').fetchone())
# print first 10 rows of Employee if table exists
tables = [r[0] for r in rows]
if 'Employee' in tables:
    print('\nEmployee sample rows:')
    cols = cur.execute("PRAGMA table_info('Employee')").fetchall()
    print('COLUMNS:', [c[1] for c in cols])
    sample = cur.execute('SELECT id_emp, name, email, role FROM Employee ORDER BY id_emp LIMIT 10').fetchall()
    for s in sample:
        print('  ', s)
conn.close()