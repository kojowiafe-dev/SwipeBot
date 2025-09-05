from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str | None = None
    ELEVENLABS_API_KEY: str
    ELEVENLABS_MODEL: str = "eleven_monolingual_v1" # tweak if needed
    ELEVENLABS_VOICE_ID: str | None = None # optional: pick a specific voice
    ALLOWED_ORIGIN: str = "http://localhost:5173" # Vite default


class Config:
    env_file = ".env"


settings = Settings()