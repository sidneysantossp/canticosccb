import React, { useState, useEffect } from 'react';
import { Download, Check, X, RefreshCw, Pause, WifiOff } from 'lucide-react';
import { useOfflineDownloads, DownloadableHymn } from '@/hooks/useOfflineDownloads';

interface DownloadButtonProps {
  hymn: DownloadableHymn;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'card';
  showLabel?: boolean;
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  hymn,
  size = 'md',
  variant = 'icon',
  showLabel = false,
  className = ''
}) => {
  const { 
    downloads, 
    downloadHymn, 
    removeDownload, 
    pauseDownload, 
    resumeDownload,
    isDownloaded 
  } = useOfflineDownloads();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Detectar mudanças de status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [isProcessing, setIsProcessing] = useState(false);

  // Encontrar o download atual
  const currentDownload = downloads.find(d => d.id === hymn.id);
  const downloadStatus = currentDownload?.status || null;
  const downloadProgress = currentDownload?.progress || 0;

  // Tamanhos dos ícones
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Classes base
  const baseClasses = {
    icon: `p-2 rounded-lg transition-all duration-200 ${iconSizes[size]}`,
    button: `flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200`,
    card: `flex items-center gap-3 p-4 rounded-lg border transition-all duration-200`
  };

  // Manipular download
  const handleDownload = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      if (downloadStatus === 'completed') {
        // Remover download
        await removeDownload(hymn.id);
      } else if (downloadStatus === 'downloading') {
        // Pausar download
        pauseDownload(hymn.id);
      } else if (downloadStatus === 'paused' || downloadStatus === 'error') {
        // Retomar download
        await resumeDownload(hymn.id);
      } else {
        // Iniciar download
        await downloadHymn(hymn);
      }
    } catch (error) {
      console.error('Download action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderizar ícone baseado no status
  const renderIcon = () => {
    if (isProcessing) {
      return <RefreshCw className={`${iconSizes[size]} animate-spin`} />;
    }

    switch (downloadStatus) {
      case 'completed':
        return <Check className={iconSizes[size]} />;
      case 'downloading':
        return <Pause className={iconSizes[size]} />;
      case 'error':
        return <X className={iconSizes[size]} />;
      case 'paused':
        return <Download className={iconSizes[size]} />;
      default:
        return <Download className={iconSizes[size]} />;
    }
  };

  // Renderizar texto baseado no status
  const renderText = () => {
    if (isProcessing) return 'Processando...';

    switch (downloadStatus) {
      case 'completed':
        return 'Baixado';
      case 'downloading':
        return `Baixando ${downloadProgress}%`;
      case 'error':
        return 'Tentar novamente';
      case 'paused':
        return 'Pausado';
      default:
        return 'Baixar';
    }
  };

  // Classes de cor baseadas no status
  const getStatusClasses = () => {
    if (!isOnline && !downloadStatus) {
      return {
        button: 'bg-slate-600 text-slate-400 cursor-not-allowed',
        text: 'text-slate-400'
      };
    }

    switch (downloadStatus) {
      case 'completed':
        return {
          button: 'bg-green-600 hover:bg-green-700 text-white',
          text: 'text-green-400'
        };
      case 'downloading':
        return {
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          text: 'text-blue-400'
        };
      case 'error':
        return {
          button: 'bg-red-600 hover:bg-red-700 text-white',
          text: 'text-red-400'
        };
      case 'paused':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          text: 'text-yellow-400'
        };
      default:
        return {
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          text: 'text-emerald-400'
        };
    }
  };

  const statusClasses = getStatusClasses();
  const isDisabled = (!isOnline && !downloadStatus) || isProcessing;

  // Renderizar baseado na variante
  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        className={`
          ${baseClasses.icon} 
          ${statusClasses.button}
          ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
          ${className}
        `}
        title={renderText()}
      >
        {renderIcon()}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        className={`
          ${baseClasses.button}
          ${statusClasses.button}
          ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
          ${className}
        `}
      >
        {renderIcon()}
        {showLabel && <span>{renderText()}</span>}
        
        {/* Barra de progresso para downloads */}
        {downloadStatus === 'downloading' && (
          <div className="ml-2 w-16 bg-white/20 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`
          ${baseClasses.card}
          ${downloadStatus === 'completed' ? 'border-green-500 bg-green-500/10' : 'border-slate-600 bg-slate-800'}
          ${className}
        `}
      >
        <div className={statusClasses.text}>
          {renderIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{renderText()}</span>
            {!isOnline && !downloadStatus && (
              <WifiOff className="w-4 h-4 text-slate-400" />
            )}
          </div>
          
          {/* Barra de progresso */}
          {downloadStatus === 'downloading' && (
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
          
          {/* Informações adicionais */}
          {downloadStatus === 'completed' && (
            <p className="text-xs text-green-400">
              Disponível offline • {currentDownload?.file_size ? `${(currentDownload.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
            </p>
          )}
          
          {downloadStatus === 'error' && currentDownload?.error && (
            <p className="text-xs text-red-400">{currentDownload.error}</p>
          )}
          
          {!isOnline && !downloadStatus && (
            <p className="text-xs text-slate-400">Requer conexão com internet</p>
          )}
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isDisabled}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${statusClasses.button}
            ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          {downloadStatus === 'completed' ? 'Remover' : 'Baixar'}
        </button>
      </div>
    );
  }

  return null;
};

export default DownloadButton;
