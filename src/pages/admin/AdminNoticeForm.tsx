import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Megaphone, Loader2 } from 'lucide-react';
import { noticesApi } from '@/lib/noticesApi';

const AdminNoticeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      loadNotice(id);
    } else {
      // Data automática para novo aviso
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const local = new Date(now.getTime() - offset);
      setPublishedAt(local.toISOString().slice(0, 16));
    }
  }, [id]);

  const loadNotice = async (noticeId: string) => {
    setLoading(true);
    try {
      const notice = await noticesApi.getByIdAdmin(noticeId);
      if (notice) {
        setTitle(notice.title);
        setContent(notice.content);
        setIsActive(notice.is_active);
        // Converter para datetime-local format
        const date = new Date(notice.published_at);
        const offset = date.getTimezoneOffset() * 60000;
        const local = new Date(date.getTime() - offset);
        setPublishedAt(local.toISOString().slice(0, 16));
      } else {
        setError('Aviso não encontrado.');
      }
    } catch (err) {
      console.error('Erro ao carregar aviso:', err);
      setError('Erro ao carregar aviso.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }
    if (!content.trim()) {
      setError('O conteúdo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
        published_at: new Date(publishedAt).toISOString(),
        is_active: isActive,
      };

      if (isEditing && id) {
        const success = await noticesApi.update(id, data);
        if (success) {
          navigate('/admin/notices');
        } else {
          setError('Erro ao atualizar aviso.');
        }
      } else {
        const result = await noticesApi.create(data);
        if (result) {
          navigate('/admin/notices');
        } else {
          setError('Erro ao criar aviso.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar aviso.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3" />
          <div className="h-12 bg-gray-700 rounded" />
          <div className="h-48 bg-gray-700 rounded" />
          <div className="h-12 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/admin/notices"
          className="p-2 rounded-lg bg-background-secondary text-gray-400 hover:text-white hover:bg-background-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Megaphone className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Editar Aviso' : 'Cadastrar Aviso'}
            </h1>
            <p className="text-text-muted text-sm">
              {isEditing ? 'Altere as informações do aviso' : 'Preencha os dados do novo aviso'}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Título do Aviso *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Manutenção programada para o dia 15/02"
            className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
            required
          />
        </div>

        {/* Conteúdo */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            Conteúdo do Aviso *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o conteúdo completo do aviso aqui..."
            rows={12}
            className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-y"
            required
          />
        </div>

        {/* Data de Publicação */}
        <div>
          <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-300 mb-2">
            Data de Publicação
          </label>
          <input
            id="publishedAt"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">A data é preenchida automaticamente, mas pode ser alterada.</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
          </label>
          <span className="text-sm text-gray-300">
            {isActive ? 'Aviso ativo (visível para todos)' : 'Aviso inativo (oculto)'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Aviso'}
          </button>
          <Link
            to="/admin/notices"
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AdminNoticeForm;
