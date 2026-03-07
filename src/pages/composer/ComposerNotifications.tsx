import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { supabase } from '@/lib/supabase-auth';
import { supabaseUpdate, supabaseDelete, isSupabaseConfigured } from '@/lib/supabaseRest';
import { Bell, ExternalLink, Inbox, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/components/ConfirmModal';
import { useActiveComposer } from '@/hooks/useActiveComposer';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  link: string | null;
  lida: boolean;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const ComposerNotifications: React.FC = () => {
  const { user } = useAuth();
  const { decrementCount } = useNotifications();
  const { composerId, isManagingComposer, loading: loadingComposer } = useActiveComposer();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const fetchNotifications = async (page: number = 1, cId?: string | null) => {
    const resolvedComposerId = cId ?? composerId;
    if (!resolvedComposerId && !user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select('id,title,message,type,link,is_read,created_at', { count: 'exact' });

      if (resolvedComposerId && isManagingComposer) {
        query = query.eq('composer_id', resolvedComposerId);
      } else if (resolvedComposerId && user?.id) {
        query = query.or(`composer_id.eq.${resolvedComposerId},user_id.eq.${user.id}`);
      } else if (resolvedComposerId) {
        query = query.eq('composer_id', resolvedComposerId);
      } else if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data: rows, error: queryError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) {
        throw queryError;
      }

      setNotifications((rows || []).map((row: any) => ({
        id: row.id,
        titulo: row.title || '',
        mensagem: row.message || null,
        tipo: row.type || 'geral',
        link: row.link || null,
        lida: row.is_read,
        created_at: row.created_at
      })));
      setTotalNotifications(count || 0);
    } catch (err: any) {
      console.error('Erro ao carregar notificações:', err);
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if ((!user?.id && !composerId) || !isSupabaseConfigured || loadingComposer) {
        setLoading(false);
        return;
      }

      // 2. Buscar notificações
      if (!cancelled) {
        await fetchNotifications(1, composerId);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [composerId, loadingComposer, user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.lida;

      await supabaseUpdate('notifications', { id: `eq.${id}` }, { is_read: true });
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      if (wasUnread) {
        decrementCount();
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDeleteClick = (id: string) => {
    setNotificationToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      await supabaseDelete('notifications', { id: `eq.${notificationToDelete}` });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
      setTotalNotifications(prev => prev - 1);
      
      if (notifications.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        fetchNotifications(newPage);
      } else if (notifications.length === 1) {
        fetchNotifications(1);
      }
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
    } finally {
      setNotificationToDelete(null);
    }
  };

  const totalPages = Math.ceil(totalNotifications / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchNotifications(newPage);
  };

  // Paginação: recarregar ao mudar de página
  // (init já carrega a primeira página)

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Carregando notificações...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          {notifications.filter(n => !n.lida).length > 0 && (
            <span className="px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
              {notifications.filter(n => !n.lida).length}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-lg bg-gray-900/50">
          <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma notificação</h2>
          <p className="text-gray-400">
            Você não tem notificações no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                notification.lida
                  ? 'bg-gray-900/30 border-gray-800 hover:bg-gray-900/50'
                  : 'bg-primary-900/20 border-primary-700/50 hover:bg-primary-900/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${notification.lida ? 'text-gray-600' : 'text-primary-400'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`font-semibold ${notification.lida ? 'text-gray-400' : 'text-white'}`}>
                      {notification.titulo}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notification.lida && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(notification.id);
                          }}
                          className="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                          title="Deletar notificação"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {notification.mensagem && (
                    <p className={`mt-1 text-sm ${notification.lida ? 'text-gray-500' : 'text-gray-300'}`}>
                      {notification.mensagem}
                    </p>
                  )}
                  {notification.link && (
                    <div className="mt-2 flex items-center gap-2 text-primary-400 text-sm">
                      <ExternalLink className="w-4 h-4" />
                      <span>Clique para ver detalhes</span>
                    </div>
                  )}
                </div>
                {!notification.lida && (
                  <label
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => markAsRead(notification.id)}
                      className="w-5 h-5 rounded border-2 border-primary-500 bg-transparent cursor-pointer appearance-none checked:bg-primary-500 checked:border-primary-500 hover:border-primary-400 transition-colors relative
                        after:content-[''] after:absolute after:hidden checked:after:block
                        after:left-[5px] after:top-[2px] after:w-[6px] after:h-[10px]
                        after:border-white after:border-r-2 after:border-b-2
                        after:rotate-45"
                      title="Marcar como lida"
                    />
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Marcar lida
                    </span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
          <div className="text-sm text-gray-400">
            Página {currentPage} de {totalPages} ({totalNotifications} notificações no total)
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Números das páginas */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Próxima página"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setNotificationToDelete(null);
        }}
        onConfirm={deleteNotification}
        title="Deletar Notificação"
        message="Tem certeza que deseja deletar esta notificação? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ComposerNotifications;
