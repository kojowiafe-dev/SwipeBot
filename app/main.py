from fastapi import FastAPI, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from schemas import ChatRequest, ChatResponse
from settings import settings
from brain import think
import httpx
from elevenlabs.client import ElevenLabs
from elevenlabs import stream
import os
from dotenv import load_dotenv
import asyncio
import json
import base64
import io
import websockets

load_dotenv()
elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

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

@app.post("/api/text-to-speech")
async def text_to_speech(request: Request):
    """Convert text to speech using ElevenLabs"""
    body = await request.json()
    text = body["text"]
    voice_id = body.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
    model = body.get("model", "eleven_monolingual_v1")
    
    try:
        # Generate speech
        audio = elevenlabs.generate(
            text=text,
            voice=voice_id,
            model=model
        )
        
        # Convert to base64 for transmission
        audio_bytes = b''.join(audio)
        audio_b64 = base64.b64encode(audio_bytes).decode()
        
        return {
            "audio": audio_b64,
            "format": "mp3"
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"TTS failed: {str(e)}"}
        )

@app.websocket("/ws/conversation")
async def websocket_conversation(websocket: WebSocket):
    """WebSocket endpoint for real-time conversation"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "transcript":
                # Process the speech transcript
                transcript = message_data["text"]
                
                # Send to brain for processing
                chat_request = ChatRequest(message=transcript)  # Adjust based on your ChatRequest schema
                response = think(chat_request)
                
                # Generate audio response
                try:
                    audio = elevenlabs.generate(
                        text=response.message,  # Adjust based on your ChatResponse schema
                        voice="21m00Tcm4TlvDq8ikWAM",
                        model="eleven_monolingual_v1"
                    )
                    
                    audio_bytes = b''.join(audio)
                    audio_b64 = base64.b64encode(audio_bytes).decode()
                    
                    # Send response back to client
                    await websocket.send_text(json.dumps({
                        "type": "response",
                        "text": response.message,
                        "audio": audio_b64,
                        "format": "mp3"
                    }))
                    
                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"TTS generation failed: {str(e)}"
                    }))
                    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()

# Alternative: Simple HTTP endpoint for speech processing
@app.post("/api/process-speech")
async def process_speech(request: Request):
    """Process speech transcript and return AI response with audio"""
    body = await request.json()
    transcript = body["transcript"]
    voice_id = body.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
    
    # Process with brain
    chat_request = ChatRequest(text=transcript)  # Changed from 'message' to 'text'
    response = think(chat_request)
    
    # Generate audio
    try:
        audio = elevenlabs.generate(
            text=response.message,
            voice=voice_id,
            model="eleven_monolingual_v1"
        )
        
        audio_bytes = b''.join(audio)
        audio_b64 = base64.b64encode(audio_bytes).decode()
        
        return {
            "text": response.message,
            "audio": audio_b64,
            "format": "mp3"
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Processing failed: {str(e)}"}
        )