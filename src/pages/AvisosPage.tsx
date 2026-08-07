import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';
import { noticesApi, PlatformNotice } from '@/lib/noticesApi';
import SEOHead from '@/components/SEO/SEOHead';

const ITEMS_PER_PAGE = 15;
const READ_NOTICES_KEY = 'canticos_read_notices';

const getReadNotices = (): Set<string> => {
  try {
    const stored = localStorage.getItem(READ_NOTICES_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
};

const saveReadNotices = (ids: Set<string>) => {
  localStorage.setItem(READ_NOTICES_KEY, JSON.stringify([...ids]));
};

const AvisosPage: React.FC = () => {
  const [notices, setNotices] = useState<PlatformNotice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(getReadNotices);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    loadNotices();
  }, [page]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const result = await noticesApi.listPublic(page, ITEMS_PER_PAGE);
      setNotices(result.notices);
      setTotal(result.total);
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = useCallback((e: React.MouseEvent, noticeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(noticeId)) {
        next.delete(noticeId);
      } else {
        next.add(noticeId);
      }
      saveReadNotices(next);
      return next;
    });
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getExcerpt = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <SEOHead
        title="Avisos - Cânticos CCB"
        description="Comunicados, novidades e atualizações oficiais da plataforma Cânticos CCB."
        keywords="avisos Cânticos CCB, comunicados CCB, novidades Cânticos CCB"
        canonical="/avisos"
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-green-500/10 rounded-xl">
          <Megaphone className="w-7 h-7 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Avisos</h1>
          <p className="text-text-muted text-sm">Comunicados e novidades da plataforma</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-background-secondary rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && notices.length === 0 && (
        <div className="text-center py-16">
          <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Nenhum aviso no momento</h2>
          <p className="text-text-muted">Quando houver novidades, elas aparecerão aqui.</p>
        </div>
      )}

      {/* Notices List */}
      {!loading && notices.length > 0 && (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isRead = readIds.has(notice.id);
            return (
              <div key={notice.id} className="relative">
                {/* Checkbox */}
                <button
                  onClick={(e) => toggleRead(e, notice.id)}
                  className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    isRead
                      ? 'bg-green-500 border-green-500'
                      : 'bg-transparent border-gray-500 hover:border-green-400'
                  }`}
                  title={isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                >
                  {isRead && <Check className="w-4 h-4 text-black" />}
                </button>

                <Link
                  to={`/avisos/${notice.id}`}
                  className={`block bg-background-secondary hover:bg-background-secondary/80 rounded-xl p-6 pl-12 transition-all group ${
                    isRead
                      ? 'border border-gray-800'
                      : 'border border-green-500/40 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                  }`}
                >
                  <h2 className={`text-lg font-semibold group-hover:text-green-400 transition-colors mb-2 ${
                    isRead ? 'text-gray-400' : 'text-white'
                  }`}>
                    {notice.title}
                  </h2>
                  <p className={`text-sm leading-relaxed mb-3 ${
                    isRead ? 'text-gray-500' : 'text-text-muted'
                  }`}>
                    {getExcerpt(notice.content)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(notice.published_at)}</span>
                    {!isRead && (
                      <span className="ml-2 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] font-semibold uppercase">
                        Novo
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-background-secondary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background-hover transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-green-500 text-black'
                  : 'bg-background-secondary text-white hover:bg-background-hover'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-background-secondary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background-hover transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AvisosPage;
