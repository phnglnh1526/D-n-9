import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# Thư mục gốc của project: event-management-ai
BASE_DIR = Path(__file__).resolve().parents[2]

# Đọc file .env ở thư mục gốc
load_dotenv(BASE_DIR / ".env")


MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")


DEFAULT_SQLITE_PATH = BASE_DIR / "backend" / "event_management.db"
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    has_mysql_config = all(
        (
            MYSQL_DATABASE,
            MYSQL_USER,
            MYSQL_PASSWORD,
        )
    )

    if has_mysql_config:
        DATABASE_URL = (
            f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
            f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
            f"?charset=utf8mb4"
        )
    else:
        DATABASE_URL = (
            f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
        )


CONNECT_ARGS = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=CONNECT_ARGS
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()