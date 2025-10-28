import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hinosApi, compositoresApi } from '@/lib/api-client';
import { apiFetch } from '@/lib/api-helper';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast, { ToastProps } from '@/components/ui/Toast';
import {
  Music,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Calendar,
  Tag,
  AlertCircle
} from 'lucide-react';

interface PendingSong {
  id: number;
  numero?: number;
  titulo: string;
  compositor?: string;
  categoria?: string;
  duracao?: string;
  audio_url: string;
  cover_url?: string;
  letra?: string;
  created_at?: string;
}

const AdminSongsPending: React.FC = () => {
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const [selectedSongData, setSelectedSongData] = useState<{ title: string; cover?: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [pendingSongs, setPendingSongs] = useState<PendingSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Sanitização simples para exibir HTML da letra com segurança (permitindo formatação básica)
  const sanitizeHtml = (html: string) => {
    if (!html) return '';
    let out = html;
    // Remover scripts e styles
    out = out.replace(/<\/(?:script|style)>/gi, '')
             .replace(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>/gi, '');
    // Remover atributos on*
    out = out.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
             .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
             .replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
    // Bloquear javascript: em href/src
    out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
             .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
    // Permitir apenas tags básicas; remover outras tags
    const allowed = /<(\/?)(p|br|strong|b|em|i|u|ul|ol|li|span|div)\b[^>]*>/gi;
    out = out.replace(/<[^>]+>/g, (m) => (m.match(allowed) ? m : ''));
    return out;
  };

  // Função para adicionar toast
  const showToast = (type: ToastProps['type'], title: string, message?: string) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      onClose: (toastId) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }
    };
    setToasts(prev => [...prev, newToast]);
  };

  // Carregar hinos pendentes
  useEffect(() => {
    loadPendingSongs();
  }, []);

  const loadPendingSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await hinosApi.listPending();
      
      if (res.error) {
        throw new Error(res.error);
      }
      
      setPendingSongs(res.data?.hinos || []);
    } catch (err: any) {
      console.error('Erro ao carregar hinos pendentes:', err);
      setError(err.message || 'Erro ao carregar hinos pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data removido - agora usa dados reais
  const mockPendingSongs = [
    {
      id: 1,
      thumbnail: 'https://picsum.photos/seed/p1/200',
      title: 'Hino Novo - Glória Eterna',
      composer: 'João Silva',
      composerEmail: 'joao@email.com',
      category: 'Adoração',
      genre: 'Contemporâneo',
      duration: '4:32',
      uploadDate: '2024-01-20',
      composerHistory: { approved: 8, rejected: 1, total: 9 },
      audioUrl: '#',
      lyrics: 'Glória eterna ao Senhor...'
    },
    {
      id: 2,
      thumbnail: 'https://picsum.photos/seed/p2/200',
      title: 'Cântico de Louvor',
      composer: 'Maria Santos',
      composerEmail: 'maria@email.com',
      category: 'Louvor',
      genre: 'Coral',
      duration: '3:45',
      uploadDate: '2024-01-21',
      composerHistory: { approved: 15, rejected: 0, total: 15 },
      audioUrl: '#',
      lyrics: 'Louvai ao Senhor...'
    },
    {
      id: 3,
      thumbnail: 'https://picsum.photos/seed/p3/200',
      title: 'Paz do Senhor',
      composer: 'Pedro Costa',
      composerEmail: 'pedro@email.com',
      category: 'Paz',
      genre: 'Hino',
      duration: '5:12',
      uploadDate: '2024-01-22',
      composerHistory: { approved: 3, rejected: 2, total: 5 },
      audioUrl: '#',
      lyrics: 'A paz do Senhor...'
    }
  ];

  const handleApprove = (songId: number) => {
    // Encontrar o hino para pegar título e capa
    const song = pendingSongs.find(s => s.id === songId);
    
    setSelectedSong(songId);
    setSelectedSongData({
      title: song?.titulo || 'Hino',
      cover: song?.cover_url
    });
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedSong) return;

    try {
      const res = await hinosApi.approve(selectedSong);
      
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Notificar compositor (best-effort): tenta descobrir usuario_id pelo nome do compositor
      try {
        const s = pendingSongs.find(s => s.id === selectedSong);
        const nomeCompositor = s?.compositor || '';
        let usuarioId: number | null = null;
        if (nomeCompositor) {
          try {
            const list = await compositoresApi.list({ search: nomeCompositor, page: 1, limit: 1 } as any);
            const compArr: any[] = (list.data as any)?.data || (list.data as any)?.compositores || [];
            if (Array.isArray(compArr) && compArr.length > 0) {
              const comp = compArr[0];
              usuarioId = comp?.usuario_id || null;
            }
          } catch {}
        }
        const payload: any = {
          tipo: 'hino_aprovado',
          titulo: s?.titulo || 'Hino aprovado',
          mensagem: `Seu hino "${s?.titulo || 'Hino'}" foi aprovado e está como Rascunho para você publicar.`,
          usuario_id: usuarioId || undefined,
          dados: { hino_id: selectedSong, compositor: nomeCompositor }
        };
        await apiFetch('api/notificacoes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('Falha ao enviar notificação ao compositor');
      }

      showToast('success', 'Hino Aprovado!', 'O hino foi aprovado e definido como Rascunho. O compositor/gerente poderá publicar quando desejar.');
      setShowApproveModal(false);
      setSelectedSong(null);
      setSelectedSongData(null);
      loadPendingSongs(); // Recarregar lista
    } catch (err: any) {
      console.error('Erro ao aprovar hino:', err);
      showToast('error', 'Erro ao Aprovar', err.message || 'Não foi possível aprovar o hino. Tente novamente.');
    }
  };

  const handleReject = (songId: number) => {
    // Encontrar o hino para pegar título e capa
    const song = pendingSongs.find(s => s.id === songId);
    
    setSelectedSong(songId);
    setSelectedSongData({
      title: song?.titulo || 'Hino',
      cover: song?.cover_url
    });
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    // Fecha modal de confirmação e abre modal de motivo
    setShowRejectModal(false);
    setShowRejectReasonModal(true);
  };

  const confirmReject = async () => {
    if (!selectedSong || !rejectionReason.trim()) {
      return;
    }

    try {
      const res = await hinosApi.reject(selectedSong, rejectionReason);
      
      if (res.error) {
        throw new Error(res.error);
      }
      
      showToast('success', 'Hino Rejeitado', 'O hino foi removido e o compositor será notificado.');
      setShowRejectReasonModal(false);
      setRejectionReason('');
      setSelectedSong(null);
      setSelectedSongData(null);
      loadPendingSongs(); // Recarregar lista
    } catch (err: any) {
      console.error('Erro ao rejeitar hino:', err);
      showToast('error', 'Erro ao Rejeitar', err.message || 'Não foi possível rejeitar o hino. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando hinos pendentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <p className="text-red-200">Erro: {error}</p>
          <button 
            onClick={loadPendingSongs}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Aprovação de Hinos</h1>
          <p className="text-gray-400">{pendingSongs.length} hinos aguardando aprovação</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 font-semibold rounded-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {pendingSongs.length} Pendentes
          </span>
        </div>
      </div>

      {/* Pending Songs List */}
      <div className="space-y-4">
        {pendingSongs.map((song) => (
          <div
            key={song.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-600 transition-colors"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left - Song Info */}
              <div className="lg:col-span-2 space-y-4">
                {/* Thumbnail and Basic Info */}
                <div className="flex gap-4">
                  <img
                    src={song.cover_url || `https://picsum.photos/seed/${song.id}/200`}
                    alt={song.titulo}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{song.titulo}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{song.compositor || 'Não especificado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Tag className="w-4 h-4" />
                        <span>{song.categoria || 'N/A'}</span>
                        {song.duracao && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span>{song.duracao}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Enviado em {song.created_at ? new Date(song.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audio Player */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Preview do Áudio</p>
                  <audio controls className="w-full">
                    <source src={song.audio_url} type="audio/mpeg" />
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>

                {/* Lyrics Preview */}
                {song.letra && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">Letra (Preview)</p>
                    <div
                      className="prose prose-invert max-w-none text-white text-sm line-clamp-6"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(song.letra) }}
                    />
                  </div>
                )}
              </div>

              {/* Right - Actions and Info */}
              <div className="space-y-4">

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleApprove(song.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprovar Hino
                  </button>
                  
                  <button
                    onClick={() => handleReject(song.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeitar Hino
                  </button>

                  <Link
                    to={`/admin/songs/${song.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                    Visualizar Detalhes
                  </Link>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-500 text-xs">
                    Certifique-se de revisar completamente o conteúdo antes de aprovar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Confirmação de Aprovação */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedSong(null);
          setSelectedSongData(null);
        }}
        onConfirm={confirmApprove}
        title="Aprovar Hino"
        message="Tem certeza que deseja aprovar este hino? Ele sairá da fila de aprovação e ficará como Rascunho para o compositor/gerente publicar."
        confirmText="Aprovar"
        cancelText="Cancelar"
        confirmColor="green"
        songTitle={selectedSongData?.title}
        songArtist="Coral CCB"
        songCover={selectedSongData?.cover}
      />

      {/* Modal de Confirmação de Rejeição */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedSong(null);
          setSelectedSongData(null);
        }}
        onConfirm={handleConfirmReject}
        title="Rejeitar Hino"
        message="Tem certeza que deseja rejeitar este hino? O compositor será notificado e o hino será removido da plataforma."
        confirmText="Continuar"
        cancelText="Cancelar"
        confirmColor="amber"
        songTitle={selectedSongData?.title}
        songArtist="Coral CCB"
        songCover={selectedSongData?.cover}
      />

      {/* Modal de Motivo da Rejeição */}
      {showRejectReasonModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#124e2a] to-[#000201] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Motivo da Rejeição</h3>
            <p className="text-white/80 text-sm mb-4">
              Por favor, informe o motivo da rejeição. Isso ajudará o compositor a melhorar futuros uploads.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Descreva o motivo
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Qualidade de áudio baixa, letra incorreta, etc..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-600 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectReasonModal(false);
                    setRejectionReason('');
                    setSelectedSong(null);
                    setSelectedSongData(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700/80 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[200] space-y-3">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
};

export default AdminSongsPending;
