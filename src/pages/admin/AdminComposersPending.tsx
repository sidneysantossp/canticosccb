import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Mail, Calendar, Mic2 } from 'lucide-react';
import { compositoresApi, documentReviewsApi } from '@/lib/api-client';
import { Link } from 'react-router-dom';

interface PendingComposer {
  id: number;
  nome: string;
  nome_artistico: string;
  email: string;
  biografia: string;
  created_at: string;
  documents?: any[];
}

const AdminComposersPending: React.FC = () => {
  const [composers, setComposers] = useState<PendingComposer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPendingComposers();
  }, []);

  const loadPendingComposers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('📋 [Pending] Carregando compositores pendentes...');
      
      // Carregar todos os compositores
      const response = await compositoresApi.list({ limit: 100 });
      console.log('📋 [Pending] Resposta API:', response);
      
      if (response.data) {
        const apiData = response.data as any;
        const allComposers = apiData.compositores || [];
        
        // Filtrar apenas não verificados
        const pending = allComposers.filter((c: any) => !c.verificado);
        console.log('📋 [Pending] Compositores não verificados:', pending);
        
        // Carregar documentos para cada compositor
        const composersWithDocs = await Promise.all(
          pending.map(async (composer: any) => {
            try {
              const docsResponse = await documentReviewsApi.getByCompositor(composer.id);
              return {
                ...composer,
                documents: docsResponse.data?.documents || []
              };
            } catch (error) {
              console.error(`Erro ao carregar documentos do compositor ${composer.id}:`, error);
              return { ...composer, documents: [] };
            }
          })
        );
        
        console.log('📋 [Pending] Compositores com documentos:', composersWithDocs);
        setComposers(composersWithDocs);
        setTotalCount(composersWithDocs.length);
      }
    } catch (error: any) {
      console.error('❌ [Pending] Erro ao carregar:', error);
      setError(error?.message || 'Erro ao carregar compositores pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && composers.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando compositores pendentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar compositores</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadPendingComposers}
            className="btn-primary"
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Compositores Pendentes</h1>
        <p className="text-gray-400">
          {totalCount} {totalCount === 1 ? 'compositor aguardando' : 'compositores aguardando'} aprovação
        </p>
      </div>

      {/* Stats Card */}
      {totalCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-300 font-semibold">Ação Necessária</p>
              <p className="text-yellow-400/80 text-sm">Revise e aprove os novos cadastros de compositores</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Composers List */}
      {composers.length > 0 ? (
        <div className="space-y-4">
          {composers.map((composer) => (
            <div
              key={composer.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <Mic2 className="w-8 h-8 text-gray-600" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {composer.nome_artistico || composer.nome}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {composer.email || 'Não informado'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(composer.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/composers/edit/${composer.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                        Revisar e Aprovar
                      </Link>
                    </div>
                  </div>

                  {/* Bio */}
                  {composer.biografia && (
                    <div className="bg-gray-800/50 rounded-lg p-3 mt-3">
                      <p className="text-gray-300 text-sm line-clamp-2">{composer.biografia}</p>
                    </div>
                  )}

                  {/* Documentos */}
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                    <span>{composer.documents?.length || 0} documento(s) enviado(s)</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Tudo em dia!</p>
          <p className="text-gray-500 text-sm">Não há compositores aguardando aprovação</p>
        </div>
      )}
    </div>
  );
};

export default AdminComposersPending;
