import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Megaphone, Calendar, Tag as TagIcon } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: 'email' | 'sms' | 'push' | 'banner' | 'social' | 'multi-channel';
  target_audience: 'all' | 'premium' | 'free' | 'inactive' | 'new' | 'custom';
  subject?: string;
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'completed';
  budget?: number;
  tags: string[];
}

const CAMPAIGN_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push Notification' },
  { value: 'banner', label: 'Banner' },
  { value: 'social', label: 'Redes Sociais' },
  { value: 'multi-channel', label: 'Multi-canal' }
];

const TARGET_AUDIENCES = [
  { value: 'all', label: 'Todos os Usuários' },
  { value: 'premium', label: 'Assinantes Premium' },
  { value: 'free', label: 'Usuários Gratuitos' },
  { value: 'inactive', label: 'Usuários Inativos' },
  { value: 'new', label: 'Novos Usuários' },
  { value: 'custom', label: 'Personalizado' }
];

const AdminCampaignForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'email' as Campaign['campaign_type'],
    target_audience: 'all' as Campaign['target_audience'],
    subject: '',
    scheduled_at: '',
    budget: 0,
    status: 'draft' as Campaign['status'],
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadCampaign(id);
    }
  }, [id, isEditing]);

  const loadCampaign = async (campaignId: string) => {
    try {
      setIsLoading(true);
      // TODO: Implementar getCampaignById quando backend estiver pronto
      // const campaign = await getCampaignById(campaignId);
      // if (campaign) { setFormData(...); }
    } catch (error: any) {
      console.error('Erro ao carregar campanha:', error);
      setError(error?.message || 'Erro ao carregar campanha');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        campaign_type: formData.campaign_type,
        target_audience: formData.target_audience,
        subject: formData.subject.trim() || undefined,
        scheduled_at: formData.scheduled_at || undefined,
        budget: formData.budget || undefined,
        status: formData.status,
        tags: formData.tags
      };

      if (isEditing && id) {
        // await updateCampaign(id, campaignData);
      } else {
        // await createCampaign(campaignData);
      }

      navigate('/admin/campaigns');
    } catch (error: any) {
      console.error('Erro ao salvar campanha:', error);
      setError(error?.message || 'Erro ao salvar campanha');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/campaigns"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
            </h1>
            <p className="text-gray-400 mt-1">Configure campanhas de marketing e comunicação</p>
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
              <Megaphone className="w-5 h-5" />
              Informações da Campanha
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Ex: Campanha de Páscoa 2025"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descrição interna da campanha..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Tipo de Campanha *
                  </label>
                  <select
                    value={formData.campaign_type}
                    onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {CAMPAIGN_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Público-Alvo *
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {TARGET_AUDIENCES.map(audience => (
                      <option key={audience.value} value={audience.value}>{audience.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(formData.campaign_type === 'email' || formData.campaign_type === 'sms') && (
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Assunto/Mensagem
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder={formData.campaign_type === 'email' ? 'Assunto do email' : 'Mensagem do SMS'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Agendamento e Orçamento */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendamento e Orçamento
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data e Hora de Envio
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Deixe em branco para enviar imediatamente
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Orçamento (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="0.00"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Orçamento máximo para esta campanha
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5" />
              Tags
            </h2>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Digite uma tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Status da Campanha</h2>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendada</option>
                <option value="paused">Pausada</option>
                <option value="cancelled">Cancelada</option>
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Status inicial da campanha
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/campaigns"
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
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Campanha'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCampaignForm;
