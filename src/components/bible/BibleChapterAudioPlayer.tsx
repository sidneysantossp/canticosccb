import { Pause, Play, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props { videoId: string; title: string; onClose: () => void; }

const BibleChapterAudioPlayer = ({ videoId, title, onClose }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(true);

  const command = (func: 'playVideo' | 'pauseVideo') => iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), 'https://www.youtube-nocookie.com');
  useEffect(() => { const timer = window.setTimeout(() => command('playVideo'), 450); return () => window.clearTimeout(timer); }, []);
  const toggle = () => { command(playing ? 'pauseVideo' : 'playVideo'); setPlaying((value) => !value); };
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
  return <div className="fixed inset-x-3 bottom-3 z-[9998] mx-auto max-w-xl rounded-2xl border border-primary-500/30 bg-[#171a18]/95 p-3 shadow-2xl backdrop-blur-xl" role="region" aria-label="Bíblia em áudio">
    <iframe ref={iframeRef} title="Reprodução de áudio" src={src} className="pointer-events-none absolute h-px w-px opacity-0" allow="autoplay; encrypted-media" />
    <div className="flex items-center gap-3"><button type="button" onClick={toggle} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-black"><>{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</></button><Volume2 className="h-4 w-4 shrink-0 text-primary-300" /><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-300">Bíblia em Áudio</p><p className="truncate text-sm font-semibold text-white">{title}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full w-2/5 rounded-full bg-primary-400 ${playing ? 'animate-pulse' : ''}`} /></div></div><button type="button" onClick={onClose} aria-label="Fechar áudio" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button></div>
  </div>;
};

export default BibleChapterAudioPlayer;
