from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    roll_no: str

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    student_id: str

class SessionResponse(BaseModel):
    id: str
    student_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    role: str
    content: str

class MessageResponse(MessageBase):
    id: str
    session_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class StudentDetailResponse(StudentResponse):
    sessions: List[SessionResponse]

    class Config:
        from_attributes = True
