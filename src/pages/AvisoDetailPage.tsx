import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Megaphone, ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { noticesApi, PlatformNotice } from '@/lib/noticesApi';
import SEOHead from '@/components/SEO/SEOHead';

const stripText = (value: string, maxLength = 155) => {
  const normalized = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

const AvisoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<PlatformNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) loadNotice(id);
  }, [id]);

  const loadNotice = async (noticeId: string) => {
    setLoading(true);
    try {
      const data = await noticesApi.getById(noticeId);
      if (data) {
        setNotice(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao carregar aviso:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };


  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-8" />
          <div className="h-8 bg-gray-700 rounded w-2/3 mb-4" />
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-700 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !notice) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <SEOHead
          title="Aviso não encontrado - Cânticos CCB"
          description="O aviso solicitado não foi encontrado."
          canonical={id ? `/avisos/${id}` : '/avisos'}
          noindex
          nofollow
        />

        <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Aviso não encontrado</h2>
        <p className="text-text-muted mb-6">Este aviso pode ter sido removido ou não existe.</p>
        <Link
          to="/avisos"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Avisos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <SEOHead
        title={`${notice.title} - Avisos`}
        description={stripText(notice.content)}
        canonical={`/avisos/${notice.id}`}
        ogType="website"
        schemaData={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: notice.title,
          description: stripText(notice.content),
          datePublished: notice.published_at,
          dateModified: notice.updated_at || notice.published_at,
          author: {
            '@type': 'Organization',
            name: 'Cânticos CCB',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Cânticos CCB',
          },
          inLanguage: 'pt-BR',
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link to="/" className="hover:text-white transition-colors">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/avisos" className="hover:text-white transition-colors">Avisos</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white truncate max-w-[200px]">{notice.title}</span>
      </nav>

      {/* Article */}
      <article>
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
          {notice.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Calendar className="w-4 h-4 text-green-500" />
            <span>Publicado em {formatDateTime(notice.published_at)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-green max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
          {notice.content}
        </div>
      </article>

      {/* Back Link */}
      <div className="mt-12 pt-6 border-t border-gray-800">
        <Link
          to="/avisos"
          className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Avisos
        </Link>
      </div>
    </div>
  );
};

export default AvisoDetailPage;
