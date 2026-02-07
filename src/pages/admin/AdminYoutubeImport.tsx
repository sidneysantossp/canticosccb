import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Music, Upload, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { hinosApi, uploadApi, categoriasApi, type Categoria } from '@/lib/api-client'
import YoutubeImportForm from '@/components/admin/YoutubeImportForm'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import '@/styles/quill-custom.css'

interface YoutubeMetadata {
  videoId: string
  titulo: string
  duracao: string
  thumbnailUrl: string
}

const AdminYoutubeImport: React.FC = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    numero: 0,
    titulo: '',
    categorias: [] as string[],
    compositor: '',
    cover_url: '',
    audio_url: '',
    duracao: '',
    letra: '',
    ativo: 1,
    youtube_source: '' // Campo oculto para rastreamento interno
  })

  const [youtubeMetadata, setYoutubeMetadata] = useState<YoutubeMetadata | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false)

  // Configuração do editor Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ]

  React.useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const res = await categoriasApi.list({ limit: 1000 })
      if (res.data) {
        const payload: any = res.data
        const arr = payload.categorias || payload.data || payload
        setCategories(Array.isArray(arr) ? arr : [])
      } else {
        setCategories([])
      }
    } catch (e) {
      console.error('Erro ao carregar categorias:', e)
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleYoutubeImport = (metadata: YoutubeMetadata) => {
    setYoutubeMetadata(metadata)
    setFormData(prev => ({
      ...prev,
      titulo: metadata.titulo,
      duracao: metadata.duracao,
      cover_url: metadata.thumbnailUrl,
      youtube_source: metadata.videoId // Armazenar apenas o ID
    }))
    setCoverPreview(metadata.thumbnailUrl)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      // Extrair duração automaticamente
      try {
        const url = URL.createObjectURL(file)
        const audio = new Audio()
        audio.src = url
        audio.addEventListener('loadedmetadata', () => {
          if (!isNaN(audio.duration)) {
            const total = Math.floor(audio.duration)
            const mm = String(Math.floor(total / 60)).padStart(2, '0')
            const ss = String(total % 60).padStart(2, '0')
            setFormData((prev) => ({ ...prev, duracao: `${mm}:${ss}` }))
          }
          URL.revokeObjectURL(url)
        }, { once: true })
      } catch {}
    }
  }

  const uploadCover = async (file: File): Promise<string | null> => {
    try {
      const response = await uploadApi.uploadCover(file)
      if (response.url) {
        return response.url
      }
      return null
    } catch (error) {
      console.error('Erro ao fazer upload da capa:', error)
      return null
    }
  }

  const uploadAudio = async (file: File): Promise<string | null> => {
    try {
      const response = await uploadApi.uploadAudio(file)
      if (response.url) {
        return response.url
      }
      return null
    } catch (error) {
      console.error('Erro ao fazer upload do áudio:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validação mínima
    if (!formData.titulo || !String(formData.titulo).trim()) {
      setIsSubmitting(false)
      setError('Título é obrigatório.')
      return
    }
    
    if (formData.categorias.length === 0) {
      setIsSubmitting(false)
      setError('Selecione pelo menos uma categoria.')
      return
    }

    if (!youtubeMetadata && !audioFile) {
      setIsSubmitting(false)
      setError('Importe um vídeo do YouTube ou faça upload de um arquivo de áudio.')
      return
    }

    try {
      let coverUrl = formData.cover_url
      let audioUrl = formData.audio_url

      // Upload de capa se houver
      if (coverFile) {
        const uploaded = await uploadCover(coverFile)
        if (uploaded) coverUrl = uploaded
      }

      // Upload de áudio se houver
      if (audioFile) {
        const uploaded = await uploadAudio(audioFile)
        if (uploaded) audioUrl = uploaded
      }

      const hinoData: Record<string, any> = {
        titulo: formData.titulo.trim(),
        categorias: formData.categorias,
        categoria: formData.categorias[0] || '',
        ativo: formData.ativo,
      }
      if (formData.numero) hinoData.numero = formData.numero
      if (formData.compositor?.trim()) hinoData.compositor_nome = formData.compositor.trim()
      if (coverUrl) hinoData.cover_url = coverUrl
      if (audioUrl) hinoData.audio_url = audioUrl
      if (formData.duracao) hinoData.duracao = formData.duracao
      if (formData.letra) hinoData.letra = formData.letra
      if (formData.youtube_source) hinoData.youtube_source = formData.youtube_source

      const response = await hinosApi.create(hinoData)

      if (response.error) {
        throw new Error(response.error)
      }

      alert('Hino salvo com sucesso!')
      navigate('/admin/hinos')
    } catch (error: any) {
      console.error('Erro ao salvar hino:', error)
      setError(error?.message || 'Erro ao salvar hino')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/hinos"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Importar Hino do YouTube
            </h1>
            <p className="text-gray-400 mt-1">
              Importe um hino diretamente do YouTube e complete as informações
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube Import */}
          <YoutubeImportForm 
            onImport={handleYoutubeImport}
            isLoading={isSubmitting}
          />

          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Informações do Hino
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Número do Hino</label>
                <input
                  type="number"
                  value={formData.numero || ''}
                  onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Status *</label>
                <select
                  value={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  required
                >
                  <option value="1">Publicado</option>
                  <option value="0">Rascunho</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-semibold mb-2">Título do Hino *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                placeholder="Ex: Coro Celeste"
                required
              />
              {youtubeMetadata && (
                <p className="text-green-400 text-xs mt-1">✓ Importado do YouTube</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Categorias *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-3">
                  {loadingCategories ? (
                    <div className="text-gray-400 text-sm">Carregando categorias...</div>
                  ) : categories.length === 0 ? (
                    <div className="text-gray-400 text-sm">Nenhuma categoria encontrada</div>
                  ) : (
                    categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.categorias.includes(cat.nome)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ 
                                ...formData, 
                                categorias: [...formData.categorias, cat.nome] 
                              });
                            } else {
                              setFormData({ 
                                ...formData, 
                                categorias: formData.categorias.filter(c => c !== cat.nome) 
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-green-500 focus:ring-green-600"
                        />
                        <span className="text-white text-sm">{cat.nome}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {formData.categorias.length === 0 
                    ? 'Selecione pelo menos uma categoria' 
                    : `${formData.categorias.length} ${formData.categorias.length === 1 ? 'categoria' : 'categorias'} selecionada${formData.categorias.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Compositor</label>
                <input
                  type="text"
                  value={formData.compositor}
                  onChange={(e) => setFormData({ ...formData, compositor: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Nome do compositor"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duração
              </label>
              <input
                type="text"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                placeholder="3:45"
              />
              {youtubeMetadata && (
                <p className="text-green-400 text-xs mt-1">✓ Importado do YouTube</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Formato: mm:ss (ex: 3:45)
              </p>
            </div>
          </div>

          {/* Arquivos e Mídia */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Arquivos e Mídia
            </h2>

            <div className="space-y-4">
              {/* Capa */}
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Capa do Hino</label>
                <div className="flex items-start gap-6">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Capa"
                      className="w-32 h-32 rounded-lg object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Music className="w-12 h-12 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center h-32 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-400 text-sm">
                        {coverFile ? coverFile.name : youtubeMetadata ? 'Thumbnail importada - clique para alterar' : 'Arraste uma imagem ou clique para selecionar'}
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        PNG, JPG (máx. 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                    {youtubeMetadata && (
                      <p className="text-green-400 text-xs mt-1">✓ Thumbnail importada do YouTube</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Áudio */}
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">Arquivo de Áudio</label>
                <label className="flex flex-col items-center justify-center h-24 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-600 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-sm">
                    {audioFile ? audioFile.name : youtubeMetadata ? 'Áudio será processado - ou faça upload manual' : 'Selecionar arquivo de áudio'}
                  </span>
                  <span className="text-gray-500 text-xs mt-1">
                    MP3, WAV (máx. 50MB)
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                    className="hidden"
                  />
                </label>
                {youtubeMetadata && !audioFile && (
                  <p className="text-green-400 text-xs mt-1">
                    ✓ O áudio será reproduzido diretamente do YouTube (player oculto). Upload de arquivo é opcional.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Letra do Hino */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Letra do Hino</h2>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">Letra Completa</label>
              <div className="bg-white rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.letra}
                  onChange={(content) => setFormData({ ...formData, letra: content })}
                  modules={modules}
                  formats={formats}
                  placeholder="Cole a letra completa do hino aqui..."
                  className="h-96"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Use o editor para formatar a letra com quebras de linha, negrito, etc.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/hinos"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Hino</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminYoutubeImport
