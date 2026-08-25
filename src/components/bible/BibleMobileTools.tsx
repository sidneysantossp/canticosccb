import React from 'react';
import { Bookmark, Headphones, Moon, ScrollText, Search, Share2, Type } from 'lucide-react';

interface BibleMobileToolsProps {
  autoScroll: boolean;
  bookmarked: boolean;
  onAutoScroll: () => void;
  onBookmark: () => void;
  onOpenSearch: () => void;
  onShare: () => void;
  onTheme: () => void;
  onText: () => void;
}

const BibleMobileTools: React.FC<BibleMobileToolsProps> = ({ autoScroll, bookmarked, onAutoScroll, onBookmark, onOpenSearch, onShare, onTheme, onText }) => (
  <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-white/10 bg-[#101211]/95 px-4 py-3 backdrop-blur-xl print:hidden lg:hidden">
    <div className="flex items-center justify-between gap-2">
      {[
        { label: 'Buscar', icon: Search, action: onOpenSearch },
        { label: 'Rolagem', icon: ScrollText, action: onAutoScroll, active: autoScroll },
        { label: 'Ouvir', icon: Headphones, action: () => undefined, disabled: true },
        { label: 'Texto', icon: Type, action: onText },
        { label: 'Tema', icon: Moon, action: onTheme },
        { label: 'Marcar', icon: Bookmark, action: onBookmark, active: bookmarked },
        { label: 'Compartilhar', icon: Share2, action: onShare },
      ].map(({ label, icon: Icon, action, active, disabled }) => (
        <button key={label} type="button" onClick={action} disabled={disabled} aria-label={label} title={label} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${disabled ? 'cursor-not-allowed border-white/5 text-gray-700' : active ? 'border-primary-500/50 bg-primary-500/15 text-primary-300' : 'border-white/10 bg-white/[0.04] text-gray-300 active:bg-white/10'}`}>
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  </div>
);

export default BibleMobileTools;
