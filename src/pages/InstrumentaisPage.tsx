import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, Download, Heart, List, ListPlus, MoreHorizontal, Music2, Pause, Play, Shuffle, X } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { getAll as getAllCategories } from '@/lib/categoriesApi';
import { supabaseFetch } from '@/lib/supabaseRest';
import { buildHinoUrl } from '@/utils/slugUrl';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerContext } from '@/contexts/PlayerContext';
import AlertModal from '@/components/ui/AlertModal';
import usePlaylistsStore from '@/stores/playlistsStore';
import type { Hino } from '@/types';

type InstrumentalHymn = {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome: string;
  categoria?: string;
  duracao?: string | number;
  audio_url?: string;
  cover_url?: string;
  youtube_source?: string;
};

const normalizeText = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const formatDuration = (value: InstrumentalHymn['duracao']) => {
  if (typeof value === 'string' && value.includes(':')) return value;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

const formatFormation = (value: string | undefined) => {
  const category = normalizeText(value);
  if (category.includes('orquestr')) return 'Orquestra Completa';
  if (category.includes('cord') || category.includes('viol')) return 'Cordas';
  if (category.includes('metal') || category.includes('tromp') || category.includes('tuba') || category.includes('brass')) return 'Metais';
  if (category.includes('madeira') || category.includes('flauta') || category.includes('clarinete') || category.includes('oboe') || category.includes('sax')) return 'Madeiras';
  if (category.includes('orgao') || category.includes('piano') || category.includes('teclado')) return 'Órgão';
  return value?.trim() || 'Instrumental';
};

async function loadInstrumentalHymns(): Promise<InstrumentalHymn[]> {
  const merged = new Map<string, any>();

  try {
    const categories = await getAllCategories({ limit: 1000 });
    const categoryIds = categories
      .filter((category) => {
        const text = `${normalizeText(category.slug)} ${normalizeText(category.name)}`;
        return text.includes('instrument') || text.includes('tocado');
      })
      .map((category) => String(category.id))
      .filter(Boolean);

    if (categoryIds.length > 0) {
      const relations = await supabaseFetch<any>('hino_categorias', {
        categoria_id: `in.(${categoryIds.join(',')})`,
        select: 'hino_id',
        limit: '5000',
      });
      const hymnIds = relations.map((relation) => String(relation.hino_id || '')).filter(Boolean);
      if (hymnIds.length > 0) {
        const linked = await supabaseFetch<any>('hinos', {
          id: `in.(${hymnIds.join(',')})`,
          or: '(ativo.eq.true,ativo.eq.1)',
          select: 'id,numero,titulo,compositor_nome,categoria,duracao,audio_url,cover_url,youtube_source',
          order: 'numero.asc',
          limit: '5000',
        });
        linked.forEach((hymn) => merged.set(String(hymn.id), hymn));
      }
    }
  } catch (error) {
    console.warn('[InstrumentaisPage] Não foi possível carregar relações de categorias:', error);
  }

  // Algumas instalações antigas guardam a formação diretamente em hinos.
  for (const term of ['instrument', 'tocado']) {
    try {
      const direct = await supabaseFetch<any>('hinos', {
        categoria: `ilike.%${term}%`,
        or: '(ativo.eq.true,ativo.eq.1)',
        select: 'id,numero,titulo,compositor_nome,categoria,duracao,audio_url,cover_url,youtube_source',
        order: 'numero.asc',
        limit: '5000',
      });
      direct.forEach((hymn) => merged.set(String(hymn.id), hymn));
    } catch (error) {
      console.warn(`[InstrumentaisPage] Consulta direta (${term}) indisponível:`, error);
    }
  }

  return Array.from(merged.values())
    .filter((hymn) => {
      const category = normalizeText(hymn.categoria);
      return category.includes('instrument') || category.includes('tocado') || category.includes('orquestr');
    })
    .map((hymn) => ({
      id: String(hymn.id),
      numero: Number(hymn.numero || 0),
      titulo: String(hymn.titulo || 'Hino instrumental'),
      compositor_nome: String(hymn.compositor_nome || 'Cânticos CCB'),
      categoria: hymn.categoria || undefined,
      duracao: hymn.duracao || hymn.duration || undefined,
      audio_url: hymn.audio_url || undefined,
      cover_url: hymn.cover_url || undefined,
      youtube_source: hymn.youtube_source || undefined,
    }))
    .sort((a, b) => (a.numero || 99999) - (b.numero || 99999) || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}

const InstrumentaisPage: React.FC = () => {
  const [hymns, setHymns] = useState<InstrumentalHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showDownloadNotice, setShowDownloadNotice] = useState(false);
  const [playlistHymn, setPlaylistHymn] = useState<InstrumentalHymn | null>(null);
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { user } = useAuth();
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylistsStore();
  const { openFullScreen } = usePlayerContext();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void loadInstrumentalHymns()
      .then((rows) => { if (active) setHymns(rows); })
      .catch(() => { if (active) setError('Não foi possível carregar os hinos instrumentais.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const listItems = useMemo(() => hymns.slice(0, 5000), [hymns]);

  const toggleFavorite = (hymn: InstrumentalHymn) => {
    const id = String(hymn.id);
    const next = new Set(favoriteIds);
    if (isFavorite(id) || next.has(id)) {
      removeFavorite(id, user?.id);
      next.delete(id);
    } else {
      addFavorite({
        id,
        title: hymn.titulo,
        artist: hymn.compositor_nome,
        album: 'Instrumentais CCB',
        duration: formatDuration(hymn.duracao),
        coverUrl: hymn.cover_url || '',
        audioUrl: hymn.audio_url || '',
        youtubeSource: hymn.youtube_source,
        number: hymn.numero,
        category: hymn.categoria || 'Instrumentais',
      }, user?.id);
      next.add(id);
    }
    setFavoriteIds(next);
  };

  const playHymn = (hymn: InstrumentalHymn) => {
    const track: Hino = {
      id: hymn.id,
      title: hymn.titulo,
      number: hymn.numero,
      category: hymn.categoria || 'Instrumentais',
      artist: hymn.compositor_nome,
      duration: formatDuration(hymn.duracao),
      audioUrl: hymn.audio_url,
      coverUrl: hymn.cover_url,
      youtubeSource: hymn.youtube_source,
    };
    if (currentTrack?.id === hymn.id && isPlaying) {
      pause();
      return;
    }
    if (play(track)) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) openFullScreen();
    }
  };

  const handleDownload = () => {
    setShowDownloadNotice(true);
  };

  const addToPlaylist = (playlistId: string) => {
    if (!playlistHymn) return;
    addTrackToPlaylist(playlistId, {
      id: playlistHymn.id,
      title: playlistHymn.titulo,
      artist: playlistHymn.compositor_nome,
      duration: formatDuration(playlistHymn.duracao),
      coverUrl: playlistHymn.cover_url || '',
      audioUrl: playlistHymn.audio_url,
      youtubeSource: playlistHymn.youtube_source,
      number: playlistHymn.numero,
      category: playlistHymn.categoria || 'Instrumentais',
    });
    setPlaylistHymn(null);
  };

  const schemaItems = listItems.slice(0, 80).map((hymn, index) => ({
    name: hymn.titulo,
    url: buildHinoUrl(hymn.id, hymn.titulo, hymn.numero),
    position: index + 1,
  }));

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background-primary text-white">
      <SEOHead
        title="Instrumentais CCB | Hinos Instrumentais"
        description="Ouça hinos instrumentais da CCB em um repertório organizado por formação, com navegação rápida e acesso direto a cada hino."
        keywords="hinos instrumentais ccb, hinos tocados ccb, orquestra ccb"
        canonical="/instrumentais"
        schemaData={[
          generateBreadcrumbSchema([{ name: 'Início', url: '/' }, { name: 'Instrumentais', url: '/instrumentais' }]),
          generateItemListSchema({
            name: 'Hinos Instrumentais CCB',
            description: 'Repertório de hinos instrumentais organizado por formação.',
            url: '/instrumentais',
            items: schemaItems,
          }),
        ]}
        noindex={!isLoading && listItems.length === 0}
      />

      <main className="min-h-screen w-full max-w-full pb-20">
      <header className="-mx-4 w-screen overflow-hidden bg-[linear-gradient(180deg,#0b4b2d_0%,#073b25_42%,#111111_100%)] px-4 pb-8 pt-8 sm:-mx-6 sm:w-screen sm:px-8 lg:-mx-8 lg:w-[calc(100vw-16rem+3rem)] lg:px-12">
          <div className="mx-auto w-full max-w-7xl">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-primary-300"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
            <div className="mt-7 flex min-w-0 flex-col gap-6 sm:flex-row sm:items-end">
              <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-md bg-black/60 shadow-2xl sm:h-52 sm:w-52">
                <img src="/images/instrumentais/hero-instrumentos-sopro.png" alt="Saxofone, trompete e tuba em uma sala de ensaio" className="absolute inset-0 block h-full w-full object-cover object-center" />
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Playlist pública</p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-6xl">Instrumentais CCB</h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-200 sm:text-base">Hinos instrumentais da orquestra para ouvir, estudar e acompanhar.</p>
                <p className="mt-3 text-sm text-gray-300">{isLoading ? 'Carregando repertório…' : `${listItems.length} faixas · Repertório instrumental`}</p>
              </div>
            </div>
          </div>
        </header>

        <section aria-label="Lista de hinos instrumentais" className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden px-4 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-4 overflow-x-auto py-5 text-gray-300 sm:gap-5">
            <button type="button" disabled={listItems.length === 0} onClick={() => listItems[0] && playHymn(listItems[0])} aria-label="Reproduzir instrumentais" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-black transition-transform hover:scale-105 disabled:opacity-50"><Play className="ml-0.5 h-5 w-5 fill-current" /></button>
            <button type="button" aria-label="Embaralhar" className="transition-colors hover:text-primary-300"><Shuffle className="h-6 w-6" /></button>
            <button type="button" onClick={handleDownload} aria-label="Baixar catálogo" className="transition-colors hover:text-primary-300"><Download className="h-6 w-6" /></button>
            <button type="button" aria-label="Favoritar playlist" className="transition-colors hover:text-primary-300"><Heart className="h-6 w-6" /></button>
            <button type="button" aria-label="Mais opções" className="transition-colors hover:text-primary-300"><MoreHorizontal className="h-6 w-6" /></button>
            <div className="ml-auto hidden items-center gap-2 text-xs text-gray-400 sm:flex"><List className="h-4 w-4" /> Lista</div>
          </div>
          <div className="hidden grid-cols-[56px_minmax(0,1fr)_190px_130px_72px_48px_48px_48px] items-center gap-4 border-b border-white/10 px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500 lg:grid">
            <span>#</span><span>Título</span><span>Formação</span><span>Adicionada em</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /></span><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </div>
          {isLoading ? (
            <div className="space-y-px p-3">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
          ) : error ? (
            <p className="px-5 py-12 text-center text-sm text-red-300">{error}</p>
          ) : listItems.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-500">Nenhum hino instrumental encontrado.</p>
          ) : (
            listItems.map((hymn) => {
              const active = currentTrack?.id === hymn.id;
              const liked = favoriteIds.has(hymn.id) || isFavorite(hymn.id);
              return (
                <article key={hymn.id} className={`group grid min-h-[64px] grid-cols-[32px_minmax(0,1fr)_36px_36px] items-center gap-2 border-b border-white/[0.06] px-3 py-2 transition-colors last:border-b-0 lg:grid-cols-[56px_minmax(0,1fr)_190px_130px_72px_48px_48px_48px] lg:gap-4 ${active ? 'bg-primary-500/[0.12]' : 'hover:bg-primary-500/[0.07]'}`}>
                  <span className={`text-sm tabular-nums ${active ? 'font-semibold text-primary-300' : 'text-gray-400'}`}>{hymn.numero ? String(hymn.numero).padStart(2, '0') : '—'}</span>
                  <Link to={buildHinoUrl(hymn.id, hymn.titulo, hymn.numero)} className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
                    <span className={`block truncate text-sm font-medium transition-colors group-hover:text-primary-300 ${active ? 'text-primary-300' : 'text-gray-100'}`}>{hymn.titulo}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-gray-500 lg:hidden">{hymn.compositor_nome}</span>
                  </Link>
                  <span className={`hidden truncate text-xs lg:block ${active ? 'text-primary-300' : 'text-gray-400'}`}>{formatFormation(hymn.categoria)}</span>
                  <span className="hidden text-xs text-gray-500 lg:block">—</span>
                  <span className="hidden text-xs tabular-nums text-gray-400 lg:block">{formatDuration(hymn.duracao)}</span>
                  <button type="button" onClick={() => toggleFavorite(hymn)} aria-label={liked ? `Remover ${hymn.titulo} dos favoritos` : `Favoritar ${hymn.titulo}`} className={`hidden h-9 w-9 items-center justify-center rounded-full transition-colors lg:flex ${liked ? 'text-primary-400' : 'text-gray-500 hover:text-primary-300'}`}><Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} /></button>
                  <button type="button" onClick={() => setPlaylistHymn(hymn)} aria-label={`Adicionar ${hymn.titulo} à playlist`} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-primary-300"><ListPlus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => playHymn(hymn)} aria-label={active && isPlaying ? `Pausar ${hymn.titulo}` : `Reproduzir ${hymn.titulo}`} className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${active ? 'border-primary-400 text-primary-300' : 'border-white/15 text-gray-400 hover:border-primary-400 hover:text-primary-300'}`}>
                    {active && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                  </button>
                </article>
              );
            })
          )}
        </section>
        <div className="mt-5 flex items-center gap-2 text-xs text-gray-500 md:hidden"><Music2 className="h-4 w-4 text-primary-300" /> Deslize para explorar a lista e use o botão de reprodução para ouvir.</div>
      </main>
      {playlistHymn && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setPlaylistHymn(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#191a19] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Adicionar à playlist</h2><button type="button" onClick={() => setPlaylistHymn(null)} aria-label="Fechar"><X className="h-5 w-5 text-gray-400" /></button></div>
            <p className="mb-4 truncate text-sm text-gray-400">{playlistHymn.titulo}</p>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {playlists.map((playlist) => <button key={playlist.id} type="button" onClick={() => addToPlaylist(playlist.id)} className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-left text-sm text-white transition-colors hover:bg-primary-500/20">{playlist.name}</button>)}
            </div>
            <button type="button" onClick={() => { const name = window.prompt('Nome da nova playlist'); if (name?.trim()) { const playlist = createPlaylist(name.trim()); addToPlaylist(playlist.id); } }} className="mt-4 w-full rounded-lg border border-primary-400/60 px-3 py-2 text-sm font-semibold text-primary-300 transition-colors hover:bg-primary-500/10">+ Criar playlist</button>
          </div>
        </div>
      )}
      <AlertModal
        isOpen={showDownloadNotice}
        onClose={() => setShowDownloadNotice(false)}
        title={user ? 'Download em breve' : 'Login necessário'}
        message={user ? 'Este recurso estará disponível em breve.' : 'Faça o login para baixar.'}
        type={user ? 'info' : 'warning'}
        buttonText={user ? 'Entendi' : 'Login'}
        buttonColor="green"
        secondaryButtonText="Agora não"
        secondaryButtonColor="red"
        primaryHref={user ? undefined : '/login'}
      />
    </div>
  );
};

export default InstrumentaisPage;
