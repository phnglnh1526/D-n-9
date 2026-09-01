from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine
from .routers import (
    ai,
    auth,
    events,
    feedback,
    registrations,
    schedules,
    speakers,
    users,
)

app = FastAPI(
    title="Event Management AI API",
    description="Backend API cho hệ thống quản lý sự kiện tích hợp AI",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router)
app.include_router(schedules.router)
app.include_router(speakers.router)
app.include_router(registrations.router)
app.include_router(feedback.router)
app.include_router(ai.router)
app.include_router(ai.general_router)


@app.get("/")
def root():
    return {
        "message": "Event Management AI API is running",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.get("/health/db")
def health_database():
    try:
        with engine.connect() as connection:
            database_name = connection.execute(
                text("SELECT DATABASE()")
            ).scalar_one()

        return {
            "status": "ok",
            "database": database_name
        }

    except Exception as error:
        print(f"Database healthcheck error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Không thể kết nối tới MySQL"
        )
