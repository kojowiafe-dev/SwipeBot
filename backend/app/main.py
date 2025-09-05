from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .schemas import ChatRequest, ChatResponse
from .settings import settings
from .brain import think


app = FastAPI(title="SwipeBot Server")


app.add_middleware(
CORSMiddleware,
allow_origins=[settings.ALLOWED_ORIGIN],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"]
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/brain", response_model=ChatResponse)
def brain_endpoint(req: ChatRequest):
    return think(req)


@app.get("/api/convai/config")
def convai_config():
    return {
        "model": settings.ELEVENLABS_MODEL,
        "voice_id": settings.ELEVENLABS_VOICE_ID,
    }