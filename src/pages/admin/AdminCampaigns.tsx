import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import CampaignsStatsCards from '@/pages/admin/components/campaigns/CampaignsStatsCards';
import CampaignListItem from '@/pages/admin/components/campaigns/CampaignListItem';
import CampaignEditModal from '@/pages/admin/components/campaigns/CampaignEditModal';
import {
  Campaign as CampaignModel,
  CampaignInput,
  createCampaign,
  deleteCampaign,
  getAllCampaigns,
  updateCampaign
} from '@/lib/admin/campaignsAdminApi';
const AdminCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignModel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'email' as CampaignModel['campaign_type'],
    target_audience: 'all' as CampaignModel['target_audience'],
    subject: '',
    scheduled_at: '',
    budget: 0,
    tags: [] as string[]
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalSent: 0,
    totalRevenue: 0
  });

  const campaignTypes = [
    { value: 'email', label: 'Email', color: 'blue' },
    { value: 'sms', label: 'SMS', color: 'green' },
    { value: 'push', label: 'Push Notification', color: 'purple' },
    { value: 'banner', label: 'Banner', color: 'yellow' },
    { value: 'social', label: 'Redes Sociais', color: 'pink' },
    { value: 'multi-channel', label: 'Multi-canal', color: 'orange' }
  ];

  const targetAudiences = [
    { value: 'all', label: 'Todos os Usuários' },
    { value: 'premium', label: 'Usuários Cadastrados' },
    { value: 'free', label: 'Visitantes sem Cadastro' },
    { value: 'inactive', label: 'Usuários Inativos' },
    { value: 'new', label: 'Novos Usuários' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const campaignStatuses = [
    { value: 'draft', label: 'Rascunho', color: 'gray' },
    { value: 'scheduled', label: 'Agendada', color: 'blue' },
    { value: 'sending', label: 'Enviando', color: 'yellow' },
    { value: 'sent', label: 'Enviada', color: 'green' },
    { value: 'paused', label: 'Pausada', color: 'orange' },
    { value: 'cancelled', label: 'Cancelada', color: 'red' },
    { value: 'completed', label: 'Concluída', color: 'purple' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rows = await getAllCampaigns({ order: 'created_at.desc' });
      setCampaigns(rows);
      setStats({
        total: rows.length,
        active: rows.filter(c => ['scheduled', 'sending', 'sent'].includes(c.status)).length,
        totalSent: rows.reduce((sum, c) => sum + (c.sent_count || 0), 0),
        totalRevenue: rows.reduce((sum, c) => sum + (c.revenue_generated || 0), 0)
      });
    } catch (err: any) {
      console.error('Erro ao carregar campanhas:', err);
      setError(err?.message || 'Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (campaign?: CampaignModel) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        campaign_type: campaign.campaign_type,
        target_audience: campaign.target_audience,
        subject: campaign.subject || '',
        scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.split('T')[0] : '',
        budget: campaign.budget || 0,
        tags: campaign.tags
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        description: '',
        campaign_type: 'email',
        target_audience: 'all',
        subject: '',
        scheduled_at: '',
        budget: 0,
        tags: []
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) return;

    try {
      const payload: CampaignInput = {
        name: trimmedName,
        description: formData.description.trim() || undefined,
        campaign_type: formData.campaign_type,
        target_audience: formData.target_audience,
        subject: formData.subject.trim() || undefined,
        scheduled_at: formData.scheduled_at || undefined,
        budget: formData.budget || undefined,
        tags: formData.tags
      };

      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, payload);
      } else {
        await createCampaign(payload);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta campanha?')) return;

    try {
      const success = await deleteCampaign(id);
      if (!success) {
        throw new Error('Falha ao excluir campanha');
      }
      loadData();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const typeObj = campaignTypes.find(t => t.value === type);
    return typeObj?.color || 'gray';
  };

  const getStatusColor = (status: string) => {
    const statusObj = campaignStatuses.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar campanhas</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
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
          <h1 className="text-3xl font-bold text-white mb-2">Campanhas de Marketing</h1>
          <p className="text-gray-400">Gerencie campanhas multicanal</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <Link
            to="/admin/campaigns/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Campanha
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <CampaignsStatsCards
        stats={stats}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
      />

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <CampaignListItem
            key={campaign.id}
            campaign={campaign}
            campaignTypes={campaignTypes}
            targetAudiences={targetAudiences}
            campaignStatuses={campaignStatuses}
            getTypeColor={getTypeColor}
            getStatusColor={getStatusColor}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma campanha encontrada</p>
          <p className="text-gray-500 text-sm">Crie sua primeira campanha de marketing</p>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      <CampaignEditModal
        show={showModal}
        editingCampaign={editingCampaign}
        formData={formData}
        setFormData={setFormData}
        campaignTypes={campaignTypes}
        targetAudiences={targetAudiences}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminCampaigns;
