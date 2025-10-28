import React from 'react';

export interface Campaign {
  id: string;
  name: string;
}

interface FormDataShape {
  name: string;
  description: string;
  campaign_type: 'email' | 'sms' | 'push' | 'banner' | 'social' | 'multi-channel';
  target_audience: 'all' | 'premium' | 'free' | 'inactive' | 'new' | 'custom';
  subject: string;
  scheduled_at: string;
  budget: number;
  tags: string[];
}

interface Option { value: string; label: string }

interface Props {
  show: boolean;
  editingCampaign: Campaign | null;
  formData: FormDataShape;
  setFormData: (d: FormDataShape) => void;
  campaignTypes: Option[];
  targetAudiences: Option[];
  onClose: () => void;
  onSave: () => void;
}

const CampaignEditModal: React.FC<Props> = ({
  show,
  editingCampaign,
  formData,
  setFormData,
  campaignTypes,
  targetAudiences,
  onClose,
  onSave,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">
            {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Campanha *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="Digite o nome da campanha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              rows={3}
              placeholder="Descreva a campanha"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Campanha *</label>
              <select
                value={formData.campaign_type}
                onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              >
                {campaignTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Público-Alvo *</label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              >
                {targetAudiences.map(audience => (
                  <option key={audience.value} value={audience.value}>{audience.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Assunto (para email/push)</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="Assunto da mensagem"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Agendar para</label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Orçamento (R$)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={onSave} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            {editingCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignEditModal;
