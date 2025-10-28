import React from 'react';
import { Link } from 'react-router-dom';
import { mockHinos, mockAlbums, mockPlaylists, mockArtists, mockCategories } from '@/data/mockData';

const LandingPage: React.FC = () => {
  const topHymns = mockHinos.slice(0, 6);
  const topAlbums = mockAlbums;
  const topArtists = mockArtists;
  const topPlaylists = mockPlaylists;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="/logo-canticos-ccb.png"
            alt="Cânticos CCB"
            className="w-32 h-auto mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold">Cânticos CCB</h1>
          <p className="text-text-muted mt-2">Plataforma em reconstrução. Dados mock exibidos para navegação.</p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Link to="/login" className="bg-background-secondary border border-gray-800 rounded-xl p-5 hover:border-primary-500 transition">
            <h2 className="text-lg font-semibold mb-1">Entrar</h2>
            <p className="text-sm text-text-muted">Autenticação mockada para fluxo de navegação.</p>
          </Link>
          <Link to="/register" className="bg-background-secondary border border-gray-800 rounded-xl p-5 hover:border-primary-500 transition">
            <h2 className="text-lg font-semibold mb-1">Criar conta</h2>
            <p className="text-sm text-text-muted">Sem backend por enquanto.</p>
          </Link>
          <div className="bg-background-secondary border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold mb-1">Categorias</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {mockCategories.map((c) => (
                <span key={c.id} className="text-xs px-2 py-1 rounded-full border border-gray-700" style={{ color: c.color }}>
                  {c.name} · {c.count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hymns */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3">Hinos em Destaque</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topHymns.map((h) => (
              <div key={h.id} className="bg-background-secondary border border-gray-800 rounded-xl overflow-hidden">
                <img src={h.coverUrl} alt={h.title} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-1">{h.title}</div>
                  <div className="text-xs text-text-muted">Nº {h.number} · {h.category}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Albums */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3">Álbuns</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topAlbums.map((a) => (
              <div key={a.id} className="bg-background-secondary border border-gray-800 rounded-xl overflow-hidden">
                <img src={a.coverUrl} alt={a.title} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-1">{a.title}</div>
                  <div className="text-xs text-text-muted">Lançado em {new Date(a.releaseDate).getFullYear()}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Artists */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-3">Artistas</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topArtists.map((ar) => (
              <div key={ar.id} className="bg-background-secondary border border-gray-800 rounded-xl overflow-hidden text-center p-4">
                <img src={ar.imageUrl} alt={ar.name} className="w-24 h-24 object-cover rounded-full mx-auto mb-2" />
                <div className="text-sm font-medium line-clamp-1">{ar.name}</div>
                <div className="text-xs text-text-muted">{ar.followers.toLocaleString()} seguidores</div>
              </div>
            ))}
          </div>
        </section>

        {/* Playlists */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Playlists</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topPlaylists.map((p) => (
              <div key={p.id} className="bg-background-secondary border border-gray-800 rounded-xl overflow-hidden">
                <img src={p.coverUrl} alt={p.name} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                  <div className="text-xs text-text-muted">{p.tracks.length} faixas</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer links */}
        <div className="text-center mt-10">
          <Link to="/termos" className="text-sm text-primary-400 hover:underline mr-4">Termos</Link>
          <Link to="/privacidade" className="text-sm text-primary-400 hover:underline mr-4">Privacidade</Link>
          <Link to="/disclaimer" className="text-sm text-primary-400 hover:underline">Disclaimer</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
