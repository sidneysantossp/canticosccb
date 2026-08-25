import React from 'react';
import { Minus, Plus, ScrollText, Search, Type, Video } from 'lucide-react';

interface BibleMobileToolsProps {
  autoScroll: boolean;
  scrollSpeed: number;
  onAutoScroll: () => void;
  onDecreaseScrollSpeed: () => void;
  onIncreaseScrollSpeed: () => void;
  onOpenSearch: () => void;
  onText: () => void;
}

const BibleMobileTools: React.FC<BibleMobileToolsProps> = ({ autoScroll, scrollSpeed, onAutoScroll, onDecreaseScrollSpeed, onIncreaseScrollSpeed, onOpenSearch, onText }) => (
  <div className="fixed bottom-2 left-2 right-2 z-[9998] rounded-xl border border-white/10 bg-[#101211]/80 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl print:hidden lg:hidden">
    <div className="flex items-center justify-between gap-2">
      <button type="button" onClick={onOpenSearch} aria-label="Buscar" title="Buscar" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 active:bg-white/10"><Search className="h-4 w-4" /></button>
      <div className={`ml-auto flex h-10 items-center overflow-hidden rounded-xl border transition-colors ${autoScroll ? 'border-primary-500/50 bg-primary-500/15 text-primary-300' : 'border-white/10 bg-white/[0.04] text-gray-300'}`}>
        <button type="button" onClick={onAutoScroll} aria-label={autoScroll ? 'Pausar rolagem' : 'Iniciar rolagem'} title={autoScroll ? 'Pausar rolagem' : 'Iniciar rolagem'} className="flex h-full w-10 items-center justify-center active:bg-white/10"><ScrollText className="h-4 w-4" /></button>
        <span className="h-5 w-px bg-white/10" />
        <button type="button" onClick={onDecreaseScrollSpeed} disabled={scrollSpeed <= 1} aria-label="Diminuir velocidade de rolagem" title="Diminuir velocidade" className="flex h-full w-7 items-center justify-center active:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={onIncreaseScrollSpeed} disabled={scrollSpeed >= 3} aria-label="Aumentar velocidade de rolagem" title="Aumentar velocidade" className="flex h-full w-7 items-center justify-center active:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
      </div>
      {[{ label: 'Ouvir', icon: Video, action: () => undefined, disabled: true }, { label: 'Texto', icon: Type, action: onText }].map(({ label, icon: Icon, action, disabled }) => (
        <button key={label} type="button" onClick={action} disabled={disabled} aria-label={label} title={label} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${disabled ? 'cursor-not-allowed border-white/5 text-gray-700' : 'border-white/10 bg-white/[0.04] text-gray-300 active:bg-white/10'}`}>
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  </div>
);

export default BibleMobileTools;
