import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  Music,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
} from 'lucide-react';

import AlertModal from '@/components/ui/AlertModal';
import {
  fetchAllCifraSongs,
  fetchAllCifraVersions,
  fetchCifraVersionSections,
  prepareCifraVersionForCatalog,
  auditLegacyCifraContent,
} from '@/lib/admin/cifrasV2AdminApi';
import type { CifraSong, CifraVersion, CifraVersionSection } from '@/types/cifras-v2';

type ReviewItem = {
  song: CifraSong;
  version: CifraVersion;
};

type AlertState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

const BATCH_OPTIONS = [10, 25, 50, 100] as const;

function formatDate(value?: string | null) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function renderSectionLine(line: CifraVersionSection['content_ast'][number]) {
  if (line.text?.trim()) return line.text;
  if (line.segments?.length) {
    return line.segments
      .map((segment) => [segment.chord, segment.lyric].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

const AdminCifraReview: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [sections, setSections] = useState<CifraVersionSection[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchSize, setBatchSize] = useState<number>(25);
  const [pilotOnly, setPilotOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const selectedItem = useMemo(
    () => items.find((item) => item.version.id === selectedVersionId) ?? items[0] ?? null,
    [items, selectedVersionId],
  );

  const qualityByVersion = useMemo(
    () => new Map(items.map((item) => [item.version.id, auditLegacyCifraContent(item.version.body_text)])),
    [items],
  );

  const selectedQuality = selectedItem ? qualityByVersion.get(selectedItem.version.id) : null;

  const filteredItems = useMemo(() => {
    const pilotItems = pilotOnly
      ? items.filter(({ song }) => Boolean(song.hinario_numero && song.hinario_numero >= 1 && song.hinario_numero <= 10))
      : items;
    const search = searchTerm.trim().toLowerCase();
    if (!search) return pilotItems;
    return pilotItems.filter(({ song, version }) => {
      const searchable = [
        song.title,
        song.composer_name,
        song.hinario_numero ? String(song.hinario_numero) : '',
        version.title,
        version.public_slug,
        version.chords_index.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(search);
    });
  }, [items, pilotOnly, searchTerm]);

  const selectedVisibleCount = filteredItems.filter((item) => selectedIds.includes(item.version.id)).length;
  const visibleBatch = filteredItems.slice(0, batchSize);
  const filteredIds = filteredItems.map((item) => item.version.id);

  const loadReviewItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const [songs, versions] = await Promise.all([
        fetchAllCifraSongs({ sourceType: 'hinario' }, { authenticated: true, pageSize: 500 }),
        fetchAllCifraVersions({ status: 'draft' }, { authenticated: true, pageSize: 500 }),
      ]);
      const songById = new Map(songs.map((song) => [song.id, song]));
      const reviewItems = versions
        .map((version) => {
          const song = songById.get(version.song_id);
          return song ? { song, version } : null;
        })
        .filter((item): item is ReviewItem => Boolean(item))
        .sort((left, right) => {
          const leftNumber = left.song.hinario_numero ?? Number.MAX_SAFE_INTEGER;
          const rightNumber = right.song.hinario_numero ?? Number.MAX_SAFE_INTEGER;
          return leftNumber - rightNumber || left.song.title.localeCompare(right.song.title);
        });

      setItems(reviewItems);
      setSelectedIds((current) =>
        current.filter((id) => reviewItems.some((item) => item.version.id === id)),
      );
      setSelectedVersionId((current) =>
        current && reviewItems.some((item) => item.version.id === current)
          ? current
          : reviewItems[0]?.version.id ?? null,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar revisão de cifras.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviewItems();
  }, []);

  useEffect(() => {
    const versionId = selectedItem?.version.id;
    if (!versionId) {
      setSections([]);
      return;
    }

    let isMounted = true;
    const loadSections = async () => {
      try {
        setLoadingSections(true);
        const data = await fetchCifraVersionSections(versionId);
        if (isMounted) setSections(data);
      } catch (err) {
        if (isMounted) {
          setSections([]);
          console.error('Erro ao carregar seções da cifra:', err);
        }
      } finally {
        if (isMounted) setLoadingSections(false);
      }
    };

    void loadSections();
    return () => {
      isMounted = false;
    };
  }, [selectedItem?.version.id]);

  const toggleSelection = (versionId: string) => {
    setSelectedIds((current) =>
      current.includes(versionId)
        ? current.filter((id) => id !== versionId)
        : [...current, versionId],
    );
  };

  const toggleVisibleBatch = () => {
    const visibleIds = visibleBatch.map((item) => item.version.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredIds);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const removePublishedItem = (versionId: string) => {
    setItems((current) => current.filter((item) => item.version.id !== versionId));
    setSelectedIds((current) => current.filter((id) => id !== versionId));
    setSections([]);
  };

  const handlePublish = async (versionId: string) => {
    const quality = qualityByVersion.get(versionId);
    if (quality?.status === 'blocked') {
      setAlert({
        isOpen: true,
        title: 'Revisão obrigatória',
        message: 'Esta cifra tem bloqueios de formatação. Corrija os itens indicados antes de publicar.',
        type: 'warning',
      });
      return;
    }

    try {
      setPublishingId(versionId);
      await prepareCifraVersionForCatalog(versionId);
      removePublishedItem(versionId);
      setAlert({
        isOpen: true,
        title: 'Cifra publicada',
        message: 'A cifra foi aprovada e publicada no catálogo público.',
        type: 'success',
      });
    } catch (err) {
      setAlert({
        isOpen: true,
        title: 'Falha ao publicar',
        message: err instanceof Error ? err.message : 'Não foi possível publicar esta cifra.',
        type: 'error',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleBatchPublish = async () => {
    const requestedTargets = selectedIds.length > 0 ? selectedIds : visibleBatch.map((item) => item.version.id);
    const blockedTargets = requestedTargets.filter((id) => qualityByVersion.get(id)?.status === 'blocked');
    const targets = requestedTargets.filter((id) => !blockedTargets.includes(id));
    if (blockedTargets.length > 0) {
      setAlert({
        isOpen: true,
        title: 'Cifras bloqueadas removidas do lote',
        message: `${blockedTargets.length} cifra(s) exigem correção de formatação e não serão publicadas neste lote.`,
        type: 'warning',
      });
    }
    if (targets.length === 0) return;

    const confirmed = window.confirm(
      `Publicar ${targets.length} cifra(s) agora? Elas ficarão visíveis no catálogo público e indexáveis.`,
    );
    if (!confirmed) return;

    const failures: Array<{ id: string; message: string }> = [];
    setBatchPublishing(true);
    setBatchProgress({ completed: 0, total: targets.length });
    try {
      for (const versionId of targets) {
        try {
          await prepareCifraVersionForCatalog(versionId);
          removePublishedItem(versionId);
        } catch (err) {
          failures.push({
            id: versionId,
            message: err instanceof Error ? err.message : 'Erro desconhecido',
          });
        } finally {
          setBatchProgress((current) => ({ ...current, completed: current.completed + 1 }));
        }
      }

      setAlert({
        isOpen: true,
        title: failures.length > 0 ? 'Publicação com pendências' : 'Lote publicado',
        message:
          failures.length > 0
            ? `${targets.length - failures.length} cifra(s) publicadas. ${failures.length} falharam e continuam na revisão.`
            : `${targets.length} cifra(s) publicadas no catálogo público.`,
        type: failures.length > 0 ? 'warning' : 'success',
      });
    } finally {
      setBatchPublishing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link to="/admin/cifras" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3">
            <ChevronLeft className="w-4 h-4" />
            Voltar para Cifras
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary-400" />
            Revisão de Cifras
          </h1>
          <p className="text-gray-400 mt-1">
            Aprove online as cifras importadas do Hinário antes de liberar no catálogo público.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadReviewItems()}
            disabled={loading || batchPublishing}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white font-semibold rounded-xl border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => void handleBatchPublish()}
            disabled={batchPublishing || filteredItems.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
          >
            {batchPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
            {batchPublishing
              ? `Publicando ${batchProgress.completed}/${batchProgress.total}`
              : selectedIds.length > 0
                ? `Publicar ${selectedIds.length} selecionadas`
                : `Publicar primeiras ${Math.min(batchSize, filteredItems.length)}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-3">
                <p className="text-xs text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-white">{items.length}</p>
              </div>
              <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-3">
                <p className="text-xs text-gray-500">Filtradas</p>
                <p className="text-2xl font-bold text-white">{filteredItems.length}</p>
              </div>
              <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-3">
                <p className="text-xs text-gray-500">Selecionadas</p>
                <p className="text-2xl font-bold text-primary-400">{selectedVisibleCount}</p>
              </div>
            </div>

            <label className="relative block">
              <Search className="absolute left-4 top-1/2 w-5 h-5 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por número, título, tom ou slug"
                className="w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500"
              />
            </label>

            <button
              type="button"
              onClick={() => setPilotOnly((current) => !current)}
              aria-pressed={pilotOnly}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                pilotOnly
                  ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
                  : 'border-gray-700 bg-gray-950 text-gray-400 hover:text-white'
              }`}
            >
              {pilotOnly ? 'Piloto ativo: Hinos 1 a 10' : 'Mostrar apenas o piloto 1 a 10'}
            </button>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={toggleVisibleBatch}
                  className="text-sm font-semibold text-primary-400 hover:text-primary-300"
                >
                  Selecionar lote
                </button>
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  disabled={filteredItems.length === 0}
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  Selecionar todas filtradas
                </button>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm font-semibold text-gray-400 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Lote
                <select
                  value={batchSize}
                  onChange={(event) => setBatchSize(Number(event.target.value))}
                  className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  {BATCH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="max-h-[720px] overflow-y-auto divide-y divide-gray-800">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-400" />
                Carregando cifras para revisão...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-primary-400" />
                Nenhuma cifra em draft para revisar.
              </div>
            ) : (
              filteredItems.map(({ song, version }) => {
                const isSelected = selectedIds.includes(version.id);
                const isActive = selectedItem?.version.id === version.id;
                return (
                  <article
                    key={version.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isActive ? 'bg-primary-500/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedVersionId(version.id)}
                  >
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(version.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-950 accent-primary-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          {song.hinario_numero && (
                            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-300">#{song.hinario_numero}</span>
                          )}
                          <span>{version.original_key}</span>
                          <span>{version.lines_count} linhas</span>
                          <span>{version.sections_count} seção</span>
                          {qualityByVersion.get(version.id)?.status === 'blocked' ? (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-300">Bloqueada</span>
                          ) : qualityByVersion.get(version.id)?.status === 'review_required' ? (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">Conferir</span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">Formatada</span>
                          )}
                        </div>
                        <h2 className="font-semibold text-white truncate">{song.title}</h2>
                        <p className="text-sm text-gray-400 truncate">{song.composer_name || version.title}</p>
                        <p className="text-xs text-gray-500 mt-1">Importada em {formatDate(version.created_at)}</p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="bg-gray-900/70 border border-gray-800 rounded-2xl overflow-hidden min-h-[720px]">
          {!selectedItem ? (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <FileText className="w-12 h-12 mb-3" />
              Selecione uma cifra para revisar.
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-3">
                      {selectedItem.song.hinario_numero && (
                        <span className="rounded-full bg-primary-500/10 border border-primary-500/30 px-3 py-1 text-primary-300">
                          Hino {selectedItem.song.hinario_numero}
                        </span>
                      )}
                      <span className="rounded-full bg-gray-800 px-3 py-1">{selectedItem.version.instrument}</span>
                      <span className="rounded-full bg-gray-800 px-3 py-1">Tom {selectedItem.version.original_key}</span>
                      {selectedItem.version.capo > 0 && (
                        <span className="rounded-full bg-gray-800 px-3 py-1">Capo {selectedItem.version.capo}ª casa</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-white">{selectedItem.song.title}</h2>
                    <p className="text-gray-400 mt-1">{selectedItem.song.composer_name || 'Sem compositor informado'}</p>
                    <p className="text-sm text-gray-500 mt-2">{selectedItem.version.public_slug}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/cifra/${selectedItem.version.public_slug}?preview=admin`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 font-semibold transition-colors"
                    >
                      <Globe2 className="w-5 h-5" />
                      Visualizar
                    </Link>
                    <Link
                      to={`/admin/cifras-v2/versions/${selectedItem.version.id}/edit`}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handlePublish(selectedItem.version.id)}
                      disabled={publishingId === selectedItem.version.id || batchPublishing || selectedQuality?.status === 'blocked'}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold transition-colors"
                    >
                      {publishingId === selectedItem.version.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Rocket className="w-5 h-5" />
                      )}
                      Aprovar e publicar
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-4">
                    <p className="text-xs text-gray-500">Acordes</p>
                    <p className="text-lg font-semibold text-primary-400 truncate">
                      {selectedItem.version.chords_index.slice(0, 4).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-4">
                    <p className="text-xs text-gray-500">Linhas</p>
                    <p className="text-lg font-semibold text-white">{selectedItem.version.lines_count}</p>
                  </div>
                  <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-4">
                    <p className="text-xs text-gray-500">Seções</p>
                    <p className="text-lg font-semibold text-white">{selectedItem.version.sections_count}</p>
                  </div>
                  <div className="rounded-xl bg-gray-950/70 border border-gray-800 p-4">
                    <p className="text-xs text-gray-500">Fonte</p>
                    <p className="text-lg font-semibold text-white">Hinário PDF</p>
                  </div>
                </div>

                {selectedQuality ? (
                  <div className={`mb-6 rounded-2xl border p-5 ${
                    selectedQuality.status === 'blocked'
                      ? 'border-red-500/30 bg-red-500/10'
                      : selectedQuality.status === 'review_required'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-emerald-500/30 bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {selectedQuality.status === 'ready'
                          ? <ShieldCheck className="h-5 w-5 text-emerald-300" />
                          : <AlertTriangle className={`h-5 w-5 ${selectedQuality.status === 'blocked' ? 'text-red-300' : 'text-amber-300'}`} />}
                        <h3 className="font-semibold text-white">Controle de qualidade</h3>
                      </div>
                      <span className="rounded-full bg-black/20 px-3 py-1 text-sm font-bold text-white">
                        {selectedQuality.score}/100
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">
                      {selectedQuality.status === 'blocked'
                        ? 'A publicação está bloqueada até corrigir os problemas abaixo.'
                        : 'A formatação foi triada. Confirme visualmente os acordes e suas transições antes de publicar.'}
                    </p>
                    {selectedQuality.issues.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-gray-200">
                        {selectedQuality.issues.slice(0, 6).map((issue, index) => (
                          <li key={`${issue.code}-${issue.line ?? index}`}>
                            • {issue.message}{issue.line ? ` (linha ${issue.line})` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-2xl bg-black/40 border border-gray-800 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Music className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">Preview do conteúdo importado</h3>
                  </div>

                  {loadingSections ? (
                    <div className="py-20 text-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-400" />
                      Carregando seções...
                    </div>
                  ) : sections.length > 0 ? (
                    <div className="space-y-8 font-mono text-[15px] leading-7">
                      {sections
                        .slice()
                        .sort((left, right) => left.section_order - right.section_order)
                        .map((section) => (
                          <div key={section.id}>
                            <p className="text-gray-500 mb-3">[{section.section_label}]</p>
                            <pre className="whitespace-pre-wrap break-words text-gray-100">
                              {section.content_ast.map(renderSectionLine).filter(Boolean).join('\n') || section.plain_text}
                            </pre>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words font-mono text-[15px] leading-7 text-gray-100">
                      {selectedItem.version.body_text || 'Sem conteúdo para exibir.'}
                    </pre>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((current) => ({ ...current, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttonColor={alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'amber' : 'green'}
      />
    </div>
  );
};

export default AdminCifraReview;
