import { useState } from "react";
import axios from "axios";
import { startConvAI } from "../lib/convai";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function SwipeBot() {
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [session, setSession] = useState(null);
  const [partial, setPartial] = useState("");

  const pushLog = (msg) => setLogs((l) => [msg, ...l].slice(0, 50));

  const getOfferSDP = async ({ sdp, model, voiceId }) => {
    // Your server should take the browser SDP offer, call ElevenLabs ConvAI with auth,
    // and return the SDP answer. This keeps the API key private.
    const { data } = await axios.post(`${API_BASE}/webrtc/offer`, {
      sdp,
      model,
      voice_id: voiceId,
    });
    return data;
  };

  const handleStart = async () => {
    try {
      setStatus("connecting");
      pushLog("Starting SwipeBot session…");
      const handle = await startConvAI({
        onAudioStream: () => pushLog("Remote audio connected"),
        onTranscript: (t) => setPartial(JSON.stringify(t)),
        getOfferSDP,
      });
      setSession(handle);
      setStatus("live");
      pushLog("SwipeBot is live. Start talking!");
    } catch (e) {
      console.error(e);
      pushLog("Failed to start session");
      setStatus("idle");
    }
  };

  const handleStop = () => {
    session?.stop?.();
    setSession(null);
    setStatus("idle");
    pushLog("Session ended");
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold">
            Session status: <span className="uppercase">{status}</span>
          </div>
          <div className="text-sm opacity-70">
            Push-to-talk free; voice-activity handled by ElevenLabs
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
          <div className="opacity-60 mb-2">Live transcript/events</div>
          <pre className="whitespace-pre-wrap break-words">{partial}</pre>
        </div>
        <div className="bg-black/20 rounded-xl p-4 h-40 overflow-auto text-sm">
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
    </div>
  );
}
