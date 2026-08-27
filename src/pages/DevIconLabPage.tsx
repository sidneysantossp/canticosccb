import { useState } from 'react';
import {
  AvulsosIcon, BibleIcon, CategoriesIcon, ChordsIcon, HomeIcon,
  HymnalIcon, InstrumentalIcon, LibraryIcon, SearchIcon, VocalsIcon,
} from '@/components/icons';

const icons = [
  ['Início', HomeIcon], ['Buscar', SearchIcon], ['Biblioteca', LibraryIcon],
  ['Categorias', CategoriesIcon], ['Avulsos', AvulsosIcon], ['Cantados', VocalsIcon],
  ['Instrumentais', InstrumentalIcon], ['Cifras', ChordsIcon], ['Hinário', HymnalIcon],
  ['Bíblia Digital', BibleIcon],
] as const;
const sizes = [16, 20, 22, 24, 28, 32];

export default function DevIconLabPage() {
  const [active, setActive] = useState('');
  return <main style={{ minHeight: '100vh', background: '#0b0b0b', color: '#f5f5f5', padding: '48px', fontFamily: 'system-ui' }}>
    <h1 style={{ margin: 0, fontSize: 28 }}>Cânticos CCB · Icon Lab</h1>
    <p style={{ color: '#9ca3af', marginTop: 8 }}>Sistema proprietário V1 · estados default, hover e ativo</p>
    <section style={{ marginTop: 28, border: '1px solid #262626', borderRadius: 16, padding: 24, overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(6, minmax(70px, 1fr))', gap: 18, alignItems: 'center', minWidth: 700 }}>
        <strong>Ícone</strong>{sizes.map(size => <strong key={size} style={{ color: '#9ca3af', textAlign: 'center' }}>{size}px</strong>)}
        {icons.map(([label, Icon]) => <div key={label} style={{ display: 'contents' }}>
          <button onClick={() => setActive(label)} style={{ background: 'transparent', border: 0, color: active === label ? '#22c55e' : '#e5e7eb', textAlign: 'left', fontSize: 14, cursor: 'pointer' }}>{label}</button>
          {sizes.map(size => <div key={size} style={{ display: 'flex', justifyContent: 'center', padding: 10, borderRadius: 10, background: active === label ? '#12321f' : '#151515' }}><Icon size={size} active={active === label} /></div>)}
        </div>)}
      </div>
    </section>
  </main>;
}
