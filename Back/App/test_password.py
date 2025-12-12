import bcrypt
from database.connection import get_db
from sqlalchemy import text

db = next(get_db())
r = db.execute(text('SELECT password_hash FROM users WHERE id = 1')).fetchone()
hash = r[0]

# Test passwords
passwords = ['admin123', 'admin', 'Admin123', 'password', 'lpub@12345']
for pwd in passwords:
    try:
        result = bcrypt.checkpw(pwd.encode(), hash.encode())
        status = "MATCH" if result else "no match"
        print(f'{pwd}: {status}')
    except Exception as e:
        print(f'{pwd}: error - {e}')
