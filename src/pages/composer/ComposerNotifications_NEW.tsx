import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Construction } from 'lucide-react';

const ComposerNotifications: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
        </div>
      </div>

      <div className="text-center py-16 border border-dashed border-gray-800 rounded-lg bg-gray-900/50">
        <Construction className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Em Desenvolvimento</h2>
        <p className="text-gray-400 mb-6">
          O sistema de notificações está sendo migrado para o novo backend.
        </p>
        <p className="text-gray-500 text-sm">
          Em breve você receberá notificações sobre novos seguidores, comentários e atualizações.
        </p>
      </div>
    </div>
  );
};

export default ComposerNotifications;
