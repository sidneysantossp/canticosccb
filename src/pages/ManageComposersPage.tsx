import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Music, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { compositorGerentesApi } from '@/lib/api-client';

interface ManagedComposer {
  compositor_id: number;
  compositor_nome: string;
  compositor_nome_artistico: string;
  compositor_email: string;
  status: string;
}

const ManageComposersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [composers, setComposers] = useState<ManagedComposer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManagedComposers();
  }, [user]);

  const loadManagedComposers = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response: any = await compositorGerentesApi.listarCompositores(user.id);
      
      if (response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : response.data.compositores || [];
        // Filtrar apenas os ativos
        const activeComposers = dataArray.filter(
          (g: any) => g.status === 'ativo'
        );
        setComposers(activeComposers);
      }
    } catch (error) {
      console.error('Erro ao carregar compositores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessComposer = (composer: ManagedComposer) => {
    // Salvar no localStorage
    localStorage.setItem('managingComposerId', String(composer.compositor_id));
    localStorage.setItem('managingComposerName', composer.compositor_nome_artistico || composer.compositor_nome);
    
    // Redirecionar para dashboard do compositor
    navigate('/composer/dashboard');
    
    // Recarregar para aplicar mudanças
    window.location.href = '/composer/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando compositores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-white">Gerenciar Compositores</h1>
          </div>
          <p className="text-gray-400">
            Selecione um compositor para gerenciar sua conta
          </p>
        </div>

        {/* Lista de Compositores */}
        {composers.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum compositor para gerenciar
            </h3>
            <p className="text-gray-400">
              Você não possui compositores ativos para gerenciar no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {composers.map((composer) => (
              <div
                key={composer.compositor_id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-primary-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar/Icon */}
                    <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-primary-500" />
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {composer.compositor_nome_artistico || composer.compositor_nome}
                      </h3>
                      {composer.compositor_nome_artistico && (
                        <p className="text-sm text-gray-400 mb-1">
                          {composer.compositor_nome}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-4 h-4" />
                        {composer.compositor_email}
                      </div>
                    </div>
                  </div>

                  {/* Botão Acessar */}
                  <button
                    onClick={() => handleAccessComposer(composer)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all group-hover:scale-105"
                  >
                    Acessar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageComposersPage;
