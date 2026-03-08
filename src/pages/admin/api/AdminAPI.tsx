import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, RefreshCw, Power } from 'lucide-react';
import { deleteApiKey, getApiKeys, maskApiKey, toggleApiKeyStatus, type ApiKeyRecord } from '@/lib/admin/apiAdminApi';

type LocationState = {
  createdKey?: string;
  createdKeyName?: string;
};

const AdminAPI: React.FC = () => {
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  const createdKeyBanner = useMemo(() => {
    if (!state.createdKey) return null;
    return {
      name: state.createdKeyName || 'Nova chave',
      key: state.createdKey,
    };
  }, [state.createdKey, state.createdKeyName]);

  const loadKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setApiKeys(await getApiKeys());
    } catch (err: any) {
      console.error('Erro ao carregar API keys:', err);
      setError(err?.message || 'Erro ao carregar API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const toggleVisibility = (id: string) => {
    setVisibleIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleCopy = async (key: string) => {
    await navigator.clipboard.writeText(key);
  };

  const handleToggleStatus = async (item: ApiKeyRecord) => {
    try {
      await toggleApiKeyStatus(item.id, !item.is_active);
      setApiKeys((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, is_active: !item.is_active } : entry))
      );
    } catch (err) {
      console.error('Erro ao atualizar API key:', err);
      alert('Não foi possível atualizar o status da chave.');
    }
  };

  const handleDelete = async (item: ApiKeyRecord) => {
    if (!confirm(`Excluir a chave "${item.name}"?`)) return;

    try {
      await deleteApiKey(item.id);
      setApiKeys((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      console.error('Erro ao excluir API key:', err);
      alert('Não foi possível excluir a chave.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando chaves da API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar chaves</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadKeys()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">Gerencie as chaves de integração da plataforma</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadKeys()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <Link
            to="/admin/api/create"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova API Key
          </Link>
        </div>
      </div>

      {createdKeyBanner && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-300 text-sm mb-2">
            Chave criada para <strong>{createdKeyBanner.name}</strong>. Guarde este valor agora.
          </p>
          <code className="block bg-black/30 rounded-lg px-3 py-2 text-green-200 break-all">
            {createdKeyBanner.key}
          </code>
        </div>
      )}

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-yellow-500 text-sm">
          Nunca compartilhe chaves secretas publicamente. O valor completo só deve ser exibido para administradores autorizados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {apiKeys.map((apiKey) => {
          const isVisible = visibleIds.includes(apiKey.id);
          const successRate = apiKey.total_requests > 0
            ? ((apiKey.successful_requests / apiKey.total_requests) * 100).toFixed(1)
            : '0.0';

          return (
            <div key={apiKey.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Key className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{apiKey.name}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${apiKey.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {apiKey.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-300 uppercase">
                        {apiKey.environment}
                      </span>
                    </div>

                    {apiKey.description ? (
                      <p className="text-gray-400 text-sm mb-3">{apiKey.description}</p>
                    ) : null}

                    <div className="flex items-center gap-2 mb-3">
                      <code className="px-3 py-1 bg-gray-800 rounded text-purple-400 font-mono text-sm break-all">
                        {isVisible ? apiKey.key : maskApiKey(apiKey.key)}
                      </code>
                      <button className="p-1 hover:bg-gray-800 rounded" onClick={() => handleCopy(apiKey.key)} title="Copiar chave">
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-800 rounded" onClick={() => toggleVisibility(apiKey.id)} title="Mostrar ou ocultar">
                        {isVisible ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-gray-400">
                      <span>Criada em: {new Date(apiKey.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>Último uso: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString('pt-BR') : 'Nunca'}</span>
                      <span>Requisições: {apiKey.total_requests.toLocaleString('pt-BR')}</span>
                      <span>Taxa de sucesso: {successRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(apiKey)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title={apiKey.is_active ? 'Desativar' : 'Ativar'}
                  >
                    <Power className={`w-4 h-4 ${apiKey.is_active ? 'text-yellow-400' : 'text-green-400'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(apiKey)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma chave cadastrada</p>
        </div>
      )}
    </div>
  );
};

export default AdminAPI;
