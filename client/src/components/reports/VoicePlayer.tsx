import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
interface Props { audioUrl?: string; }
export function VoicePlayer({ audioUrl }: Props) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toggle = () => { if (!audioRef.current) return; playing ? audioRef.current.pause() : audioRef.current.play(); setPlaying(!playing); };
  return (
    <div className="flex items-center gap-3">
      <button onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
      <audio ref={audioRef} src={audioUrl} onTimeUpdate={() => audioRef.current && setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)} onEnded={() => { setPlaying(false); setProgress(0); }} />
    </div>
  );
}
