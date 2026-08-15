import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://www.canticosccb.com.br',
  'https://canticosccb.com.br',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])
const RATE_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const requestsByUser = new Map<string, { count: number; windowStartedAt: number }>()

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get('CORS_ALLOWED_ORIGINS') || '').split(',').map((value) => value.trim()).filter(Boolean)
  return new Set(configured.length > 0 ? configured : [...DEFAULT_ALLOWED_ORIGINS])
}
function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
  if (origin && allowedOrigins().has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}
function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })
}
function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('origin') || ''
  return !origin || allowedOrigins().has(origin)
}
function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const current = requestsByUser.get(userId)
  if (!current || now - current.windowStartedAt >= RATE_WINDOW_MS) {
    requestsByUser.set(userId, { count: 1, windowStartedAt: now })
    return false
  }
  current.count += 1
  return current.count > MAX_REQUESTS_PER_WINDOW
}
function extractVideoId(value: string): string | null {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    let id = ''
    if (hostname === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || ''
    if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'm.youtube.com') {
      id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || ''
    }
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null
    return id
  } catch {
    return null
  }
}
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
async function getAuthenticatedUser(req: Request): Promise<{ id: string; isAdmin: boolean; isComposer: boolean } | null> {
  const authorization = req.headers.get('authorization') || ''
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  if (!supabaseUrl || !anonKey) return null
  const authResponse = await fetchWithTimeout(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } })
  if (!authResponse.ok) return null
  const authUser = await authResponse.json()
  if (!authUser?.id) return null
  const profileResponse = await fetchWithTimeout(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(authUser.id)}&select=is_admin,is_composer,status,is_blocked&limit=1`, { headers: { apikey: anonKey, Authorization: authorization } })
  if (!profileResponse.ok) return null
  const rows = await profileResponse.json()
  const profile = rows[0]
  if (!profile || profile.status !== 'active' || profile.is_blocked === true) return null
  return { id: authUser.id, isAdmin: profile.is_admin === true, isComposer: profile.is_composer === true }
}
async function getVideoMetadata(videoId: string) {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const supabaseKey = serviceKey || anonKey
  if (!supabaseUrl || !supabaseKey) throw new Error('Configuração do Supabase ausente')
  const configRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/site_config?config_key=eq.youtube_api_key&select=config_value&limit=1`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } })
  if (!configRes.ok) throw new Error('Falha ao carregar a configuração do YouTube')
  const configRows = await configRes.json()
  const apiKey = configRows?.[0]?.config_value || ''
  if (!apiKey) throw new Error('YouTube API Key não configurada')
  const response = await fetchWithTimeout(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`)
  if (!response.ok) throw new Error('Erro ao buscar metadados do YouTube')
  const data = await response.json()
  if (!data.items || data.items.length === 0) throw new Error('Vídeo não encontrado')
  const video = data.items[0]
  return { title: video.snippet.title, duration: parseDuration(video.contentDetails.duration), thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url }
}
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
}
function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

serve(async (req) => {
  if (!isOriginAllowed(req)) return json(req, { success: false, error: 'Origem não permitida' }, 403)
  if (req.method === 'OPTIONS') return new Response('ok', { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { success: false, error: 'Método não permitido' }, 405)
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return json(req, { success: false, error: 'Sessão inválida' }, 401)
    if (!user.isAdmin && !user.isComposer) return json(req, { success: false, error: 'Usuário sem permissão' }, 403)
    if (isRateLimited(user.id)) return json(req, { success: false, error: 'Limite de requisições excedido. Tente novamente em instantes.' }, 429)
    const body = await req.json()
    const youtubeUrl = typeof body?.youtubeUrl === 'string' ? body.youtubeUrl.trim() : ''
    if (youtubeUrl.length > 500) return json(req, { success: false, error: 'URL inválida' }, 400)
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) return json(req, { success: false, error: 'URL do YouTube inválida' }, 400)
    const metadata = await getVideoMetadata(videoId)
    return json(req, { success: true, data: { videoId, titulo: metadata.title, duracao: formatDuration(metadata.duration), thumbnailUrl: metadata.thumbnail } })
  } catch (error) {
    console.error('Erro no YouTube import:', error)
    return json(req, { success: false, error: 'Não foi possível obter os metadados do vídeo' }, 502)
  }
})
