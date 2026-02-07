import React, { useState } from 'react'
import { Youtube, Import, Loader, AlertCircle } from 'lucide-react'

interface YoutubeMetadata {
  videoId: string
  titulo: string
  duracao: string
  thumbnailUrl: string
}

interface YoutubeImportFormProps {
  onImport: (metadata: YoutubeMetadata) => void
  isLoading?: boolean
}

const YoutubeImportForm: React.FC<YoutubeImportFormProps> = ({ 
  onImport, 
  isLoading = false 
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<YoutubeMetadata | null>(null)

  const handleImport = async () => {
    if (!youtubeUrl.trim()) {
      setError('Digite uma URL do YouTube')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      // Importar a função de API
      const { default: youtubeImport } = await import('@/pages/api/youtube-import')
      
      const result = await youtubeImport(youtubeUrl)

      if (!result.success) {
        throw new Error(result.error || 'Erro ao importar vídeo')
      }

      setMetadata(result.data)
      onImport(result.data)
    } catch (error: any) {
      console.error('Erro na importação:', error)
      setError(error.message || 'Erro ao importar vídeo do YouTube')
    } finally {
      setIsImporting(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value)
    setError(null)
    if (metadata) {
      setMetadata(null)
    }
  }

  const getYoutubeVideoId = (url: string) => {
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

  const videoId = getYoutubeVideoId(youtubeUrl)
  const isValidUrl = videoId && youtubeUrl.includes('youtube.com')

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Youtube className="w-6 h-6 text-red-500" />
        <h3 className="text-xl font-bold text-white">Importar do YouTube</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm font-semibold mb-2">
            URL do Vídeo do YouTube
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
              disabled={isImporting || isLoading}
            />
            <button
              onClick={handleImport}
              disabled={!isValidUrl || isImporting || isLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Import className="w-4 h-4" />
                  Importar
                </>
              )}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Cole a URL de um vídeo do YouTube para importar título, duração e thumbnail automaticamente
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {metadata && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">Vídeo encontrado!</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <img 
                  src={metadata.thumbnailUrl} 
                  alt="Thumbnail" 
                  className="w-16 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="text-white font-medium truncate">{metadata.titulo}</p>
                  <p className="text-gray-400">Duração: {metadata.duracao}</p>
                </div>
              </div>
            </div>
            <p className="text-green-400 text-xs mt-2">
              ✓ Metadados importados com sucesso! Preencha o restante do formulário.
            </p>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-gray-400 font-semibold mb-2 text-sm">URLs suportadas:</h4>
          <div className="space-y-1 text-xs text-gray-500 font-mono">
            <div>• https://youtube.com/watch?v=VIDEO_ID</div>
            <div>• https://youtu.be/VIDEO_ID</div>
            <div>• https://youtube.com/embed/VIDEO_ID</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YoutubeImportForm
