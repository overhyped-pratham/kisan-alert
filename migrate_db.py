# -*- coding: utf-8 -*-
"""
ArogyaKrishi -- Safe DB Migration Script (PostgreSQL-compatible)
=================================================================
Run once before deployment to add any new columns.
Fully idempotent -- safe to re-run.

Usage:
    python migrate_db.py
"""

import os, sys
sys.stdout.reconfigure(encoding='utf-8')   # fix Windows cp1252 console
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("KERAS_BACKEND", "jax")

from app import create_app
from extensions import db

app = create_app()

# PostgreSQL: "user" is a reserved word -- must be double-quoted
MIGRATIONS = [
    # (table,          column,               definition)
    ('"user"',         'district',           "VARCHAR(100) DEFAULT 'Pune'"),
    ('"user"',         'village',            "VARCHAR(100) DEFAULT 'Haveli'"),
    ('"user"',         'farm_size',          "VARCHAR(50)  DEFAULT '5 Acres'"),
    ('"user"',         'crop_type',          "VARCHAR(100) DEFAULT 'Wheat'"),
    ('"user"',         'preferred_language', "VARCHAR(10)  DEFAULT 'en'"),

    ('sms_log',        'location',           'VARCHAR(100)'),
    ('sms_log',        'created_at',         'TIMESTAMP DEFAULT NOW()'),
]

def run():
    with app.app_context():
        # 1. Create any entirely new tables
        print("[migrate] Creating missing tables via db.create_all()...")
        db.create_all()
        print("[migrate] db.create_all() done.")

        conn = db.engine.connect()

        # 2. Apply column migrations
        for table, column, col_def in MIGRATIONS:
            sql = f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"
            try:
                conn.execute(db.text(sql))
                conn.commit()
                print(f"[migrate] OK   Added   {table}.{column}")
            except Exception as e:
                conn.rollback()
                msg = str(e).lower()
                if "duplicate column" in msg or "already exists" in msg:
                    print(f"[migrate] SKIP Exists  {table}.{column}")
                else:
                    print(f"[migrate] ERR  Failed  {table}.{column}: {str(e)[:120]}")

        conn.close()

        # 3. Row counts
        print("\n[migrate] Table row counts:")
        for t in ('"user"', 'sms_log', 'crop_recommendation', 'disease_log'):
            try:
                count = db.session.execute(db.text(f"SELECT COUNT(*) FROM {t}")).scalar()
                print(f"          {t:<28} -> {count} rows")
            except Exception as ex:
                print(f"          {t:<28} -> ERROR: {str(ex)[:60]}")

        print("\n[migrate] Migration complete. Ready for deployment.")

if __name__ == "__main__":
    run()
