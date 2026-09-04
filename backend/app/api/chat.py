from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
import logging

from app.db.database import get_db
from app.models.domain import Session, Message
from app.schemas.domain import MessageResponse
from app.services.llm_service import generate_tutor_response

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    response: str

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    result = await db.execute(select(Session).where(Session.id == request.session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save user message
    user_msg = Message(session_id=request.session_id, role="user", content=request.message)
    db.add(user_msg)
    await db.commit()
    
    try:
        # Generate tutor response
        tutor_response_text = await generate_tutor_response(db, request.session_id, request.message)
    except Exception as e:
        logger.error(f"Error calling LLM: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to communicate with LLM")
        
    # Save tutor response
    tutor_msg = Message(session_id=request.session_id, role="assistant", content=tutor_response_text)
    db.add(tutor_msg)
    await db.commit()
    
    return ChatResponse(session_id=request.session_id, response=tutor_response_text)

@router.get("/session/{session_id}", response_model=List[MessageResponse])
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).where(Message.session_id == session_id).order_by(Message.timestamp.asc()))
    return result.scalars().all()
