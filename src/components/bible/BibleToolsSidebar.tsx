import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark, BookOpen, ChevronRight, Minus, Moon, PanelLeftClose,
  PanelLeftOpen, Play, Plus, Printer, ScrollText, Search, Share2, StickyNote, Sun, Type,
  Video,
} from 'lucide-react';
import BibleSearchBox from './BibleSearchBox';

interface BibleToolsSidebarProps {
  autoScroll: boolean;
  bookmarked: boolean;
  fontSize: number;
  theme: 'dark' | 'sepia';
  onAutoScroll: () => void;
  onBookmark: () => void;
  onFontSize: (size: number) => void;
  onShare: () => void;
  onTheme: () => void;
  hasAudio?: boolean;
  onAudio?: () => void;
}

const BibleToolsSidebar: React.FC<BibleToolsSidebarProps> = ({
  autoScroll, bookmarked, fontSize, theme, onAutoScroll, onBookmark, onFontSize, onShare, onTheme, hasAudio = false, onAudio,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const printPage = () => window.print();

  if (collapsed) {
    return (
      <aside className="sticky top-6 hidden w-[60px] shrink-0 print:hidden lg:block" aria-label="Ferramentas da leitura">
        <div className="space-y-1.5 rounded-2xl border border-gray-700/80 bg-gray-800/75 p-2 shadow-xl shadow-black/30">
          {[
            { label: 'Expandir barra lateral', icon: PanelLeftOpen, action: () => setCollapsed(false) },
            { label: 'Buscar', icon: Search, action: () => setCollapsed(false) },
            { label: 'Rolagem', icon: ScrollText, action: onAutoScroll, active: autoScroll },
            { label: hasAudio ? 'Ouvir capítulo' : 'Áudio indisponível', icon: Video, action: () => onAudio?.() },
            { label: 'Texto', icon: Type, action: () => setCollapsed(false) },
            { label: 'Tema', icon: theme === 'dark' ? Moon : Sun, action: onTheme },
            { label: 'Marcar', icon: Bookmark, action: onBookmark, active: bookmarked },
            { label: 'Compartilhar', icon: Share2, action: onShare },
          ].map(({ label, icon: Icon, action, active }) => (
            <button key={label} type="button" onClick={action} title={label} aria-label={label} className={`flex h-9 w-full items-center justify-center rounded-lg border transition-colors ${active ? 'border-primary-500/60 bg-primary-500/15 text-primary-300' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-primary-500/50 hover:text-white'}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-6 hidden w-[250px] shrink-0 space-y-3 print:hidden lg:block" aria-label="Ferramentas da leitura">
      <button type="button" onClick={() => setCollapsed(true)} title="Encolher barra lateral" aria-label="Encolher barra lateral" className="absolute -top-2 right-3 z-10 flex h-4 w-4 items-center justify-center rounded-md border border-gray-700 bg-[#080909] text-gray-400 transition-colors hover:border-primary-500/50 hover:text-white">
        <PanelLeftClose className="h-2 w-2" />
      </button>

      <div className="flex items-center justify-between gap-2 px-1 pt-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ferramentas</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={printPage} title="Imprimir" aria-label="Imprimir" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"><Printer className="h-4 w-4" /></button>
          <button type="button" onClick={onShare} title="Compartilhar" aria-label="Compartilhar" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>

      <BibleSearchBox compact />

      <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
        <button type="button" onClick={onAutoScroll} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70">
          <ScrollText className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Rolagem</span><span className={`text-xs ${autoScroll ? 'text-primary-300' : 'text-gray-400'}`}>{autoScroll ? 'Ativa' : 'Desligada'}</span><ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
        <button type="button" disabled={!hasAudio} onClick={onAudio} className={`flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm transition-colors ${hasAudio ? 'text-gray-100 hover:bg-gray-700/70' : 'cursor-not-allowed text-gray-400 opacity-70'}`}>
          <Video className="h-4 w-4" /><span className="flex-1 font-medium">Bíblia em Áudio</span><span className="text-xs">{hasAudio ? 'Ouvir' : 'Em breve'}</span><Play className={`h-4 w-4 ${hasAudio ? 'text-primary-300' : 'text-gray-600'}`} />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3 px-3 py-3 text-sm text-gray-100">
          <Type className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Texto</span>
          <button type="button" onClick={() => onFontSize(Math.max(16, fontSize - 1))} aria-label="Diminuir texto" className="text-gray-300 hover:text-white"><Minus className="h-4 w-4" /></button>
          <span className="min-w-9 text-center text-xs text-gray-400">{fontSize}px</span>
          <button type="button" onClick={() => onFontSize(Math.min(28, fontSize + 1))} aria-label="Aumentar texto" className="text-gray-300 hover:text-white"><Plus className="h-4 w-4" /></button>
        </div>
        <button type="button" onClick={onTheme} className="flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70">
          {theme === 'dark' ? <Moon className="h-4 w-4 text-gray-300" /> : <Sun className="h-4 w-4 text-amber-300" />}<span className="flex-1 font-medium">Tema</span><span className="text-xs text-gray-400">{theme === 'dark' ? 'Escuro' : 'Sépia'}</span><ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
        <button type="button" onClick={onBookmark} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70">
          <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-primary-400 text-primary-400' : 'text-gray-300'}`} /><span className="flex-1 font-medium">Marcar capítulo</span><span className={`text-xs ${bookmarked ? 'text-primary-300' : 'text-gray-400'}`}>{bookmarked ? 'Salvo' : 'Salvar'}</span><ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
        <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-400 opacity-70"><StickyNote className="h-4 w-4" /><span className="flex-1 font-medium">Minhas notas</span><span className="text-xs">Em breve</span></button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
        <Link to="/biblia-ccb" className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><BookOpen className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Todos os livros</span><ChevronRight className="h-4 w-4 text-gray-500" /></Link>
      </div>
    </aside>
  );
};

export default BibleToolsSidebar;
