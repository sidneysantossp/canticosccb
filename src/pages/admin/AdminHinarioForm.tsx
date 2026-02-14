import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, BookOpen } from 'lucide-react';
import { fetchHinarioById, parseVerses, HINARIO_CATEGORIES } from '@/api/hinario';
import { supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';

const AdminHinarioForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id && id !== 'new';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    numero: 0,
    titulo: '',
    subtitulo: '',
    conteudo: '',
    categoria: 'hinario5',
    tags: '',
    is_active: true,
  });

  useEffect(() => {
    if (isEditing) loadHymn();
  }, [id]);

  const loadHymn = async () => {
    try {
      setIsLoading(true);
      const hymn = await fetchHinarioById(Number(id));
      if (hymn) {
        setForm({
          numero: hymn.numero,
          titulo: hymn.titulo,
          subtitulo: hymn.subtitulo || '',
          conteudo: hymn.conteudo,
          categoria: hymn.categoria,
          tags: hymn.tags || '',
          is_active: hymn.is_active,
        });
      } else {
        setError('Hino não encontrado');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar hino');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setError('O título é obrigatório'); return; }
    if (!form.conteudo.trim()) { setError('O conteúdo é obrigatório'); return; }
    if (form.numero <= 0) { setError('O número do hino é obrigatório'); return; }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        numero: form.numero,
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo.trim() || null,
        conteudo: form.conteudo,
        categoria: form.categoria,
        tags: form.tags.trim() || null,
        is_active: form.is_active,
      };

      if (isEditing) {
        await supabaseUpdate('hinario', { id: `eq.${id}` }, payload);
      } else {
        await supabaseInsert('hinario', payload);
      }

      navigate('/admin/hinario');
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar hino');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPreview = () => {
    const verses = parseVerses(form.conteudo);
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">{form.numero} - {form.titulo}</h2>
        {verses.map((verse, idx) => (
          <div key={idx} className="flex gap-4">
            {verse.number !== null && (
              <span className="text-primary-400 font-semibold flex-shrink-0 w-8 text-right">
                {verse.number}.
              </span>
            )}
            <div className={`text-gray-200 leading-relaxed ${verse.number === null ? 'pl-12 italic text-gray-400' : ''}`}>
              {verse.lines.map((line, li) => (
                <div key={li}>{line || '\u00A0'}</div>
              ))}
            </div>
          </div>
        ))}
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
          onClick={() => navigate('/admin/hinario')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Editar Hino' : 'Novo Hino do Hinário'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isEditing ? 'Atualize os dados do hino' : 'Preencha os dados para adicionar um hino ao hinário'}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Número do Hino *</label>
              <input
                type="number"
                min={1}
                value={form.numero || ''}
                onChange={e => setForm(prev => ({ ...prev, numero: Number(e.target.value) }))}
                placeholder="Ex: 1"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Cristo meu Mestre e meu Senhor"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subtítulo</label>
              <input
                type="text"
                value={form.subtitulo}
                onChange={e => setForm(prev => ({ ...prev, subtitulo: e.target.value }))}
                placeholder="Ex: Salmo 23"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
              <select
                value={form.categoria}
                onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {HINARIO_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Ex: salmo, louvor"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Letra do Hino *</h2>
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
            Separe cada verso com uma linha em branco. Inicie cada verso com o número seguido de ponto (ex: "1. Cristo meu Mestre...").
          </p>

          {showPreview ? (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 min-h-[400px] overflow-auto">
              {form.conteudo ? renderPreview() : (
                <p className="text-gray-500">Nenhum conteúdo para visualizar</p>
              )}
            </div>
          ) : (
            <textarea
              value={form.conteudo}
              onChange={e => setForm(prev => ({ ...prev, conteudo: e.target.value }))}
              placeholder={`1. Cristo meu Mestre e meu Senhor,\nEu Te adoro, por fé, com fervor;\nRogo que guardes meu coração;\nVem protegê-lo, com Tua unção\nE defendê-lo, ó meu Guardião.\n\n2. Mestre divino, sempre senti\nMeu coração dependente de Ti;\nBom fundamento dá-lhe, Senhor,\nDá-lhe firmeza, virtude, valor\nE fortaleza, ó meu Protetor.`}
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
              <p className="text-gray-400 text-sm">Hinos inativos não aparecem para os usuários</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              <span className="ml-3 text-sm text-gray-300">{form.is_active ? 'Ativo' : 'Inativo'}</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/hinario')}
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
            {isSaving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Hino'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminHinarioForm;
