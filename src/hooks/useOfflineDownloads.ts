import { useState, useEffect, useCallback } from 'react';

export interface DownloadableHymn {
  id: string;
  number: number;
  title: string;
  composer_name: string;
  category: string;
  audio_url: string;
  cover_url?: string;
  duration?: string;
  file_size?: number;
}

export interface DownloadedHymn extends DownloadableHymn {
  downloadedAt: string;
  localAudioUrl: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

export interface DownloadProgress {
  hymnId: string;
  progress: number;
  loaded: number;
  total: number;
  speed: number;
  timeRemaining: number;
}

export const useOfflineDownloads = () => {
  const [downloads, setDownloads] = useState<DownloadedHymn[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [totalStorage, setTotalStorage] = useState(0);
  const [availableStorage, setAvailableStorage] = useState(0);

  // Carregar downloads salvos
  useEffect(() => {
    loadDownloads();
    checkStorageQuota();
  }, []);

  // Carregar downloads do IndexedDB
  const loadDownloads = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['downloads'], 'readonly');
      const store = transaction.objectStore('downloads');
      const request = store.getAll();

      request.onsuccess = () => {
        const savedDownloads = request.result as DownloadedHymn[];
        setDownloads(savedDownloads);
        setIsLoading(false);
        console.log('📱 Downloads loaded:', savedDownloads.length);
      };

      request.onerror = () => {
        console.error('❌ Failed to load downloads');
        setIsLoading(false);
      };
    } catch (error) {
      console.error('❌ Error loading downloads:', error);
      setIsLoading(false);
    }
  };

  // Abrir IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CanticosCCB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('downloads')) {
          const store = db.createObjectStore('downloads', { keyPath: 'id' });
          store.createIndex('downloadedAt', 'downloadedAt');
          store.createIndex('category', 'category');
          store.createIndex('status', 'status');
        }
      };
    });
  };

  // Verificar quota de armazenamento
  const checkStorageQuota = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        setTotalStorage(estimate.quota || 0);
        setAvailableStorage((estimate.quota || 0) - (estimate.usage || 0));
      } catch (error) {
        console.warn('⚠️ Could not estimate storage');
      }
    }
  };

  // Baixar hino
  const downloadHymn = useCallback(async (hymn: DownloadableHymn): Promise<boolean> => {
    // Verificar se já está baixado
    if (downloads.find(d => d.id === hymn.id && d.status === 'completed')) {
      console.log('ℹ️ Hymn already downloaded:', hymn.title);
      return true;
    }

    try {
      console.log('⬇️ Starting download:', hymn.title);

      // Criar entrada de download
      const downloadEntry: DownloadedHymn = {
        ...hymn,
        downloadedAt: new Date().toISOString(),
        localAudioUrl: '',
        progress: 0,
        status: 'downloading'
      };

      // Adicionar à lista
      setDownloads(prev => {
        const filtered = prev.filter(d => d.id !== hymn.id);
        return [...filtered, downloadEntry];
      });

      // Fazer download via Service Worker
      const success = await downloadViaServiceWorker(hymn);

      if (success) {
        // Atualizar status
        setDownloads(prev => prev.map(d => 
          d.id === hymn.id 
            ? { ...d, status: 'completed', progress: 100, localAudioUrl: hymn.audio_url }
            : d
        ));

        // Salvar no IndexedDB
        await saveDownloadToDB(downloadEntry);
        
        console.log('✅ Download completed:', hymn.title);
        return true;
      } else {
        throw new Error('Download failed');
      }

    } catch (error) {
      console.error('❌ Download error:', error);
      
      // Marcar como erro
      setDownloads(prev => prev.map(d => 
        d.id === hymn.id 
          ? { ...d, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : d
      ));

      return false;
    }
  }, [downloads]);

  // Download via Service Worker
  const downloadViaServiceWorker = (hymn: DownloadableHymn): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve(false);
        return;
      }

      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        const { type, hymnId, error } = event.data;
        
        if (hymnId === hymn.id) {
          if (type === 'DOWNLOAD_SUCCESS') {
            resolve(true);
          } else if (type === 'DOWNLOAD_ERROR') {
            console.error('SW Download error:', error);
            resolve(false);
          }
        }
      };

      navigator.serviceWorker.controller.postMessage({
        type: 'DOWNLOAD_HYMN',
        data: hymn
      }, [channel.port2]);
    });
  };

  // Salvar no IndexedDB
  const saveDownloadToDB = async (download: DownloadedHymn) => {
    const db = await openDB();
    const transaction = db.transaction(['downloads'], 'readwrite');
    const store = transaction.objectStore('downloads');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put(download);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  // Remover download
  const removeDownload = useCallback(async (hymnId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Removing download:', hymnId);

      // Remover do cache via Service Worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'DELETE_HYMN',
          data: { hymnId }
        });
      }

      // Remover do IndexedDB
      const db = await openDB();
      const transaction = db.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(hymnId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Remover da lista
      setDownloads(prev => prev.filter(d => d.id !== hymnId));
      
      console.log('✅ Download removed:', hymnId);
      return true;

    } catch (error) {
      console.error('❌ Error removing download:', error);
      return false;
    }
  }, []);

  // Pausar download
  const pauseDownload = useCallback((hymnId: string) => {
    setDownloads(prev => prev.map(d => 
      d.id === hymnId && d.status === 'downloading'
        ? { ...d, status: 'paused' }
        : d
    ));
  }, []);

  // Retomar download
  const resumeDownload = useCallback(async (hymnId: string) => {
    const download = downloads.find(d => d.id === hymnId);
    if (download && download.status === 'paused') {
      await downloadHymn(download);
    }
  }, [downloads, downloadHymn]);

  // Limpar todos os downloads
  const clearAllDownloads = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🧹 Clearing all downloads...');

      // Limpar cache via Service Worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE',
          data: { cacheType: 'audio' }
        });
      }

      // Limpar IndexedDB
      const db = await openDB();
      const transaction = db.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setDownloads([]);
      console.log('✅ All downloads cleared');
      return true;

    } catch (error) {
      console.error('❌ Error clearing downloads:', error);
      return false;
    }
  }, []);

  // Verificar se hino está baixado
  const isDownloaded = useCallback((hymnId: string): boolean => {
    return downloads.some(d => d.id === hymnId && d.status === 'completed');
  }, [downloads]);

  // Obter hino baixado
  const getDownloadedHymn = useCallback((hymnId: string): DownloadedHymn | null => {
    return downloads.find(d => d.id === hymnId && d.status === 'completed') || null;
  }, [downloads]);

  // Estatísticas
  const stats = {
    totalDownloads: downloads.length,
    completedDownloads: downloads.filter(d => d.status === 'completed').length,
    downloadingCount: downloads.filter(d => d.status === 'downloading').length,
    errorCount: downloads.filter(d => d.status === 'error').length,
    totalSize: downloads.reduce((sum, d) => sum + (d.file_size || 0), 0),
    storageUsed: totalStorage - availableStorage,
    storageAvailable: availableStorage
  };

  return {
    // Estado
    downloads,
    activeDownloads,
    isLoading,
    stats,
    
    // Ações
    downloadHymn,
    removeDownload,
    pauseDownload,
    resumeDownload,
    clearAllDownloads,
    isDownloaded,
    getDownloadedHymn,
    
    // Utilitários
    loadDownloads,
    checkStorageQuota
  };
};
