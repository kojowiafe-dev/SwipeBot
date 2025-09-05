import SwipeBot from "./components/SwipeBot";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">SwipeBot</h1>
        <p className="opacity-80 mb-6">
          Voice-first sales agent • ElevenLabs Conversational AI + your server
          brain
        </p>
        <SwipeBot />
      </div>
    </div>
  );
}

export default App;
