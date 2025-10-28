import React, { useEffect, useState } from 'react';
import { Bell, Heart, Users, Shield, Check, X, Trash2, MoreVertical } from 'lucide-react';
import { ComposerPageWrapper } from '@/components/ComposerPageWrapper';
import useNotificationsStore, { Notification } from '@/stores/notificationsStore';

const ComposerHistory: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    loadNotifications 
  } = useNotificationsStore();

  const [filter, setFilter] = useState<'all' | 'favorite' | 'follow' | 'admin'>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'favorite':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'follow':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const getFilterCount = (type: 'all' | 'favorite' | 'follow' | 'admin') => {
    if (type === 'all') return notifications.length;
    return notifications.filter(n => n.type === type).length;
  };

  return (
    <ComposerPageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bell className="w-7 h-7" />
              Notificações
            </h1>
            <p className="text-gray-400 mt-1">
              Acompanhe todas as atividades relacionadas aos seus hinos
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Marcar todas como lidas
              </button>
            )}
            
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpar todas
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-white">{notifications.length}</p>
                <p className="text-sm text-gray-400">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-white">{getFilterCount('favorite')}</p>
                <p className="text-sm text-gray-400">Favoritos</p>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-white">{getFilterCount('follow')}</p>
                <p className="text-sm text-gray-400">Seguidores</p>
              </div>
            </div>
          </div>

          <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-white">{getFilterCount('admin')}</p>
                <p className="text-sm text-gray-400">Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todas', count: getFilterCount('all') },
            { key: 'favorite', label: 'Favoritos', count: getFilterCount('favorite') },
            { key: 'follow', label: 'Seguidores', count: getFilterCount('follow') },
            { key: 'admin', label: 'Admin', count: getFilterCount('admin') }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                filter === filterOption.key
                  ? 'bg-primary-500 text-black'
                  : 'bg-background-secondary text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filterOption.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === filterOption.key
                  ? 'bg-black/20 text-black'
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {filterOption.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="bg-background-secondary rounded-xl border border-gray-800">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer relative ${
                    !notification.isRead ? 'bg-blue-500/5 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* User Avatar (if available) */}
                    {notification.userAvatar && (
                      <img
                        src={notification.userAvatar}
                        alt={notification.userName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-semibold ${
                            notification.isRead ? 'text-gray-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            notification.isRead ? 'text-gray-400' : 'text-gray-300'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(showMenu === notification.id ? null : notification.id);
                            }}
                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>

                          {showMenu === notification.id && (
                            <div className="absolute right-0 top-full mt-1 bg-background-tertiary border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                    setShowMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Marcar como lida
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                  setShowMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm text-red-400 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remover
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === 'all' ? 'Nenhuma notificação' : `Nenhuma notificação de ${filter}`}
              </h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? 'Você receberá notificações quando usuários interagirem com seus hinos.'
                  : 'Não há notificações deste tipo no momento.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </ComposerPageWrapper>
  );
};

export default ComposerHistory;
