from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .domain import StudentResponse, SessionResponse, MessageResponse

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class AppConfigUpdate(BaseModel):
    model: str
    system_prompt: str

class ConfigResponse(BaseModel):
    model: str
    system_prompt: str
