from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine

app = FastAPI(title="Socratic Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.models.domain import AppConfig
from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal

@app.on_event("startup")
async def startup():
    async with AsyncSessionLocal() as db:
        # Seed default model if not exists
        result = await db.execute(select(AppConfig).where(AppConfig.config_key == "LLM_MODEL"))
        if not result.scalars().first():
            db.add(AppConfig(config_key="LLM_MODEL", config_value="openai/gpt-4o-mini"))
        
        # Seed default prompt if not exists
        result = await db.execute(select(AppConfig).where(AppConfig.config_key == "SYSTEM_PROMPT"))
        if not result.scalars().first():
            db.add(AppConfig(config_key="SYSTEM_PROMPT", config_value="You are a helpful Socratic Tutor. Ask questions to help the student learn, rather than giving direct answers."))
        
        await db.commit()


from app.api import admin, student, session, chat
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

app.include_router(student.router, prefix="/api/students", tags=["students"])
app.include_router(session.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"status": "ok"}
