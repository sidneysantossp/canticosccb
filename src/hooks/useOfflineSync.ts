import { useState, useEffect, useCallback } from 'react';
import { usePWA } from './usePWA';
import { useOfflineDownloads } from './useOfflineDownloads';

interface SyncStatus {
  issyncing: boolean;
  lastSync: Date | null;
  pendingActions: number;
  errors: string[];
}

interface PendingAction {
  id: string;
  type: 'play_count' | 'like' | 'playlist_add' | 'rating' | 'comment';
  data: any;
  timestamp: Date;
  retries: number;
}

export const useOfflineSync = () => {
  const { isOnline } = usePWA();
  const { loadDownloads } = useOfflineDownloads();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    issyncing: false,
    lastSync: null,
    pendingActions: 0,
    errors: []
  });

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  // Carregar ações pendentes do localStorage
  useEffect(() => {
    loadPendingActions();
  }, []);

  // Auto-sync quando voltar online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      console.log('🔄 Back online, starting auto-sync...');
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length]);

  // Carregar ações pendentes
  const loadPendingActions = () => {
    try {
      const stored = localStorage.getItem('offline-pending-actions');
      if (stored) {
        const actions = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        }));
        setPendingActions(actions);
        setSyncStatus(prev => ({ ...prev, pendingActions: actions.length }));
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  };

  // Salvar ações pendentes
  const savePendingActions = (actions: PendingAction[]) => {
    try {
      localStorage.setItem('offline-pending-actions', JSON.stringify(actions));
      setPendingActions(actions);
      setSyncStatus(prev => ({ ...prev, pendingActions: actions.length }));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  };

  // Adicionar ação pendente
  const addPendingAction = useCallback((type: PendingAction['type'], data: any) => {
    const action: PendingAction = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retries: 0
    };

    const newActions = [...pendingActions, action];
    savePendingActions(newActions);

    console.log('📝 Added pending action:', action);

    // Tentar sincronizar imediatamente se online
    if (isOnline) {
      syncPendingActions();
    }
  }, [pendingActions, isOnline]);

  // Sincronizar ações pendentes
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || syncStatus.issyncing) {
      return;
    }

    console.log('🔄 Starting sync of', pendingActions.length, 'pending actions...');

    setSyncStatus(prev => ({ ...prev, issyncing: true, errors: [] }));

    const successfulActions: string[] = [];
    const failedActions: PendingAction[] = [];
    const errors: string[] = [];

    for (const action of pendingActions) {
      try {
        const success = await syncAction(action);
        
        if (success) {
          successfulActions.push(action.id);
          console.log('✅ Synced action:', action.type, action.id);
        } else {
          // Incrementar tentativas
          const updatedAction = { ...action, retries: action.retries + 1 };
          
          // Descartar após 5 tentativas
          if (updatedAction.retries < 5) {
            failedActions.push(updatedAction);
          } else {
            console.warn('❌ Discarding action after 5 retries:', action);
            errors.push(`Falha ao sincronizar ${action.type} após 5 tentativas`);
          }
        }
      } catch (error) {
        console.error('❌ Error syncing action:', action, error);
        
        const updatedAction = { ...action, retries: action.retries + 1 };
        if (updatedAction.retries < 5) {
          failedActions.push(updatedAction);
        } else {
          errors.push(`Erro ao sincronizar ${action.type}: ${error}`);
        }
      }
    }

    // Atualizar lista de ações pendentes
    savePendingActions(failedActions);

    // Atualizar status
    setSyncStatus(prev => ({
      ...prev,
      issyncing: false,
      lastSync: new Date(),
      errors
    }));

    console.log('🔄 Sync completed:', {
      successful: successfulActions.length,
      failed: failedActions.length,
      errors: errors.length
    });

    // Recarregar downloads se houve mudanças
    if (successfulActions.length > 0) {
      loadDownloads();
    }

  }, [isOnline, pendingActions, syncStatus.issyncing, loadDownloads]);

  // Sincronizar ação individual
  const syncAction = async (action: PendingAction): Promise<boolean> => {
    try {
      switch (action.type) {
        case 'play_count':
          return await syncPlayCount(action.data);
        
        case 'like':
          return await syncLike(action.data);
        
        case 'playlist_add':
          return await syncPlaylistAdd(action.data);
        
        case 'rating':
          return await syncRating(action.data);
        
        case 'comment':
          return await syncComment(action.data);
        
        default:
          console.warn('Unknown action type:', action.type);
          return false;
      }
    } catch (error) {
      console.error('Error in syncAction:', error);
      return false;
    }
  };

  // Sincronizar contagem de reprodução
  const syncPlayCount = async (data: { hymnId: string; timestamp: string }): Promise<boolean> => {
    try {
      // Simular API call
      const response = await fetch('/api/hymns/play-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error syncing play count:', error);
      return false;
    }
  };

  // Sincronizar curtida
  const syncLike = async (data: { hymnId: string; liked: boolean }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hymns/${data.hymnId}/like`, {
        method: data.liked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error syncing like:', error);
      return false;
    }
  };

  // Sincronizar adição à playlist
  const syncPlaylistAdd = async (data: { playlistId: string; hymnId: string }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/playlists/${data.playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hymnId: data.hymnId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error syncing playlist add:', error);
      return false;
    }
  };

  // Sincronizar avaliação
  const syncRating = async (data: { hymnId: string; rating: number }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hymns/${data.hymnId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: data.rating })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error syncing rating:', error);
      return false;
    }
  };

  // Sincronizar comentário
  const syncComment = async (data: { hymnId: string; comment: string }): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hymns/${data.hymnId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: data.comment })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error syncing comment:', error);
      return false;
    }
  };

  // Sincronização manual
  const manualSync = useCallback(() => {
    if (isOnline) {
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions]);

  // Limpar ações pendentes
  const clearPendingActions = useCallback(() => {
    savePendingActions([]);
    setSyncStatus(prev => ({ ...prev, errors: [] }));
  }, []);

  // Remover ação específica
  const removePendingAction = useCallback((actionId: string) => {
    const newActions = pendingActions.filter(action => action.id !== actionId);
    savePendingActions(newActions);
  }, [pendingActions]);

  return {
    // Estado
    syncStatus,
    pendingActions,
    
    // Ações
    addPendingAction,
    manualSync,
    clearPendingActions,
    removePendingAction,
    
    // Utilitários
    loadPendingActions
  };
};
