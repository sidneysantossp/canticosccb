import React, { useState } from 'react';
import { Save, Globe, Mail, Shield, Database, Bell, CreditCard } from 'lucide-react';
import AdminSettingsEmail from '../AdminSettingsEmail';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Gerais', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'integrations', label: 'Integrações', icon: Database },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'push', label: 'Notificações Push', icon: Bell },
    { id: 'payment', label: 'Pagamento', icon: CreditCard }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações da Plataforma</h1>
        <p className="text-gray-400">Gerencie as configurações globais do sistema</p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Informações da Plataforma</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome da Plataforma</label>
                <input
                  type="text"
                  defaultValue="Cânticos CCB"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Slogan</label>
                <input
                  type="text"
                  defaultValue="Sua plataforma de hinos"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Descrição</label>
              <textarea
                rows={3}
                defaultValue="Plataforma completa para hinos da CCB"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Email de Contato</label>
                <input
                  type="email"
                  defaultValue="contato@canticosccb.com.br"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Telefone</label>
                <input
                  type="tel"
                  defaultValue="(11) 1234-5678"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Configurações Regionais</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Idioma Padrão</label>
                <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                  <option>Português (BR)</option>
                  <option>Inglês</option>
                  <option>Espanhol</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Timezone</label>
                <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                  <option>America/Sao_Paulo</option>
                  <option>America/New_York</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Moeda</label>
                <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                  <option>BRL (R$)</option>
                  <option>USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
            <Save className="w-5 h-5" />
            Salvar Configurações
          </button>
        </div>
      )}

      {/* Push Notifications Settings */}
      {activeTab === 'push' && (
        <div className="space-y-6">
          {/* Configurações do provedor */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Configuração do Provedor</h2>
            <p className="text-gray-400 text-sm mb-4">Defina as credenciais do serviço de push (ex.: Firebase Cloud Messaging, OneSignal). Estes dados serão usados para envios da plataforma.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Server Key / API Key</label>
                <input type="password" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Sender ID / App ID</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Tópico/Canal Padrão</label>
                <input type="text" placeholder="canticosccb-compositores" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Ambiente</label>
                <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                  <option>Produção</option>
                  <option>Sandbox</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">Salvar Credenciais</button>
              <button className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">Enviar Notificação de Teste</button>
            </div>
          </div>

          {/* Segmentação e Envio */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Segmentação de Compositores</h2>
            <p className="text-gray-400 text-sm">Utiliza os campos de preferências na tabela <code className="text-gray-300">compositores</code>:</p>
            <ul className="text-gray-400 text-sm list-disc pl-6">
              <li><code className="text-gray-300">notif_push_new_followers</code> (novos seguidores)</li>
              <li><code className="text-gray-300">notif_push_milestones</code> (marcos alcançados)</li>
            </ul>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-white">Incluir quem optou por "Novos seguidores"</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-white">Incluir quem optou por "Marcos alcançados"</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Título</label>
                <input type="text" placeholder="Atualização importante" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">URL (opcional)</label>
                <input type="text" placeholder="https://canticosccb.com.br/..." className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600" />
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Mensagem</label>
              <textarea rows={3} placeholder="Digite a mensagem da campanha" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none" />
            </div>

            <div className="flex gap-3">
              <button className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">Pré-visualizar</button>
              <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">Enviar Campanha</button>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <AdminSettingsEmail />
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Configurações de Segurança</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-white">Exigir 2FA para administradores</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-white">Verificação de email obrigatória</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-white">Rate limiting ativo</span>
              </label>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Tempo de Sessão (minutos)</label>
              <input
                type="number"
                defaultValue="60"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
            Salvar Configurações
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
