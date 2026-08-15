import { supabase } from '@/lib/supabase-auth'

interface YoutubeImportResult {
  success: boolean
  data?: {
    videoId: string
    titulo: string
    duracao: string
    thumbnailUrl: string
  }
  error?: string
}

function getYoutubeImportUrl(): string {
  const configured = String(import.meta.env.VITE_YOUTUBE_IMPORT_URL || '').trim()
  if (configured) return configured
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
  return `${supabaseUrl}/functions/v1/youtube-import`
}

export async function youtubeImport(youtubeUrl: string): Promise<YoutubeImportResult> {
  const url = youtubeUrl.trim()
  if (!url || url.length > 500) return { success: false, error: 'URL do YouTube inválida' }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { success: false, error: 'Faça login para importar vídeos do YouTube' }

  try {
    const response = await fetch(getYoutubeImportUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: String(import.meta.env.VITE_SUPABASE_ANON_KEY || ''),
      },
      body: JSON.stringify({ youtubeUrl: url }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.success !== true) {
      return { success: false, error: payload?.error || 'Não foi possível importar o vídeo' }
    }
    return { success: true, data: { ...payload.data, thumbnailUrl: payload.data?.thumbnailUrl || '' } }
  } catch (error: any) {
    console.error('Erro no YouTube import:', error)
    return { success: false, error: error?.message || 'Erro ao processar vídeo do YouTube' }
  }
}

export default youtubeImport
