from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.database import get_db
from app.models.domain import Student
from app.schemas.domain import StudentCreate, StudentResponse

router = APIRouter()

@router.post("/", response_model=StudentResponse)
async def create_or_get_student(student: StudentCreate, db: AsyncSession = Depends(get_db)):
    # Check if student exists by roll_no
    result = await db.execute(select(Student).where(Student.roll_no == student.roll_no))
    existing_student = result.scalars().first()
    
    if existing_student:
        if existing_student.name != student.name:
            raise HTTPException(status_code=400, detail="Roll number exists with a different name.")
        return existing_student
        
    # Create new student
    new_student = Student(name=student.name, roll_no=student.roll_no)
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    return new_student
