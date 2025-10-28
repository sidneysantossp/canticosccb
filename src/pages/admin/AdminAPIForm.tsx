import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Key, Shield, Zap } from 'lucide-react';

const API_SCOPES = [
  { value: 'read', label: 'Leitura', description: 'Acessar dados (GET)' },
  { value: 'write', label: 'Escrita', description: 'Criar e atualizar (POST, PUT)' },
  { value: 'delete', label: 'Deletar', description: 'Remover dados (DELETE)' },
  { value: 'admin', label: 'Administração', description: 'Acesso completo ao sistema' }
];

const RATE_LIMITS = [
  { value: '100', label: '100 req/min', description: 'Uso básico' },
  { value: '1000', label: '1.000 req/min', description: 'Uso padrão' },
  { value: '10000', label: '10.000 req/min', description: 'Uso intensivo' },
  { value: 'unlimited', label: 'Ilimitado', description: 'Sem limites' }
];

const AdminAPIForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scopes: ['read'] as string[],
    rate_limit: '1000',
    ip_whitelist: '',
    expires_at: '',
    is_active: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleScope = (scope: string) => {
    if (formData.scopes.includes(scope)) {
      setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope) });
    } else {
      setFormData({ ...formData, scopes: [...formData.scopes, scope] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.scopes.length === 0) {
      setError('Selecione pelo menos um escopo');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const apiKeyData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        scopes: formData.scopes,
        rate_limit: formData.rate_limit === 'unlimited' ? null : parseInt(formData.rate_limit),
        ip_whitelist: formData.ip_whitelist.trim() || undefined,
        expires_at: formData.expires_at || undefined,
        is_active: formData.is_active
      };

      // TODO: Implementar criação de API key quando backend estiver pronto
      // const result = await createAPIKey(apiKeyData);
      // Show API key to user only once

      navigate('/admin/api');
    } catch (error: any) {
      console.error('Erro ao criar chave API:', error);
      setError(error?.message || 'Erro ao criar chave API');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/api"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Nova Chave de API</h1>
            <p className="text-gray-400 mt-1">Crie uma chave de acesso à API</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Informações da Chave
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Ex: Mobile App API Key"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descrição do uso desta chave..."
                />
              </div>
            </div>
          </div>

          {/* Escopos de Acesso */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Escopos de Acesso
            </h2>
            
            <div className="space-y-3">
              {API_SCOPES.map((scope) => (
                <label
                  key={scope.value}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{scope.label}</p>
                    <p className="text-gray-400 text-sm">{scope.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.scopes.includes(scope.value)}
                    onChange={() => toggleScope(scope.value)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Limite de Taxa */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Limite de Taxa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RATE_LIMITS.map((limit) => (
                <label
                  key={limit.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.rate_limit === limit.value
                      ? 'border-green-600 bg-green-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rate_limit"
                    value={limit.value}
                    checked={formData.rate_limit === limit.value}
                    onChange={(e) => setFormData({ ...formData, rate_limit: e.target.value })}
                    className="sr-only"
                  />
                  <div>
                    <p className="text-white font-semibold">{limit.label}</p>
                    <p className="text-gray-400 text-sm">{limit.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Configurações Avançadas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Whitelist de IPs
                </label>
                <input
                  type="text"
                  value={formData.ip_whitelist}
                  onChange={(e) => setFormData({ ...formData, ip_whitelist: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="192.168.1.1, 10.0.0.1 (separados por vírgula)"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Deixe vazio para permitir todos os IPs
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Expiração
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Deixe vazio para chave sem expiração
                </p>
              </div>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Chave Ativa</p>
                  <p className="text-gray-400 text-sm">Permitir uso desta chave</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Aviso de Segurança */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-sm">
              <strong>⚠️ Importante:</strong> A chave API será exibida apenas uma vez após a criação. Guarde-a em um local seguro!
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/api"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Criar Chave API</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAPIForm;
