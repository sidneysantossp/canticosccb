// ============================================
// YOUTUBE API UTILITIES
// ============================================

export interface YouTubeVideoData {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number; // em segundos
  description: string;
}

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Converte duração ISO 8601 (PT4M13S) para segundos
 */

/**
 * Busca dados de um vídeo do YouTube usando oEmbed (método seguro)
 */
export async function fetchYouTubeVideoData(videoId: string): Promise<YouTubeVideoData | null> {
  try {
    console.log('🎬 Buscando dados para video ID:', videoId);

    // Usar apenas oEmbed (método seguro e confiável)
    console.log('🔄 Tentando oEmbed...');
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oEmbedUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ oEmbed funcionou:', data);
        
        return {
          videoId,
          title: data.title || `Vídeo ${videoId}`,
          thumbnail: data.thumbnail_url || getYouTubeThumbnail(videoId),
          duration: 0, // Será preenchido manualmente
          description: `${data.title} - Defina a duração manualmente`
        };
      }
    } catch (e) {
      console.log('❌ oEmbed falhou:', e);
    }

    // Fallback final
    console.log('🔄 Usando dados básicos...');
    return {
      videoId,
      title: `Vídeo do YouTube ${videoId}`,
      thumbnail: getYouTubeThumbnail(videoId),
      duration: 0, // Será preenchido manualmente
      description: 'Defina título, descrição e duração manualmente'
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados do YouTube:', error);
    return null;
  }
}


/**
 * Gera URL de thumbnail do YouTube
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string {
  const qualityMap = {
    'default': 'default',
    'medium': 'mqdefault', 
    'high': 'hqdefault',
    'maxres': 'maxresdefault'
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Converte URL do YouTube para URL de áudio (usando yt-dlp ou similar)
 * NOTA: Em produção, você precisará de um serviço backend para extrair o áudio
 */
export function getYouTubeAudioUrl(videoId: string): string {
  // Para desenvolvimento, retorna a URL do vídeo
  // Em produção, você deve extrair o áudio usando yt-dlp ou similar
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Formata duração em segundos para HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
