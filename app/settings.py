from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent  # backend/app
ENV_FILE = BASE_DIR.parent / ".env"         # backend/.env

print("Looking for .env at:", ENV_FILE)

class Settings(BaseSettings):
    OPENAI_API_KEY: str | None = None
    ELEVENLABS_API_KEY: str
    ELEVENLABS_MODEL: str = "eleven_monolingual_v1" # tweak if needed
    ELEVENLABS_VOICE_ID: str | None = None # optional: pick a specific voice
    ALLOWED_ORIGIN: str = "http://localhost:5173" # Vite default

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"

settings = Settings()
# print("ENV ELEVENLABS_API_KEY:", settings.ELEVENLABS_API_KEY)

print("Loaded ElevenLabs Key (first 8 chars):", settings.ELEVENLABS_API_KEY[:8], "...")