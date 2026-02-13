import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Music } from 'lucide-react';
import {
  fetchCifraById,
  createCifra,
  updateCifra,
  Cifra,
  INSTRUMENTS,
  CATEGORIES,
  ALL_KEYS,
} from '@/api/cifras';
import { isChordLine, isSectionLine } from '@/utils/chordUtils';

const AdminCifraForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id && id !== 'new';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    title: '',
    artist: '',
    slug: '',
    content: '',
    original_key: 'C',
    instrument: 'violao',
    capo: 0,
    cover_url: '',
    hino_id: '',
    category: 'avulsos',
    is_active: true,
  });

  useEffect(() => {
    if (isEditing) {
      loadCifra();
    }
  }, [id]);

  const loadCifra = async () => {
    try {
      setIsLoading(true);
      const cifra = await fetchCifraById(Number(id));
      if (cifra) {
        setForm({
          title: cifra.title,
          artist: cifra.artist,
          slug: cifra.slug,
          content: cifra.content,
          original_key: cifra.original_key,
          instrument: cifra.instrument,
          capo: cifra.capo,
          cover_url: cifra.cover_url || '',
          hino_id: cifra.hino_id || '',
          category: cifra.category,
          is_active: cifra.is_active,
        });
      } else {
        setError('Cifra não encontrada');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar cifra');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('O título é obrigatório');
      return;
    }
    if (!form.content.trim()) {
      setError('O conteúdo da cifra é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        title: form.title.trim(),
        artist: form.artist.trim(),
        slug: form.slug || generateSlug(form.title),
        content: form.content,
        original_key: form.original_key,
        instrument: form.instrument,
        capo: form.capo,
        cover_url: form.cover_url || null,
        hino_id: form.hino_id || null,
        category: form.category,
        is_active: form.is_active,
        created_by: null,
      };

      if (isEditing) {
        await updateCifra(Number(id), payload);
      } else {
        await createCifra(payload);
      }

      navigate('/admin/cifras');
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar cifra');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPreview = () => {
    const lines = form.content.split('\n');
    return (
      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {lines.map((line, idx) => {
          if (isSectionLine(line)) {
            return (
              <div key={idx} className="text-white font-bold mt-6 mb-2 text-base">
                {line}
              </div>
            );
          }
          if (isChordLine(line)) {
            return (
              <div key={idx} className="text-primary-400 font-bold">
                {line}
              </div>
            );
          }
          return (
            <div key={idx} className="text-gray-200">
              {line || '\u00A0'}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/cifras')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Editar Cifra' : 'Nova Cifra'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isEditing ? 'Atualize os dados da cifra' : 'Preencha os dados para criar uma nova cifra'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Ex: Ester"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Artista / Compositor</label>
              <input
                type="text"
                value={form.artist}
                onChange={e => setForm(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="Ex: Hinos Avulsos CCB"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="ex: ester"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-gray-500 text-xs mt-1">URL: /cifra/{form.slug || 'slug'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imagem de Capa (URL)</label>
              <input
                type="text"
                value={form.cover_url}
                onChange={e => setForm(prev => ({ ...prev, cover_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Music Settings */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Configurações Musicais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Instrumento</label>
              <select
                value={form.instrument}
                onChange={e => setForm(prev => ({ ...prev, instrument: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {INSTRUMENTS.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tom Original</label>
              <select
                value={form.original_key}
                onChange={e => setForm(prev => ({ ...prev, original_key: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ALL_KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Capotraste</label>
              <select
                value={form.capo}
                onChange={e => setForm(prev => ({ ...prev, capo: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i} value={i}>{i === 0 ? 'Sem capo' : `${i}ª casa`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cifra Content */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Conteúdo da Cifra *</h2>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Editor' : 'Preview'}
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Formato: Acordes em linhas separadas acima da letra. Use [Intro], [Refrão], [Primeira Parte] etc. para marcar seções.
          </p>

          {showPreview ? (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 min-h-[400px] overflow-auto">
              {form.content ? (
                <>
                  <div className="mb-4">
                    <span className="text-gray-400 text-sm">Tom: </span>
                    <span className="text-primary-400 font-bold">{form.original_key}</span>
                  </div>
                  {renderPreview()}
                </>
              ) : (
                <p className="text-gray-500">Nenhum conteúdo para visualizar</p>
              )}
            </div>
          ) : (
            <textarea
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder={`[Intro] G  D  Em  C\n\n[Primeira Parte]\n\n G                    D\nSe você, está pensando em desistir\n Em                C\nOlha bem pra mim, Deus manda te falar\n\n[Refrão]\n\n  G        D            Em\nMas, hoje Deus te fala: "eu te chamo de Ester"`}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm leading-relaxed min-h-[400px] resize-y"
              required
            />
          )}
        </div>

        {/* Status */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Status</h2>
              <p className="text-gray-400 text-sm">Cifras inativas não aparecem para os usuários</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              <span className="ml-3 text-sm text-gray-300">{form.is_active ? 'Ativa' : 'Inativa'}</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/cifras')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Cifra'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCifraForm;
