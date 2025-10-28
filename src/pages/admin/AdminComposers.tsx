import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Mic2, AlertCircle } from 'lucide-react';
import { compositoresApi, type Compositor } from '@/lib/api-client';
import { Avatar } from '@/components/ui/Avatar';

const AdminComposers: React.FC = () => {
  const [composers, setComposers] = useState<Compositor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadComposers();
  }, [currentPage]);

  const loadComposers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await compositoresApi.list({ page: currentPage, limit: 20 });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        // A API retorna 'compositores' não 'data'
        const apiData = response.data as any;
        const composersList = apiData.compositores || [];
        setComposers(composersList);
        setTotalPages(apiData.pages || 1);
        setTotalCount(apiData.total || 0);
        
        // Contar pendentes
        const pending = composersList.filter((c: Compositor) => !c.verificado).length;
        setPendingCount(pending);
      }
    } catch (error: any) {
      console.error('Error loading composers:', error);
      setError(error?.message || 'Erro ao carregar compositores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApproved = async (id: string, currentVerificado: boolean) => {
    try {
      await compositoresApi.update(parseInt(id), { verificado: currentVerificado ? 0 : 1 });
      loadComposers();
    } catch (error) {
      console.error('Error toggling approved:', error);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o compositor ${nome}?`)) return;
    
    try {
      await compositoresApi.delete(parseInt(id));
      loadComposers();
    } catch (error) {
      console.error('Error deleting composer:', error);
    }
  };

  if (isLoading && composers.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando compositores...</p>
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
            onClick={loadComposers}
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
      {/* Alerta de Compositores Pendentes */}
      {pendingCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-200 mb-1">Ação Necessária</h3>
              <p className="text-yellow-100 mb-3">
                {pendingCount} {pendingCount === 1 ? 'compositor aguardando' : 'compositores aguardando'} aprovação
              </p>
              <Link
                to="/admin/composers/pending"
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Revisar e Aprovar Cadastros
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Compositores</h1>
          <p className="text-gray-400">Total: {totalCount} compositores</p>
        </div>
        <Link
          to="/admin/composers/create"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Compositor
        </Link>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Compositor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Seguidores
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {composers.map((composer) => (
                <tr key={composer.id} className="hover:bg-gray-800/30 transition-colors">
                  {/* Composer */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={composer.avatar_url} 
                        name={composer.nome || composer.nome_artistico || 'Compositor'} 
                        size="md"
                      />
                      <div>
                        <p className="text-white font-semibold">
                          {composer.nome_artistico || composer.nome}
                        </p>
                        <p className="text-gray-400 text-sm">{composer.biografia?.substring(0, 50) || 'Sem biografia'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Seguidores */}
                  <td className="px-6 py-4">
                    <span className="text-gray-300">0</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {composer.verificado ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-green-500/20 text-green-400 border-green-500/30">
                        Aprovado
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pendente
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Toggle Approved */}
                      <button
                        onClick={() => handleToggleApproved(composer.id.toString(), !!composer.verificado)}
                        className={`p-2 rounded-lg transition-colors ${
                          composer.verificado
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title={composer.verificado ? 'Remover aprovação' : 'Aprovar'}
                      >
                        {composer.verificado ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <Link
                        to={`/admin/composers/edit/${composer.id}`}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(composer.id.toString(), composer.nome)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {composers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Mic2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhum compositor encontrado</p>
            <p className="text-gray-500 text-sm">Adicione o primeiro compositor</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComposers;
