// API endpoint para YouTube Import (Vite/React)
export async function youtubeImport(youtubeUrl: string) {
  try {
    if (!youtubeUrl) {
      throw new Error('URL do YouTube é obrigatória')
    }

    // Extrair video ID da URL
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      throw new Error('URL do YouTube inválida')
    }

    // Obter metadados do vídeo
    const metadata = await getVideoMetadata(videoId)
    
    // Retornar metadados para preencher formulário
    return {
      success: true,
      data: {
        videoId,
        titulo: metadata.title,
        duracao: formatDuration(metadata.duration),
        thumbnailUrl: metadata.thumbnail,
      }
    }
  } catch (error: any) {
    console.error('Erro no YouTube import:', error)
    return { 
      success: false, 
      error: error.message || 'Erro ao processar vídeo do YouTube' 
    }
  }
}

// Para uso com fetch no frontend
export { youtubeImport as default }

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

async function getVideoMetadata(videoId: string) {
  // Buscar YouTube API Key do Supabase (site_config)
  const { supabaseFetch } = await import('@/lib/supabaseRest')
  const rows = await supabaseFetch<any>('site_config', {
    config_key: 'eq.youtube_api_key',
    select: 'config_value',
    limit: '1',
  })
  
  const apiKey = rows.length > 0 ? rows[0].config_value : ''
  if (!apiKey) {
    throw new Error('YouTube API Key não configurada. Configure em Configurações > Integrações.')
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Erro ao buscar metadados do YouTube')
  }
  
  const data = await response.json()
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Vídeo não encontrado')
  }
  
  const video = data.items[0]
  const title = video.snippet.title
  const duration = parseDuration(video.contentDetails.duration)
  const thumbnail = video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url
  
  return { title, duration, thumbnail }
}

function parseDuration(duration: string): number {
  // PT4M13S -> 253 segundos
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
