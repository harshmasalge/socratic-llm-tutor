from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.domain import AppConfig, Message
from app.core.config import settings

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

async def get_config_value(db: AsyncSession, key: str, default: str) -> str:
    result = await db.execute(select(AppConfig).where(AppConfig.config_key == key))
    config = result.scalars().first()
    return config.config_value if config else default

async def generate_tutor_response(db: AsyncSession, session_id: str, new_message: str) -> str:
    # Get config
    model = await get_config_value(db, "LLM_MODEL", "openai/gpt-4o-mini")
    system_prompt = await get_config_value(db, "SYSTEM_PROMPT", "You are a helpful Socratic Tutor.")
    
    # Get session history
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
    )
    history = result.scalars().all()
    
    # Build messages array
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
        
    messages.append({"role": "user", "content": new_message})
    
    # Call OpenRouter
    response = await client.chat.completions.create(
        model=model,
        messages=messages
    )
    
    return response.choices[0].message.content
