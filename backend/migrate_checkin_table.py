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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS CheckIn (
            CheckInId INT AUTO_INCREMENT PRIMARY KEY,
            DangKyId INT NOT NULL,
            NhanVienId INT NOT NULL,
            ThoiGianCheckIn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PhuongThucCheckIn VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
            TrangThai VARCHAR(50) NOT NULL DEFAULT 'THANH_CONG',
            CONSTRAINT FK_CheckIn_DangKy
                FOREIGN KEY (DangKyId)
                REFERENCES DangKy(DangKyId)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT FK_CheckIn_NhanVien
                FOREIGN KEY (NhanVienId)
                REFERENCES NguoiDung(NguoiDungId)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,
            CONSTRAINT UQ_CheckIn_DangKy
                UNIQUE (DangKyId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)
    conn.commit()
    print("Table CheckIn created successfully.")

conn.close()
