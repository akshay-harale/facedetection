import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/facedb")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Dropping public schema...")
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    print("Recreating public schema...")
    conn.execute(text("CREATE SCHEMA public;"))
    conn.commit()
    print("Database cleared successfully.")
