import pymysql
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "event_management")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")

conn = pymysql.connect(
    host=MYSQL_HOST,
    port=MYSQL_PORT,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)

with conn.cursor() as cursor:
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'DangKy' AND COLUMN_NAME = 'NguoiDungId'",
        (MYSQL_DATABASE,)
    )
    col_count = cursor.fetchone()[0]
    if col_count == 0:
        print("Adding NguoiDungId column to DangKy table...")
        cursor.execute("ALTER TABLE DangKy ADD COLUMN NguoiDungId INT NULL AFTER SuKienId")
        cursor.execute("ALTER TABLE DangKy ADD CONSTRAINT FK_DangKy_NguoiDung FOREIGN KEY (NguoiDungId) REFERENCES NguoiDung(NguoiDungId) ON DELETE SET NULL")
        conn.commit()
        print("Column NguoiDungId and FK added successfully.")
    else:
        print("Column NguoiDungId already exists in DangKy.")

conn.close()
