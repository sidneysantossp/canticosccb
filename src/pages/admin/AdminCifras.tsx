import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Music, FileText, Sparkles, PenSquare, Wand2 } from 'lucide-react';
import { fetchCifras, deleteCifra, toggleCifraActive, Cifra, INSTRUMENTS, CATEGORIES } from '@/api/cifras';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/ui/AlertModal';
import {
  fetchCifraV2RolloutStats,
  fetchLegacyCifraMigrationStatuses,
  migrateLegacyCifraById,
  type CifraV2RolloutStats,
  type LegacyCifraMigrationStatus,
} from '@/lib/admin/cifrasV2AdminApi';

const AdminCifras: React.FC = () => {
  const BATCH_SIZE_OPTIONS = [10, 25, 50, 100] as const;
  const [cifras, setCifras] = useState<Cifra[]>([]);
  const [migrationStatuses, setMigrationStatuses] = useState<Record<number, LegacyCifraMigrationStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterV2Status, setFilterV2Status] = useState<'all' | 'pending' | 'migrated'>('all');
  const [batchSize, setBatchSize] = useState<number>(25);
  const [rolloutStats, setRolloutStats] = useState<CifraV2RolloutStats | null>(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isBatchMigrating, setIsBatchMigrating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [lastBatchFailures, setLastBatchFailures] = useState<Array<{ id: number; message: string }>>([]);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadCifras();
  }, []);

  const loadCifras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [data, rollout] = await Promise.all([
        fetchCifras(),
        fetchCifraV2RolloutStats(),
      ]);
      setCifras(data);
      setRolloutStats(rollout);
      const statuses = await fetchLegacyCifraMigrationStatuses(data.map((item) => item.id));
      setMigrationStatuses(statuses);
    } catch (err: any) {
      console.error('Erro ao carregar cifras:', err);
      setError(err?.message || 'Erro ao carregar cifras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a cifra "${title}"?`)) return;
    try {
      await deleteCifra(id);
      await loadCifras();
    } catch (err) {
      console.error('Erro ao deletar cifra:', err);
      alert('Erro ao deletar cifra.');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleCifraActive(id);
      await loadCifras();
    } catch (err) {
      console.error('Erro ao alternar status:', err);
    }
  };

  const filtered = cifras.filter(c => {
    const matchSearch = !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchInstrument = !filterInstrument || c.instrument === filterInstrument;
    const matchCategory = !filterCategory || c.category === filterCategory;
    const migrationStatus = migrationStatuses[c.id];
    const matchV2Status =
      filterV2Status === 'all' ||
      (filterV2Status === 'pending' && !migrationStatus) ||
      (filterV2Status === 'migrated' && Boolean(migrationStatus));
    return matchSearch && matchInstrument && matchCategory && matchV2Status;
  });

  const getInstrumentLabel = (value: string) =>
    INSTRUMENTS.find(i => i.value === value)?.label || value;

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find(c => c.value === value)?.label || value;

  const hasActiveFilters = Boolean(searchTerm || filterInstrument || filterCategory || filterV2Status !== 'all');
  const pendingCifras = filtered.filter((cifra) => !migrationStatuses[cifra.id]);
  const totalMigrated = cifras.filter((cifra) => migrationStatuses[cifra.id]).length;
  const totalPending = cifras.length - totalMigrated;
  const pendingBatch = pendingCifras.slice(0, batchSize);

  const handleBatchMigrate = async () => {
    const targetIds = pendingBatch.map((item) => item.id);
    if (targetIds.length === 0) {
      setShowBatchConfirm(false);
      return;
    }

    const failures: Array<{ id: number; message: string }> = [];

    try {
      setShowBatchConfirm(false);
      setIsBatchMigrating(true);
      setLastBatchFailures([]);
      setBatchProgress({ completed: 0, total: targetIds.length });

      let completed = 0;
      for (const legacyId of targetIds) {
        try {
          await migrateLegacyCifraById(legacyId, {
            publishActive: true,
            markAsPrimary: true,
          });
        } catch (migrationError: any) {
          failures.push({
            id: legacyId,
            message: migrationError?.message || 'Erro desconhecido durante a migração.',
          });
        } finally {
          completed += 1;
          setBatchProgress({ completed, total: targetIds.length });
        }
      }

      await loadCifras();
      setLastBatchFailures(failures);

      if (failures.length > 0) {
        const failedIds = failures.slice(0, 4).map((item) => `#${item.id}`).join(', ');
        setAlert({
          isOpen: true,
          title: 'Migração concluída com pendências',
          message: `${targetIds.length - failures.length} cifras foram migradas neste lote. ${failures.length} falharam (${failedIds}${failures.length > 4 ? ', ...' : ''}).`,
          type: 'error',
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Backfill concluído',
          message: `${targetIds.length} cifras legadas foram migradas neste lote para o módulo V2.`,
          type: 'success',
        });
      }
    } catch (batchError: any) {
      console.error('Erro ao executar backfill das cifras:', batchError);
      setAlert({
        isOpen: true,
        title: 'Erro no backfill',
        message: batchError?.message || 'Não foi possível migrar as cifras pendentes.',
        type: 'error',
      });
    } finally {
      setIsBatchMigrating(false);
      setBatchProgress({ completed: 0, total: 0 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-400" />
            Cifras
          </h1>
          <p className="text-gray-400 mt-1">Gerencie as cifras musicais da plataforma</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl">
            <span className="text-sm text-gray-400 whitespace-nowrap">Lote</span>
            <select
              value={batchSize}
              onChange={(event) => setBatchSize(Number(event.target.value))}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              {BATCH_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-gray-900 text-white">
                  {option}
                </option>
              ))}
            </select>
          </div>
          <Link
            to="/admin/cifras-v2/shapes"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors border border-gray-700"
          >
            <Music className="w-5 h-5 text-primary-400" />
            Shapes
          </Link>
          <button
            type="button"
            onClick={() => setShowBatchConfirm(true)}
            disabled={isBatchMigrating || pendingBatch.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
          >
            <Wand2 className="w-5 h-5" />
            {isBatchMigrating
              ? `Migrando ${batchProgress.completed}/${batchProgress.total}`
              : pendingBatch.length > 0
                ? `Migrar ${pendingBatch.length} ${hasActiveFilters ? 'do filtro' : 'pendentes'}`
                : hasActiveFilters && totalPending > 0
                  ? 'Nenhuma pendente no filtro'
                  : 'V2 em dia'}
          </button>
          <Link
            to="/admin/cifras-v2/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Cifra V2
          </Link>
        </div>
      </div>

      {isBatchMigrating && (
        <div className="mb-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-cyan-300 font-medium">Executando backfill do legado para o módulo V2</p>
              <p className="text-sm text-cyan-100/80 mt-1">
                {batchProgress.completed} de {batchProgress.total} cifras processadas.
              </p>
            </div>
            <p className="text-sm text-cyan-200">
              O processo segue em lote e atualiza o catálogo V2 ao final.
            </p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all"
              style={{
                width: `${batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {!isBatchMigrating && lastBatchFailures.length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-red-300 font-medium">Falhas no último lote de migração</p>
              <p className="text-sm text-red-100/80 mt-1">
                Revise os itens abaixo antes de executar o próximo lote.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastBatchFailures([])}
              className="text-sm text-red-200 hover:text-white transition-colors"
            >
              Limpar
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {lastBatchFailures.slice(0, 6).map((failure) => (
              <div key={failure.id} className="rounded-lg bg-black/20 px-3 py-2">
                <p className="text-sm text-white font-medium">Cifra #{failure.id}</p>
                <p className="text-sm text-red-200">{failure.message}</p>
              </div>
            ))}
            {lastBatchFailures.length > 6 && (
              <p className="text-xs text-red-200/80">
                Mostrando 6 de {lastBatchFailures.length} falhas.
              </p>
            )}
          </div>
        </div>
      )}

      {rolloutStats && (
        <div className={`mb-6 rounded-xl border p-4 ${
          rolloutStats.publicCatalogItems > 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className={`font-medium ${rolloutStats.publicCatalogItems > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                Rollout do Cifras V2
              </p>
              <p className="text-sm text-gray-300 mt-1">
                {rolloutStats.publicCatalogItems > 0
                  ? `Já existem ${rolloutStats.publicCatalogItems} versões V2 públicas visíveis no catálogo novo.`
                  : 'O catálogo público V2 ainda está zerado. Para a experiência nova aparecer no frontend, é preciso migrar e publicar cifras legadas.'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm min-w-0">
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Songs V2</p>
                <p className="text-white font-semibold">{rolloutStats.songsTotal}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Versões V2</p>
                <p className="text-white font-semibold">{rolloutStats.versionsTotal}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Publicadas</p>
                <p className="text-white font-semibold">{rolloutStats.publishedVersions}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">No catálogo</p>
                <p className="text-white font-semibold">{rolloutStats.publicCatalogItems}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Com seções</p>
                <p className="text-white font-semibold">{rolloutStats.versionsWithSections}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Defaults estudo</p>
                <p className="text-white font-semibold">{rolloutStats.versionsWithStudyDefaults}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Próx. lote</p>
                <p className="text-white font-semibold">{Math.min(batchSize, pendingCifras.length)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título ou artista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterInstrument}
          onChange={e => setFilterInstrument(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os Instrumentos</option>
          {INSTRUMENTS.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as Categorias</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={filterV2Status}
          onChange={e => setFilterV2Status(e.target.value as 'all' | 'pending' | 'migrated')}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todas as cifras</option>
          <option value="pending">Somente V2 pendentes</option>
          <option value="migrated">Somente V2 migradas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{cifras.length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Ativas</p>
          <p className="text-2xl font-bold text-green-400">{cifras.filter(c => c.is_active).length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Inativas</p>
          <p className="text-2xl font-bold text-red-400">{cifras.filter(c => !c.is_active).length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Visualizações</p>
          <p className="text-2xl font-bold text-primary-400">{cifras.reduce((sum, c) => sum + c.views_count, 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Migradas V2</p>
          <p className="text-2xl font-bold text-cyan-400">{totalMigrated}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Pendentes V2</p>
          <p className="text-2xl font-bold text-amber-400">{totalPending}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">
            {searchTerm || filterInstrument || filterCategory ? 'Nenhuma cifra encontrada' : 'Nenhuma cifra cadastrada'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterInstrument || filterCategory ? 'Tente ajustar os filtros' : 'Comece adicionando a primeira cifra'}
          </p>
          {!searchTerm && !filterInstrument && !filterCategory && (
            <Link
              to="/admin/cifras-v2/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Cifra V2
            </Link>
          )}
        </div>
      ) : (
        /* Table */
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Cifra</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Instrumento</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Tom</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden lg:table-cell">Categoria</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden lg:table-cell">Views</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.map(cifra => (
                  <tr key={cifra.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {cifra.cover_url ? (
                          <img src={cifra.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{cifra.title}</p>
                          <p className="text-gray-400 text-sm">{cifra.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-gray-300 text-sm">{getInstrumentLabel(cifra.instrument)}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-primary-500/20 text-primary-400 text-sm font-medium rounded-lg">
                        {cifra.original_key}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-300 text-sm">{getCategoryLabel(cifra.category)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-300 text-sm">{cifra.views_count.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <button
                          onClick={() => handleToggleActive(cifra.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            cifra.is_active
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {cifra.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {cifra.is_active ? 'Ativa' : 'Inativa'}
                        </button>
                        {migrationStatuses[cifra.id] ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            V2 {migrationStatuses[cifra.id].versionStatus || 'ok'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          V2 pendente
                        </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/cifra/${cifra.slug}`}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Visualizar"
                          target="_blank"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={migrationStatuses[cifra.id]?.versionId
                            ? `/admin/cifras-v2/versions/${migrationStatuses[cifra.id].versionId}/edit`
                            : `/admin/cifras/${cifra.id}/migrate`}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title={migrationStatuses[cifra.id]?.versionId ? 'Editar no V2' : 'Migrar para editar no V2'}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/cifras/${cifra.id}/migrate`}
                          className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300"
                          title="Preview / migrar V2"
                        >
                          <Sparkles className="w-4 h-4" />
                        </Link>
                        {migrationStatuses[cifra.id]?.versionId && (
                          <Link
                            to={`/admin/cifras-v2/versions/${migrationStatuses[cifra.id].versionId}/edit`}
                            className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors text-primary-400 hover:text-primary-300"
                            title="Abrir editor V2"
                          >
                            <PenSquare className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(cifra.id, cifra.title)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        onConfirm={handleBatchMigrate}
        title="Migrar cifras pendentes para o V2?"
        message={
          pendingBatch.length > 0
            ? `${pendingBatch.length} cifras legadas${hasActiveFilters ? ' do filtro atual' : ''} serão convertidas neste lote para o módulo novo de cifras, preservando slugs e publicando as ativas.${pendingCifras.length > pendingBatch.length ? ` Restarão ${pendingCifras.length - pendingBatch.length} pendentes após este lote.` : ''}`
            : hasActiveFilters && totalPending > 0
              ? 'Não há cifras pendentes dentro do filtro atual. Limpe os filtros para migrar o restante do legado.'
              : 'Não há cifras pendentes para migrar neste momento.'
        }
        confirmText={pendingBatch.length > 0 ? `Executar lote de ${pendingBatch.length}` : 'Fechar'}
        cancelText="Cancelar"
        type="info"
      />

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((current) => ({ ...current, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttonColor={alert.type === 'error' ? 'red' : alert.type === 'success' ? 'green' : 'blue'}
      />
    </div>
  );
};

export default AdminCifras;
