// Formatadores para PWA e sistema de downloads

/**
 * Formatar duração em segundos para MM:SS ou HH:MM:SS
 */
export const formatDuration = (seconds: number | string): string => {
  const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  
  if (isNaN(num) || num < 0) return '0:00';
  
  const hours = Math.floor(num / 3600);
  const minutes = Math.floor((num % 3600) / 60);
  const secs = Math.floor(num % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formatar tamanho de arquivo em bytes para formato legível
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Formatar velocidade de download
 */
export const formatDownloadSpeed = (bytesPerSecond: number): string => {
  return `${formatFileSize(bytesPerSecond)}/s`;
};

/**
 * Formatar tempo restante em segundos
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

/**
 * Formatar data relativa (há X tempo)
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'Agora mesmo';
  } else if (diffMinutes < 60) {
    return `Há ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `Há ${diffHours}h`;
  } else if (diffDays < 7) {
    return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  } else if (diffWeeks < 4) {
    return `Há ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
  } else if (diffMonths < 12) {
    return `Há ${diffMonths} m${diffMonths > 1 ? 'eses' : 'ês'}`;
  } else {
    return `Há ${diffYears} ano${diffYears > 1 ? 's' : ''}`;
  }
};

/**
 * Formatar porcentagem
 */
export const formatPercentage = (value: number, decimals = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatar número com separadores de milhares
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

/**
 * Truncar texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Formatar categoria de hino
 */
export const formatCategory = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'cantados': 'Hinos Cantados',
    'tocados': 'Hinos Tocados',
    'avulsos': 'Hinos Avulsos',
    'especiais': 'Hinos Especiais',
    'infantis': 'Hinos Infantis',
    'jovens': 'Hinos de Jovens'
  };
  
  return categoryMap[category.toLowerCase()] || category;
};

/**
 * Gerar cor baseada em string (para avatars, etc)
 */
export const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

/**
 * Validar URL de áudio
 */
export const isValidAudioUrl = (url: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
  const urlLower = url.toLowerCase();
  
  return audioExtensions.some(ext => urlLower.includes(ext)) || 
         urlLower.includes('audio') ||
         urlLower.includes('stream');
};

/**
 * Obter extensão de arquivo de URL
 */
export const getFileExtensionFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    return extension || '';
  } catch {
    return '';
  }
};

/**
 * Formatar qualidade de áudio
 */
export const formatAudioQuality = (bitrate?: number): string => {
  if (!bitrate) return 'Padrão';
  
  if (bitrate >= 320) return 'Alta (320 kbps)';
  if (bitrate >= 256) return 'Boa (256 kbps)';
  if (bitrate >= 192) return 'Média (192 kbps)';
  if (bitrate >= 128) return 'Básica (128 kbps)';
  
  return `${bitrate} kbps`;
};

/**
 * Calcular progresso de download
 */
export const calculateDownloadProgress = (loaded: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((loaded / total) * 100);
};

/**
 * Estimar tempo restante de download
 */
export const estimateDownloadTime = (loaded: number, total: number, speed: number): number => {
  if (speed === 0 || loaded >= total) return 0;
  
  const remaining = total - loaded;
  return remaining / speed;
};

/**
 * Formatar status de conexão
 */
export const formatConnectionStatus = (isOnline: boolean, lastSync?: Date): string => {
  if (isOnline) {
    return 'Online';
  }
  
  if (lastSync) {
    return `Offline • Última sincronização: ${formatRelativeTime(lastSync)}`;
  }
  
  return 'Offline';
};

/**
 * Validar se dispositivo suporta PWA
 */
export const isPWASupported = (): boolean => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
};

/**
 * Detectar tipo de dispositivo
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  // Primeiro verificar se é touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Verificar largura da tela
  const screenWidth = window.innerWidth || screen.width;
  
  // User agent
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Mobile: touch + tela pequena OU user agent mobile
  if ((isTouchDevice && screenWidth < 768) || 
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  // Tablet: touch + tela média OU user agent tablet
  if ((isTouchDevice && screenWidth >= 768 && screenWidth < 1024) || 
      /tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  
  return 'desktop';
};

/**
 * Formatar informações do dispositivo para analytics
 */
export const getDeviceInfo = () => {
  return {
    type: getDeviceType(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};
