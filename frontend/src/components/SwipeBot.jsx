import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function SwipeBot() {
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const wsRef = useRef(null);

  const pushLog = (msg) => setLogs((l) => [msg, ...l].slice(0, 50));

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        pushLog("Speech recognition started");
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);

        // Process final transcript
        if (finalTranscript) {
          processTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        pushLog(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (status === "live") {
          // Restart recognition if still in live mode
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        }
      };
    } else {
      pushLog("Speech recognition not supported in this browser");
    }
  }, [status]);

  const processTranscript = async (text) => {
    if (!text.trim()) return;

    pushLog(`Processing: "${text}"`);

    try {
      const response = await axios.post(`${API_BASE}/api/process-speech`, {
        transcript: text,
        voice_id: "21m00Tcm4TlvDq8ikWAM",
      });

      const { text: aiText, audio, format } = response.data;
      setAiResponse(aiText);
      pushLog(`AI Response: "${aiText}"`);

      // Play audio response
      if (audio) {
        playAudioResponse(audio, format);
      }
    } catch (error) {
      console.error("Processing error:", error);
      pushLog("Failed to process speech");
    }
  };

  const playAudioResponse = (audioBase64, format) => {
    try {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
        { type: `audio/${format}` }
      );

      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch((err) => {
          console.error("Audio playback failed:", err);
          pushLog("Audio playback failed");
        });
      }
    } catch (error) {
      console.error("Audio processing error:", error);
      pushLog("Failed to process audio response");
    }
  };

  // WebSocket version (alternative approach)
  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:8000/ws/conversation`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      pushLog("WebSocket connected");
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "response") {
        setAiResponse(data.text);
        pushLog(`AI Response: "${data.text}"`);

        if (data.audio) {
          playAudioResponse(data.audio, data.format);
        }
      } else if (data.type === "error") {
        pushLog(`Error: ${data.message}`);
      }
    };

    wsRef.current.onerror = (error) => {
      pushLog("WebSocket error");
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      pushLog("WebSocket disconnected");
    };
  };

  const sendTranscriptViaWebSocket = (text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "transcript",
          text: text,
        })
      );
    }
  };

  const handleStart = async () => {
    try {
      setStatus("connecting");
      pushLog("Starting SwipeBot session…");

      // Connect WebSocket (optional)
      // connectWebSocket();

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setStatus("live");
        pushLog("SwipeBot is live. Start talking!");
      } else {
        throw new Error("Speech recognition not available");
      }
    } catch (error) {
      console.error("Start error:", error);
      pushLog("Failed to start session");
      setStatus("idle");
    }
  };

  const handleStop = () => {
    setStatus("idle");
    setIsListening(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    pushLog("Session ended");
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
      <audio ref={audioRef} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold">
            Session status: <span className="uppercase">{status}</span>
          </div>
          <div className="text-sm opacity-70">
            {isListening && (
              <span className="text-green-400">🎤 Listening...</span>
            )}
            Voice-activated conversational AI
          </div>
        </div>
        <div className="flex gap-2">
          {status !== "live" ? (
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-xl p-4 h-40 overflow-auto text-sm">
          <div className="opacity-60 mb-2">Your Speech</div>
          <pre className="whitespace-pre-wrap break-words text-blue-300">
            {transcript || "Waiting for speech..."}
          </pre>
        </div>

        <div className="bg-black/20 rounded-xl p-4 h-40 overflow-auto text-sm">
          <div className="opacity-60 mb-2">AI Response</div>
          <pre className="whitespace-pre-wrap break-words text-green-300">
            {aiResponse || "No response yet..."}
          </pre>
        </div>
      </div>

      <div className="bg-black/20 rounded-xl p-4 mt-4 h-32 overflow-auto text-sm">
        <div className="opacity-60 mb-2">Logs</div>
        <ul className="space-y-1">
          {logs.map((l, i) => (
            <li key={i} className="opacity-90">
              • {l}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
