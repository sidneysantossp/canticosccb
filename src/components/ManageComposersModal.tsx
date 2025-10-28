import React, { useState, useEffect } from 'react';
import { X, Music, CheckCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextMock';
import { compositorGerentesApi, type CompositorGerente } from '@/lib/api-client';

interface ManageComposersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  onSelectComposer?: (composerId: number, composerName: string) => void;
}

const ManageComposersModal: React.FC<ManageComposersModalProps> = ({
  isOpen,
  onClose,
  userId: propUserId,
  onSelectComposer
}) => {
  const [composers, setComposers] = useState<CompositorGerente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, switchToComposer } = useAuth();
  const navigate = useNavigate();
  
  const userId = propUserId || user?.id;

  useEffect(() => {
    if (isOpen && userId) {
      loadComposers();
    }
  }, [isOpen, userId]);

  const loadComposers = async () => {
    if (!userId) {
      setError('Usuário não identificado');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Usar o cliente unificado (evita CORS e padroniza formato)
      const response: any = await compositorGerentesApi.listarCompositores(userId);

      // response vem como { data: payload }
      const payload = response?.data;
      const list = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.data) ? payload.data : []);

      setComposers(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar compositores');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComposer = (composer: CompositorGerente) => {
    if (onSelectComposer) {
      onSelectComposer(composer.compositor_id, composer.nome_artistico || composer.nome || 'Compositor');
      onClose();
    } else {
      // Ativar modo de gerenciamento e navegar para o painel do compositor
      switchToComposer(composer.compositor_id, composer.nome_artistico || composer.nome || 'Compositor');
      navigate(`/composer/dashboard?id=${composer.compositor_id}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-background-secondary rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gerenciar Compositores</h2>
              <p className="text-text-muted text-sm">Selecione um compositor para gerenciar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-hover transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <button
                onClick={loadComposers}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : composers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Nenhum compositor encontrado</h3>
              <p className="text-text-muted text-sm">
                Você ainda não gerencia nenhum compositor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {composers.map((composer) => (
                <button
                  key={composer.id}
                  onClick={() => handleSelectComposer(composer)}
                  className="w-full p-4 bg-background-tertiary hover:bg-background-hover rounded-xl border border-gray-800 hover:border-primary-500/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {composer.avatar_url ? (
                      <img
                        src={composer.avatar_url}
                        alt={composer.nome_artistico || composer.nome}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-700 group-hover:border-primary-500 transition-colors"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center border-2 border-gray-700 group-hover:border-primary-500 transition-colors">
                        <Music className="w-8 h-8 text-primary-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold text-lg group-hover:text-primary-400 transition-colors">
                        {composer.nome_artistico || composer.nome}
                      </h3>
                      {composer.biografia && (
                        <p className="text-text-muted text-sm line-clamp-1">
                          {composer.biografia}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-400 text-xs font-medium">Ativo</span>
                      </div>
                    </div>
                    
                    <div className="text-primary-400 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageComposersModal;
