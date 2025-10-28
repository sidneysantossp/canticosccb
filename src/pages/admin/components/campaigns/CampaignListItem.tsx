import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: 'email' | 'sms' | 'push' | 'banner' | 'social' | 'multi-channel';
  target_audience: 'all' | 'premium' | 'free' | 'inactive' | 'new' | 'custom';
  subject?: string;
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'completed';
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  converted_count: number;
  budget?: number;
  spent: number;
  revenue_generated: number;
  tags: string[];
}

interface Option { value: string; label: string; color?: string }

interface Props {
  campaign: Campaign;
  campaignTypes: Option[];
  targetAudiences: Option[];
  campaignStatuses: Option[];
  getTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
  formatNumber: (n: number) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d?: string) => string;
  onDelete: (id: string) => void;
}

const CampaignListItem: React.FC<Props> = ({
  campaign,
  campaignTypes,
  targetAudiences,
  campaignStatuses,
  getTypeColor,
  getStatusColor,
  formatNumber,
  formatCurrency,
  formatDate,
  onDelete,
}) => {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-white font-semibold text-lg">{campaign.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full border bg-${getTypeColor(campaign.campaign_type)}-500/20 text-${getTypeColor(campaign.campaign_type)}-400 border-${getTypeColor(campaign.campaign_type)}-500/30`}>
              {campaignTypes.find(t => t.value === campaign.campaign_type)?.label}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full border bg-${getStatusColor(campaign.status)}-500/20 text-${getStatusColor(campaign.status)}-400 border-${getStatusColor(campaign.status)}-500/30`}>
              {campaignStatuses.find(s => s.value === campaign.status)?.label}
            </span>
          </div>
          {campaign.description && (
            <p className="text-gray-400 text-sm mb-3">{campaign.description}</p>
          )}
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">Público: </span>
              <span className="text-white">{targetAudiences.find(a => a.value === campaign.target_audience)?.label}</span>
            </div>
            {campaign.subject && (
              <div>
                <span className="text-gray-400">Assunto: </span>
                <span className="text-white">{campaign.subject}</span>
              </div>
            )}
            {campaign.scheduled_at && (
              <div>
                <span className="text-gray-400">Agendada para: </span>
                <span className="text-white">{formatDate(campaign.scheduled_at)}</span>
              </div>
            )}
            {campaign.sent_at && (
              <div>
                <span className="text-gray-400">Enviada em: </span>
                <span className="text-white">{formatDate(campaign.sent_at)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Link to={`/admin/campaigns/editar/${campaign.id}`} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Editar">
            <Edit className="w-4 h-4 text-blue-400" />
          </Link>
          <button onClick={() => onDelete(campaign.id)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      {campaign.sent_count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Enviados</p>
            <p className="text-white font-semibold">{formatNumber(campaign.sent_count)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Entregues</p>
            <p className="text-green-400 font-semibold">{formatNumber(campaign.delivered_count)}</p>
            <p className="text-gray-500 text-xs">
              {campaign.sent_count > 0 ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Abertos</p>
            <p className="text-blue-400 font-semibold">{formatNumber(campaign.opened_count)}</p>
            <p className="text-gray-500 text-xs">
              {campaign.delivered_count > 0 ? ((campaign.opened_count / campaign.delivered_count) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Cliques</p>
            <p className="text-purple-400 font-semibold">{formatNumber(campaign.clicked_count)}</p>
            <p className="text-gray-500 text-xs">
              {campaign.opened_count > 0 ? ((campaign.clicked_count / campaign.opened_count) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Conversões</p>
            <p className="text-yellow-400 font-semibold">{formatNumber(campaign.converted_count)}</p>
            <p className="text-gray-500 text-xs">
              {campaign.clicked_count > 0 ? ((campaign.converted_count / campaign.clicked_count) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Budget & Revenue */}
      <div className="flex items-center gap-6 pt-4 mt-4 border-t border-gray-700 text-sm">
        {campaign.budget && campaign.budget > 0 && (
          <div>
            <span className="text-gray-400">Orçamento: </span>
            <span className="text-white">{formatCurrency(campaign.budget)}</span>
          </div>
        )}
        {campaign.spent > 0 && (
          <div>
            <span className="text-gray-400">Gasto: </span>
            <span className="text-orange-400">{formatCurrency(campaign.spent)}</span>
          </div>
        )}
        {campaign.revenue_generated > 0 && (
          <div>
            <span className="text-gray-400">Receita: </span>
            <span className="text-green-400 font-medium">{formatCurrency(campaign.revenue_generated)}</span>
          </div>
        )}
        {campaign.revenue_generated > 0 && campaign.spent > 0 && (
          <div>
            <span className="text-gray-400">ROI: </span>
            <span className="text-pink-400 font-medium">
              {((campaign.revenue_generated / campaign.spent - 1) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {campaign.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {campaign.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignListItem;
