import React, { useState } from 'react';

interface VoicePlayerProps {
  accommodationName: string;
  ssi: number;
  topIssues: string[];
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ accommodationName, ssi, topIssues }) => {
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/voice/ssi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accommodationName, ssi, topIssues }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.play().catch(() => {});
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading audio...
        </>
      ) : (
        <>🔊 Hear Safety Score</>
      )}
    </button>
  );
};

export default VoicePlayer;
