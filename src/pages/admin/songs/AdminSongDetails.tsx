import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { hinosApi } from '@/lib/api-client';
import { ArrowLeft, FileAudio, Image as ImageIcon } from 'lucide-react';

interface Hino {
  id: number;
  numero?: number;
  titulo: string;
  compositor?: string;
  categoria?: string;
  audio_url: string;
  cover_url?: string;
  duracao?: string;
  letra?: string;
  ativo: number;
  created_at?: string;
}

const AdminSongDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [song, setSong] = useState<Hino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sanitizeHtml = useMemo(() => (html: string) => {
    if (!html) return '';
    let out = html;
    out = out.replace(/<\/(?:script|style)>/gi, '')
             .replace(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>/gi, '');
    out = out.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
             .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
             .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
    out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
             .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
    const allowed = /<(\/?)(p|br|strong|b|em|i|u|ul|ol|li|span|div|h1|h2|h3)\b[^>]*>/gi;
    out = out.replace(/<[^>]+>/g, (m) => (m.match(allowed) ? m : ''));
    return out;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await hinosApi.get(Number(id));
        if (res.error) throw new Error(res.error);
        setSong(res.data as any);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar hino');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando hino...</p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg p-4 mb-4">
          {error || 'Hino não encontrado'}
        </div>
        <button
          onClick={() => {
            // Se veio da página de pendentes, voltar no histórico; caso contrário, ir para pendentes
            const cameFromPending = typeof document !== 'undefined' && document.referrer.includes('/admin/songs/pending');
            if (cameFromPending) navigate(-1);
            else navigate('/admin/songs/pending');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Aprovação
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            const cameFromPending = typeof document !== 'undefined' && document.referrer.includes('/admin/songs/pending');
            if (cameFromPending) navigate(-1);
            else navigate('/admin/songs/pending');
          }}
          className="p-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{song.titulo}</h1>
          <p className="text-gray-400 text-sm">{song.compositor || 'Não especificado'} • {song.categoria || 'N/A'} • {song.duracao || '--:--'}</p>
        </div>
      </div>

      {/* Media */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="aspect-square bg-gray-800/50 border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {song.cover_url ? (
              <img src={song.cover_url} alt={song.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Sem capa
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2 flex items-center gap-2"><FileAudio className="w-4 h-4" /> Prévia do Áudio</p>
            <audio controls className="w-full">
              <source src={song.audio_url} />
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
          {song.letra && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Letra</p>
              <div className="prose prose-invert max-w-none text-white text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(song.letra) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSongDetails;
