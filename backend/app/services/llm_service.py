from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import AsyncGenerator
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


async def _build_messages_for_session(db: AsyncSession, session_id: str, new_message: str):
    """Shared helper: load config + history and build the messages list."""
    model = await get_config_value(db, "LLM_MODEL", "openai/gpt-4o-mini")
    system_prompt = await get_config_value(db, "SYSTEM_PROMPT", "You are a helpful Socratic Tutor.")

    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.timestamp.asc())
    )
    history = result.scalars().all()

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": new_message})

    return model, messages


async def stream_tutor_response(
    db: AsyncSession,
    session_id: str,
    new_message: str,
) -> AsyncGenerator[str, None]:
    """
    Streams LLM response tokens as plain text chunks.

    After the stream finishes, the COMPLETE assistant response is saved to the
    database so logging quality is identical to the non-streaming path.
    The caller is responsible for saving the user message BEFORE calling this.
    """
    model, messages = await _build_messages_for_session(db, session_id, new_message)

    collected_chunks: list[str] = []

    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            collected_chunks.append(delta)
            yield delta

    # Persist the complete assistant message after streaming completes
    full_response = "".join(collected_chunks)
    if full_response:
        tutor_msg = Message(
            session_id=session_id,
            role="assistant",
            content=full_response,
        )
        db.add(tutor_msg)
        await db.commit()
