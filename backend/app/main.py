from .routers import auth, events
from fastapi.middleware.cors import CORSMiddleware
from .routers import (
    ai,
    auth,
    events,
    feedback,
    registrations,
)
from .ai_service import (
    answer_event_question,
    generate_event_notification,
    summarize_feedback,
)
from contextlib import asynccontextmanager
from uuid import uuid4

from sqlalchemy.exc import IntegrityError
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .database import (
    DATABASE_URL,
    Base,
    engine,
    get_db,
)
from .models import (
    CauHoiThuongGap,
    DangKy,
    NguoiDung,
    PhanHoi,
    SuKien,
    ThongBao,
)
from .schemas import (
    AIPhanHoiSummaryResponse,
    CauHoiThuongGapCreate,
    CauHoiThuongGapResponse,
    ChatRequest,
    ChatResponse,
    CheckInRequest,
    DangKyCreate,
    DangKyResponse,
    PhanHoiCreate,
    PhanHoiResponse,
    SuKienCreate,
    SuKienResponse,
    SuKienUpdate,
    ThongBaoAIRequest,
    ThongBaoResponse,
    ThongKeSuKienResponse,
    
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Event Management AI API",
    description="Backend API cho hệ thống quản lý sự kiện tích hợp AI",
    version="1.0.0",
    lifespan=lifespan,
)

# Vite may move to 5174 when another dev server already uses 5173.
# Keep both local development origins allowed so the browser can call the API.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5177",
    "http://127.0.0.1:5177",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(registrations.router)
app.include_router(feedback.router)
app.include_router(ai.router)
@app.get("/")
def root():
    return {
        "message": "Event Management AI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.get("/health/db")
def health_database():
    try:
        if DATABASE_URL.startswith("sqlite"):
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))

            database_name = "sqlite"
        else:
            with engine.connect() as connection:
                database_name = connection.execute(
                    text("SELECT DATABASE()")
                ).scalar_one()

        return {
            "status": "ok",
            "database": database_name
        }

    except Exception as error:
        print(error)

        raise HTTPException(
            status_code=500,
            detail="Không thể kết nối tới cơ sở dữ liệu"
        )

