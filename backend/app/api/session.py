from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.models.domain import Session, Student
from app.schemas.domain import SessionCreate, SessionResponse

router = APIRouter()

@router.post("/", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, db: AsyncSession = Depends(get_db)):
    # Verify student exists
    result = await db.execute(select(Student).where(Student.id == session_data.student_id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    new_session = Session(student_id=session_data.student_id)
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.get("/student/{student_id}", response_model=List[SessionResponse])
async def get_student_sessions(student_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.student_id == student_id).order_by(Session.started_at.desc()))
    return result.scalars().all()
