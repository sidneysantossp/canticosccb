import React, { useState } from 'react';
import { Bell, Send, Users, Music, Crown, Calendar } from 'lucide-react';

const AdminNotifications: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all',
    schedule: false,
    scheduleDate: '',
    link: ''
  });

  const recentNotifications = [
    { id: 1, title: 'Novo hino disponível', sent: '2024-01-22 10:30', target: 'all', recipients: 24547 },
    { id: 2, title: 'Promoção Premium', sent: '2024-01-21 15:00', target: 'free', recipients: 12340 },
    { id: 3, title: 'Manutenção programada', sent: '2024-01-20 09:00', target: 'all', recipients: 24547 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notificações Push</h1>
        <p className="text-gray-400">Envie notificações para os usuários</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Nova Notificação</h2>
          
          <form className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Novo hino disponível!"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Mensagem</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                placeholder="Escreva sua mensagem..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Público-Alvo</label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              >
                <option value="all">Todos os usuários</option>
                <option value="free">Apenas Free</option>
                <option value="premium">Apenas Premium</option>
                <option value="composers">Compositores</option>
              </select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Link de Destino</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/new-releases"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-white">Agendar envio</span>
              </label>
            </div>

            {formData.schedule && (
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {formData.schedule ? 'Agendar Notificação' : 'Enviar Agora'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Preview</h3>
            <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-600">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-white font-semibold mb-1">
                    {formData.title || 'Título da notificação'}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {formData.message || 'Sua mensagem aparecerá aqui...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Histórico Recente</h3>
            <div className="space-y-3">
              {recentNotifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-white text-sm font-medium mb-1">{notif.title}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{notif.recipients.toLocaleString()} usuários</span>
                    <span>{notif.sent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
