import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, Share2, ArrowLeft, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase-auth';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import SEOHead from '@/components/SEO/SEOHead';

interface Hymn {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome?: string;
  categoria?: string;
  cover_url?: string;
  audio_url?: string;
  letra?: string;
  duracao?: string;
}

const HymnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { play } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHymn();
  }, [id]);

  const loadHymn = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hinos')
        .select('id, numero, titulo, compositor_nome, categoria, cover_url, audio_url, letra, duracao')
        .eq('id', id)
        .single();

      if (error) throw error;
      setHymn(data);
    } catch (error) {
      console.error('Erro ao carregar hino:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (!hymn) return;
    
    const fallback = 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3';
    play({
      id: hymn.id,
      title: hymn.titulo,
      artist: hymn.compositor_nome || 'Coral CCB',
      coverUrl: hymn.cover_url || '',
      audioUrl: hymn.audio_url || fallback
    } as any);
  };

  const handleFavorite = () => {
    if (!hymn) return;
    
    if (isFavorite(hymn.id)) {
      removeFavorite(hymn.id);
    } else {
      addFavorite(hymn.id, 'hymn');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!hymn) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Hino não encontrado</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-primary-500 hover:text-primary-400"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${hymn.titulo} - Cânticos CCB`}
        description={`Ouça ${hymn.titulo} ${hymn.compositor_nome ? `de ${hymn.compositor_nome}` : ''}`}
      />
      
      <div className="min-h-screen bg-background-primary">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary-900/20 to-background-primary">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-text-muted hover:text-white mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Cover */}
              <img
                src={hymn.cover_url || 'https://picsum.photos/seed/hymn/300/300'}
                alt={hymn.titulo}
                className="w-48 h-48 rounded-lg shadow-2xl"
              />

              {/* Info */}
              <div className="flex-1">
                <p className="text-sm text-text-muted mb-2">HINO</p>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  {hymn.numero > 0 && !hymn.titulo.includes(String(hymn.numero))
                    ? `${hymn.numero} - ${hymn.titulo}`
                    : hymn.titulo}
                </h1>
                {hymn.compositor_nome && (
                  <p className="text-lg text-text-muted mb-4">{hymn.compositor_nome}</p>
                )}
                {hymn.categoria && (
                  <span className="inline-block px-3 py-1 bg-background-tertiary text-text-muted rounded-full text-sm">
                    {hymn.categoria}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-semibold transition-colors"
              >
                <Play className="w-5 h-5" />
                Reproduzir
              </button>
              
              <button
                onClick={handleFavorite}
                className={`p-3 rounded-full transition-colors ${
                  isFavorite(hymn.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-background-tertiary text-text-muted hover:text-white'
                }`}
              >
                <Heart className={`w-6 h-6 ${isFavorite(hymn.id) ? 'fill-current' : ''}`} />
              </button>

              <button className="p-3 rounded-full bg-background-tertiary text-text-muted hover:text-white transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Letra */}
        {hymn.letra && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-white mb-6">Letra</h2>
            <div className="bg-background-secondary rounded-lg p-6">
              <pre className="text-text-primary whitespace-pre-wrap font-sans">
                {hymn.letra}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HymnDetailPage;
