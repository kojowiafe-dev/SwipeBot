from pydantic import BaseModel


class ChatRequest(BaseModel):
    user_id: str | None = None
    text: str
    context: dict | None = None


class ChatResponse(BaseModel):
    reply: str
    meta: dict | None = None