import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-auth';
import useNotificationsStore from '@/stores/notificationsStore';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
  link?: string | null;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Acessar store para sincronizar contador
  const notificationsStore = useNotificationsStore();

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: rows, error: fetchErr } = await supabase
        .from('notifications')
        .select('id,title,message,type,link,is_read,created_at')
        .eq('user_id', user.id)
        .neq('type', 'support_chat')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;

      const notificacoesFormatadas: Notification[] = (rows || []).map((n: any) => ({
        id: n.id,
        tipo: n.type || 'geral',
        titulo: n.title || '',
        mensagem: n.message || '',
        lida: Boolean(n.is_read),
        criado_em: n.created_at,
        link: n.link,
      }));

      setNotifications(notificacoesFormatadas);

      // Sincronizar com store Zustand
      notificationsStore.clearAll();
      notificacoesFormatadas.forEach(notif => {
        if (!notif.lida) {
          notificationsStore.addNotification({
            type: 'admin',
            title: notif.titulo,
            message: notif.mensagem
          });
        }
      });

    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, lida: true } : n)
      );

      // Sincronizar com store Zustand
      notificationsStore.clearAll();
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, lida: true } : n
      );
      updatedNotifications.forEach(notif => {
        if (!notif.lida) {
          notificationsStore.addNotification({
            type: 'admin',
            title: notif.titulo,
            message: notif.mensagem
          });
        }
      });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user?.id) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .neq('type', 'support_chat')
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      notificationsStore.clearAll();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-400">
                  {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={false}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Marcar todas como lidas"
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Marcar todas como lidas</span>
              <span className="sm:hidden">Marcar lidas</span>
            </button>
          )}
        </div>

        {/* Lista de Notificações */}
        {notifications.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-gray-500">
              Você não tem notificações no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-gray-900 border rounded-xl p-5 transition-all ${notification.lida
                    ? 'border-gray-800 opacity-70'
                    : 'border-primary-500/50 bg-primary-500/5'
                  }`}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.tipo === 'convite'
                        ? 'bg-blue-500/20'
                        : 'bg-gray-700'
                      }`}
                  >
                    {notification.tipo === 'convite' ? (
                      <Mail className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold">
                        {notification.titulo}
                      </h3>
                      {!notification.lida && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-3">
                      {notification.mensagem}
                    </p>

                    {/* Botões de ação para convites */}
                    {notification.tipo === 'convite' && !notification.lida && (
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => navigate('/manager-invites')}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver Convites
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(notification.criado_em).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
