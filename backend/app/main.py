from fastapi import FastAPI, UploadFile
import openai
import requests

app = FastAPI()

openai.api_key = "YOUR_OPENAI_KEY"
ELEVENLABS_API_KEY = "YOUR_ELEVENLABS_KEY"

@app.post("/talk")
async def talk(audio: UploadFile):
    # 1. Speech-to-Text
    transcription = openai.Audio.transcriptions.create(
        model="whisper-1",
        file=audio.file
    )
    user_text = transcription.text

    # 2. GPT Response
    response = openai.Chat.completions.create(
        model="gpt-5",
        messages=[{"role": "user", "content": user_text}]
    )
    reply = response.choices[0].message.content

    # 3. Text-to-Speech (ElevenLabs)
    tts_response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
        headers={"xi-api-key": ELEVENLABS_API_KEY},
        json={"text": reply}
    )
    
    return {"text": reply, "audio": tts_response.content}


# from elevenlabs.client import ElevenLabs
# from elevenlabs import play

# client = ElevenLabs(
#     api_key="YOUR_API_KEY"
# )

# audio = client.text_to_speech.convert(
#     text="The first move is what sets everything in motion.",
#     voice_id="JBFqnCBsd6RMkjVDRZzb",
#     model_id="eleven_multilingual_v2",
#     output_format="mp3_44100_128",
# )

# play(audio)