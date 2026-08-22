import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Music, FileText, Sparkles, PenSquare, Wand2, ExternalLink, Rocket, CheckCircle2 } from 'lucide-react';
import { fetchCifras, deleteCifra, toggleCifraActive, Cifra, INSTRUMENTS, CATEGORIES } from '@/api/cifras';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/ui/AlertModal';
import {
  applyCifraVersionStudyDefaults,
  fetchCifraV2RolloutStats,
  fetchLegacyCifraMigrationStatuses,
  migrateLegacyCifraById,
  prepareCifraVersionForCatalog,
  promoteCifraVersionToCatalog,
  rebuildCifraVersionSectionsFromStoredContent,
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
  const [filterV2Status, setFilterV2Status] = useState<
    'all' | 'pending' | 'migrated' | 'catalog' | 'promotable' | 'missing-sections' | 'missing-study'
  >('all');
  const [batchSize, setBatchSize] = useState<number>(25);
  const [rolloutStats, setRolloutStats] = useState<CifraV2RolloutStats | null>(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isBatchMigrating, setIsBatchMigrating] = useState(false);
  const [isBatchPromoting, setIsBatchPromoting] = useState(false);
  const [isBatchApplyingStudyDefaults, setIsBatchApplyingStudyDefaults] = useState(false);
  const [isBatchRebuildingSections, setIsBatchRebuildingSections] = useState(false);
  const [preparingVersionId, setPreparingVersionId] = useState<string | null>(null);
  const [promotingVersionId, setPromotingVersionId] = useState<string | null>(null);
  const [applyingStudyDefaultsVersionId, setApplyingStudyDefaultsVersionId] = useState<string | null>(null);
  const [rebuildingSectionsVersionId, setRebuildingSectionsVersionId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [batchPromoteProgress, setBatchPromoteProgress] = useState({ completed: 0, total: 0 });
  const [batchStudyDefaultsProgress, setBatchStudyDefaultsProgress] = useState({ completed: 0, total: 0 });
  const [batchRebuildSectionsProgress, setBatchRebuildSectionsProgress] = useState({ completed: 0, total: 0 });
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
      window.alert('Erro ao deletar cifra.');
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

  const isPromotableStatus = (status: LegacyCifraMigrationStatus | undefined) =>
    Boolean(status?.versionId) && !status?.publicCatalogVisible && (status?.sectionsCount ?? 0) > 0;
  const canRebuildSections = (status: LegacyCifraMigrationStatus | undefined) =>
    Boolean(status?.versionId) && (status?.sectionsCount ?? 0) <= 0;
  const canApplyStudyDefaults = (status: LegacyCifraMigrationStatus | undefined) =>
    Boolean(status?.versionId) && (status?.sectionsCount ?? 0) > 0 && !status?.hasStudyDefaults;
  const canPrepareVersion = (status: LegacyCifraMigrationStatus | undefined) =>
    Boolean(status?.versionId) && !status?.publicCatalogVisible;
  const getCifraViewPath = (cifra: Cifra) => {
    const status = migrationStatuses[cifra.id];
    if (status?.versionSlug) {
      return status.publicCatalogVisible
        ? `/cifra/${status.versionSlug}`
        : `/cifra/${status.versionSlug}?preview=admin`;
    }
    return `/cifra/${cifra.slug}`;
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
      (filterV2Status === 'migrated' && Boolean(migrationStatus)) ||
      (filterV2Status === 'catalog' && Boolean(migrationStatus?.publicCatalogVisible)) ||
      (filterV2Status === 'promotable' && isPromotableStatus(migrationStatus)) ||
      (filterV2Status === 'missing-sections' && Boolean(migrationStatus?.versionId) && (migrationStatus?.sectionsCount ?? 0) <= 0) ||
      (filterV2Status === 'missing-study' && Boolean(migrationStatus?.versionId) && !migrationStatus?.hasStudyDefaults);
    return matchSearch && matchInstrument && matchCategory && matchV2Status;
  });

  const getInstrumentLabel = (value: string) =>
    INSTRUMENTS.find(i => i.value === value)?.label || value;

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find(c => c.value === value)?.label || value;

  const getV2StatusTone = (status: LegacyCifraMigrationStatus | undefined) => {
    if (!status) return 'bg-amber-500/20 text-amber-300';
    if (status.publicCatalogVisible) return 'bg-emerald-500/20 text-emerald-300';
    if (status.versionStatus === 'published') return 'bg-cyan-500/20 text-cyan-300';
    return 'bg-gray-600/20 text-gray-300';
  };

  const getV2StatusLabel = (status: LegacyCifraMigrationStatus | undefined) => {
    if (!status) return 'V2 pendente';
    if (status.publicCatalogVisible) return 'V2 no catálogo';
    if (status.versionStatus === 'published') return 'V2 publicado';
    return `V2 ${status.versionStatus || 'ok'}`;
  };

  const getV2ReadinessIssues = (status: LegacyCifraMigrationStatus | undefined) => {
    if (!status) return [];

    const issues: string[] = [];
    if (status.versionStatus !== 'published') issues.push('Publicar');
    if (!status.versionIsSearchable) issues.push('Busca');
    if (status.sectionsCount <= 0) issues.push('Seções');
    if (!status.hasStudyDefaults) issues.push('Study');
    return issues;
  };

  const canPromoteVersion = (status: LegacyCifraMigrationStatus | undefined) => isPromotableStatus(status);

  const hasActiveFilters = Boolean(searchTerm || filterInstrument || filterCategory || filterV2Status !== 'all');
  const pendingCifras = filtered.filter((cifra) => !migrationStatuses[cifra.id]);
  const promotableStatuses = filtered
    .map((cifra) => migrationStatuses[cifra.id])
    .filter((status): status is LegacyCifraMigrationStatus => canPromoteVersion(status));
  const rebuildableStatuses = filtered
    .map((cifra) => migrationStatuses[cifra.id])
    .filter((status): status is LegacyCifraMigrationStatus => canRebuildSections(status));
  const studyDefaultableStatuses = filtered
    .map((cifra) => migrationStatuses[cifra.id])
    .filter((status): status is LegacyCifraMigrationStatus => canApplyStudyDefaults(status));
  const catalogVisibleCount = cifras.filter((cifra) => migrationStatuses[cifra.id]?.publicCatalogVisible).length;
  const promotableCount = cifras.filter((cifra) => isPromotableStatus(migrationStatuses[cifra.id])).length;
  const rebuildableCount = cifras.filter((cifra) => canRebuildSections(migrationStatuses[cifra.id])).length;
  const missingSectionsCount = cifras.filter((cifra) => {
    const status = migrationStatuses[cifra.id];
    return Boolean(status?.versionId) && (status?.sectionsCount ?? 0) <= 0;
  }).length;
  const missingStudyCount = cifras.filter((cifra) => {
    const status = migrationStatuses[cifra.id];
    return Boolean(status?.versionId) && !status?.hasStudyDefaults;
  }).length;
  const promoteBatch = promotableStatuses.slice(0, batchSize);
  const rebuildSectionsBatch = rebuildableStatuses.slice(0, batchSize);
  const studyDefaultsBatch = studyDefaultableStatuses.slice(0, batchSize);
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
    let promotedCount = 0;
    let migratedCount = 0;
    let rebuiltSectionsCount = 0;
    let studyDefaultsCount = 0;

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
          migratedCount += 1;
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

      const refreshedStatuses = await fetchLegacyCifraMigrationStatuses(targetIds);
      const statusesToRebuildSections = targetIds
        .map((legacyId) => refreshedStatuses[legacyId])
        .filter((status): status is LegacyCifraMigrationStatus => canRebuildSections(status));

      if (statusesToRebuildSections.length > 0) {
        setBatchProgress({ completed, total: targetIds.length + statusesToRebuildSections.length });

        for (const status of statusesToRebuildSections) {
          try {
            if (!status.versionId) {
              throw new Error('Versão V2 ausente para reconstruir seções.');
            }
            await rebuildCifraVersionSectionsFromStoredContent(status.versionId);
            rebuiltSectionsCount += 1;
          } catch (rebuildSectionsError: any) {
            failures.push({
              id: status.legacyId,
              message: rebuildSectionsError?.message || 'Erro desconhecido ao reconstruir seções.',
            });
          } finally {
            completed += 1;
            setBatchProgress({ completed, total: targetIds.length + statusesToRebuildSections.length });
          }
        }
      }

      const refreshedStatusesAfterSections = await fetchLegacyCifraMigrationStatuses(targetIds);
      const statusesToApplyStudyDefaults = targetIds
        .map((legacyId) => refreshedStatusesAfterSections[legacyId])
        .filter((status): status is LegacyCifraMigrationStatus => canApplyStudyDefaults(status));

      if (statusesToApplyStudyDefaults.length > 0) {
        setBatchProgress({
          completed,
          total: targetIds.length + statusesToRebuildSections.length + statusesToApplyStudyDefaults.length,
        });

        for (const status of statusesToApplyStudyDefaults) {
          try {
            if (!status.versionId) {
              throw new Error('Versão V2 ausente para aplicar study defaults.');
            }
            await applyCifraVersionStudyDefaults(status.versionId);
            studyDefaultsCount += 1;
          } catch (studyDefaultsError: any) {
            failures.push({
              id: status.legacyId,
              message: studyDefaultsError?.message || 'Erro desconhecido ao aplicar study defaults.',
            });
          } finally {
            completed += 1;
            setBatchProgress({
              completed,
              total: targetIds.length + statusesToRebuildSections.length + statusesToApplyStudyDefaults.length,
            });
          }
        }
      }

      const refreshedStatusesAfterStudyDefaults = await fetchLegacyCifraMigrationStatuses(targetIds);
      const statusesToPromote = targetIds
        .map((legacyId) => refreshedStatusesAfterStudyDefaults[legacyId])
        .filter((status): status is LegacyCifraMigrationStatus => canPromoteVersion(status));

      if (statusesToPromote.length > 0) {
        setBatchProgress({
          completed,
          total: targetIds.length + statusesToRebuildSections.length + statusesToApplyStudyDefaults.length + statusesToPromote.length,
        });

        for (const status of statusesToPromote) {
          try {
            if (!status.versionId) {
              throw new Error('Versão V2 ausente para promoção.');
            }
            await promoteCifraVersionToCatalog(status.versionId);
            promotedCount += 1;
          } catch (promotionError: any) {
            failures.push({
              id: status.legacyId,
              message: promotionError?.message || 'Erro desconhecido durante a promoção para o catálogo.',
            });
          } finally {
            completed += 1;
            setBatchProgress({
              completed,
              total: targetIds.length + statusesToRebuildSections.length + statusesToApplyStudyDefaults.length + statusesToPromote.length,
            });
          }
        }
      }

      await loadCifras();
      setLastBatchFailures(failures);

      if (failures.length > 0) {
        const failedIds = failures.slice(0, 4).map((item) => `#${item.id}`).join(', ');
        setAlert({
          isOpen: true,
          title: 'Rollout concluído com pendências',
          message: `${migratedCount} cifras foram migradas, ${rebuiltSectionsCount} tiveram seções reconstruídas, ${studyDefaultsCount} study defaults foram aplicados e ${promotedCount} versões foram levadas ao catálogo neste lote. ${failures.length} etapas falharam (${failedIds}${failures.length > 4 ? ', ...' : ''}).`,
          type: 'error',
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Rollout concluído',
          message: `${migratedCount} cifras legadas foram migradas, ${rebuiltSectionsCount} tiveram seções reconstruídas, ${studyDefaultsCount} study defaults foram aplicados e ${promotedCount} versões foram publicadas no catálogo V2 neste lote.`,
          type: 'success',
        });
      }
    } catch (batchError: any) {
      console.error('Erro ao executar rollout das cifras V2:', batchError);
      setAlert({
        isOpen: true,
        title: 'Erro no rollout',
        message: batchError?.message || 'Não foi possível concluir o lote de rollout das cifras pendentes.',
        type: 'error',
      });
    } finally {
      setIsBatchMigrating(false);
      setBatchProgress({ completed: 0, total: 0 });
    }
  };

  const handlePromoteVersion = async (status: LegacyCifraMigrationStatus) => {
    if (!status.versionId) return;
    if (status.publicCatalogVisible) {
      setAlert({
        isOpen: true,
        title: 'Versão já está no catálogo',
        message: `A cifra #${status.legacyId} já está visível no catálogo V2.`,
        type: 'info',
      });
      return;
    }
    if (status.sectionsCount <= 0) {
      setAlert({
        isOpen: true,
        title: 'Versão sem seções',
        message: 'Esta versão ainda não possui seções publicáveis. Abra o editor V2 e salve as seções antes de promover.',
        type: 'error',
      });
      return;
    }

    try {
      setPromotingVersionId(status.versionId);
      await promoteCifraVersionToCatalog(status.versionId);
      await loadCifras();
      setAlert({
        isOpen: true,
        title: 'Versão enviada ao catálogo',
        message: `A versão V2 da cifra #${status.legacyId} foi ajustada para publicação e busca.`,
        type: 'success',
      });
    } catch (promotionError: any) {
      console.error('Erro ao promover cifra V2 para o catálogo:', promotionError);
      setAlert({
        isOpen: true,
        title: 'Não foi possível enviar ao catálogo',
        message: promotionError?.message || 'Erro inesperado ao promover a versão V2.',
        type: 'error',
      });
    } finally {
      setPromotingVersionId(null);
    }
  };

  const handleApplyStudyDefaults = async (status: LegacyCifraMigrationStatus) => {
    if (!status.versionId) return;

    if (status.sectionsCount <= 0) {
      setAlert({
        isOpen: true,
        title: 'Versão sem seções',
        message: 'Esta versão ainda não possui seções persistidas para configurar o modo estudo.',
        type: 'error',
      });
      return;
    }

    if (status.hasStudyDefaults) {
      setAlert({
        isOpen: true,
        title: 'Modo estudo já configurado',
        message: `A cifra #${status.legacyId} já possui defaults editoriais de estudo.`,
        type: 'info',
      });
      return;
    }

    try {
      setApplyingStudyDefaultsVersionId(status.versionId);
      await applyCifraVersionStudyDefaults(status.versionId);
      await loadCifras();
      setAlert({
        isOpen: true,
        title: 'Study defaults aplicados',
        message: `A versão V2 da cifra #${status.legacyId} agora abre com a primeira seção definida para o modo estudo.`,
        type: 'success',
      });
    } catch (studyDefaultsError: any) {
      console.error('Erro ao aplicar study defaults automáticos:', studyDefaultsError);
      setAlert({
        isOpen: true,
        title: 'Não foi possível configurar o modo estudo',
        message: studyDefaultsError?.message || 'Erro inesperado ao aplicar study defaults.',
        type: 'error',
      });
    } finally {
      setApplyingStudyDefaultsVersionId(null);
    }
  };

  const handleRebuildSections = async (status: LegacyCifraMigrationStatus) => {
    if (!status.versionId) return;

    if (status.sectionsCount > 0) {
      setAlert({
        isOpen: true,
        title: 'Seções já disponíveis',
        message: `A cifra #${status.legacyId} já possui seções persistidas no V2.`,
        type: 'info',
      });
      return;
    }

    try {
      setRebuildingSectionsVersionId(status.versionId);
      await rebuildCifraVersionSectionsFromStoredContent(status.versionId);
      await loadCifras();
      setAlert({
        isOpen: true,
        title: 'Seções reconstruídas',
        message: `A versão V2 da cifra #${status.legacyId} teve as seções reconstruídas a partir do conteúdo armazenado.`,
        type: 'success',
      });
    } catch (rebuildSectionsError: any) {
      console.error('Erro ao reconstruir seções da cifra V2:', rebuildSectionsError);
      setAlert({
        isOpen: true,
        title: 'Não foi possível reconstruir as seções',
        message: rebuildSectionsError?.message || 'Erro inesperado ao reconstruir as seções da versão V2.',
        type: 'error',
      });
    } finally {
      setRebuildingSectionsVersionId(null);
    }
  };

  const handlePrepareVersion = async (status: LegacyCifraMigrationStatus) => {
    if (!status.versionId) return;

    if (status.publicCatalogVisible) {
      setAlert({
        isOpen: true,
        title: 'Versão já está pronta',
        message: `A cifra #${status.legacyId} já está visível no catálogo V2.`,
        type: 'info',
      });
      return;
    }

    try {
      setPreparingVersionId(status.versionId);
      await prepareCifraVersionForCatalog(status.versionId);
      await loadCifras();
      setAlert({
        isOpen: true,
        title: 'Versão preparada para catálogo',
        message: `A cifra #${status.legacyId} foi preparada automaticamente e enviada ao catálogo V2.`,
        type: 'success',
      });
    } catch (prepareError: any) {
      console.error('Erro ao preparar cifra V2 para o catálogo:', prepareError);
      setAlert({
        isOpen: true,
        title: 'Não foi possível preparar a versão',
        message: prepareError?.message || 'Erro inesperado ao preparar a cifra V2.',
        type: 'error',
      });
    } finally {
      setPreparingVersionId(null);
    }
  };

  const handleBatchPromote = async () => {
    const targets = promoteBatch.filter((status) => status.versionId && !status.publicCatalogVisible && status.sectionsCount > 0);
    if (targets.length === 0) {
      return;
    }

    const failures: Array<{ id: number; message: string }> = [];
    try {
      setIsBatchPromoting(true);
      setBatchPromoteProgress({ completed: 0, total: targets.length });

      let completed = 0;
      for (const status of targets) {
        try {
          if (!status.versionId) {
            throw new Error('Versão V2 ausente.');
          }
          await promoteCifraVersionToCatalog(status.versionId);
        } catch (promotionError: any) {
          failures.push({
            id: status.legacyId,
            message: promotionError?.message || 'Erro desconhecido durante a promoção.',
          });
        } finally {
          completed += 1;
          setBatchPromoteProgress({ completed, total: targets.length });
        }
      }

      await loadCifras();
      if (failures.length > 0) {
        setLastBatchFailures((previous) => [...failures, ...previous].slice(0, 20));
        setAlert({
          isOpen: true,
          title: 'Promoção concluída com pendências',
          message: `${targets.length - failures.length} versões V2 foram levadas ao catálogo. ${failures.length} falharam.`,
          type: 'error',
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Promoção em lote concluída',
          message: `${targets.length} versões V2 foram levadas ao catálogo com sucesso.`,
          type: 'success',
        });
      }
    } finally {
      setIsBatchPromoting(false);
      setBatchPromoteProgress({ completed: 0, total: 0 });
    }
  };

  const handleBatchApplyStudyDefaults = async () => {
    const targets = studyDefaultsBatch.filter((status) => status.versionId && status.sectionsCount > 0 && !status.hasStudyDefaults);
    if (targets.length === 0) {
      return;
    }

    const failures: Array<{ id: number; message: string }> = [];
    try {
      setIsBatchApplyingStudyDefaults(true);
      setBatchStudyDefaultsProgress({ completed: 0, total: targets.length });

      let completed = 0;
      for (const status of targets) {
        try {
          if (!status.versionId) {
            throw new Error('Versão V2 ausente.');
          }
          await applyCifraVersionStudyDefaults(status.versionId);
        } catch (studyDefaultsError: any) {
          failures.push({
            id: status.legacyId,
            message: studyDefaultsError?.message || 'Erro desconhecido durante a aplicação dos study defaults.',
          });
        } finally {
          completed += 1;
          setBatchStudyDefaultsProgress({ completed, total: targets.length });
        }
      }

      await loadCifras();
      if (failures.length > 0) {
        setLastBatchFailures((previous) => [...failures, ...previous].slice(0, 20));
        setAlert({
          isOpen: true,
          title: 'Study defaults concluídos com pendências',
          message: `${targets.length - failures.length} versões receberam defaults de estudo. ${failures.length} falharam.`,
          type: 'error',
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Study defaults aplicados em lote',
          message: `${targets.length} versões receberam defaults editoriais de estudo.`,
          type: 'success',
        });
      }
    } finally {
      setIsBatchApplyingStudyDefaults(false);
      setBatchStudyDefaultsProgress({ completed: 0, total: 0 });
    }
  };

  const handleBatchRebuildSections = async () => {
    const targets = rebuildSectionsBatch.filter((status) => status.versionId && status.sectionsCount <= 0);
    if (targets.length === 0) {
      return;
    }

    const failures: Array<{ id: number; message: string }> = [];
    try {
      setIsBatchRebuildingSections(true);
      setBatchRebuildSectionsProgress({ completed: 0, total: targets.length });

      let completed = 0;
      for (const status of targets) {
        try {
          if (!status.versionId) {
            throw new Error('Versão V2 ausente.');
          }
          await rebuildCifraVersionSectionsFromStoredContent(status.versionId);
        } catch (rebuildSectionsError: any) {
          failures.push({
            id: status.legacyId,
            message: rebuildSectionsError?.message || 'Erro desconhecido durante a reconstrução de seções.',
          });
        } finally {
          completed += 1;
          setBatchRebuildSectionsProgress({ completed, total: targets.length });
        }
      }

      await loadCifras();
      if (failures.length > 0) {
        setLastBatchFailures((previous) => [...failures, ...previous].slice(0, 20));
        setAlert({
          isOpen: true,
          title: 'Reconstrução de seções com pendências',
          message: `${targets.length - failures.length} versões receberam seções reconstruídas. ${failures.length} falharam.`,
          type: 'error',
        });
      } else {
        setAlert({
          isOpen: true,
          title: 'Seções reconstruídas em lote',
          message: `${targets.length} versões receberam seções automaticamente.`,
          type: 'success',
        });
      }
    } finally {
      setIsBatchRebuildingSections(false);
      setBatchRebuildSectionsProgress({ completed: 0, total: 0 });
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
          <Link
            to="/admin/cifras-v2/revisao"
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 font-semibold rounded-xl transition-colors border border-emerald-500/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            Revisão V2
          </Link>
          <button
            type="button"
            onClick={() => setShowBatchConfirm(true)}
            disabled={isBatchMigrating || pendingBatch.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
          >
            <Wand2 className="w-5 h-5" />
            {isBatchMigrating
              ? `Processando ${batchProgress.completed}/${batchProgress.total}`
              : pendingBatch.length > 0
                ? `Rodar ${pendingBatch.length} ${hasActiveFilters ? 'do filtro' : 'pendentes'}`
              : hasActiveFilters && totalPending > 0
                  ? 'Nenhuma pendente no filtro'
                  : 'V2 em dia'}
          </button>
          <button
            type="button"
            onClick={() => void handleBatchPromote()}
            disabled={isBatchPromoting || promoteBatch.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
          >
            <Rocket className="w-5 h-5" />
            {isBatchPromoting
              ? `Promovendo ${batchPromoteProgress.completed}/${batchPromoteProgress.total}`
              : promoteBatch.length > 0
                ? `Levar ${promoteBatch.length} ao catálogo`
                : 'Sem promoção pendente'}
          </button>
          <button
            type="button"
            onClick={() => void handleBatchRebuildSections()}
            disabled={isBatchRebuildingSections || rebuildSectionsBatch.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors"
          >
            <Wand2 className="w-5 h-5" />
            {isBatchRebuildingSections
              ? `Seções ${batchRebuildSectionsProgress.completed}/${batchRebuildSectionsProgress.total}`
              : rebuildSectionsBatch.length > 0
                ? `Gerar seções em ${rebuildSectionsBatch.length}`
                : 'Sem seções pendentes'}
          </button>
          <button
            type="button"
            onClick={() => void handleBatchApplyStudyDefaults()}
            disabled={isBatchApplyingStudyDefaults || studyDefaultsBatch.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            {isBatchApplyingStudyDefaults
              ? `Study ${batchStudyDefaultsProgress.completed}/${batchStudyDefaultsProgress.total}`
              : studyDefaultsBatch.length > 0
                ? `Aplicar study em ${studyDefaultsBatch.length}`
                : 'Sem study pendente'}
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
              <p className="text-cyan-300 font-medium">Executando rollout do legado para o catálogo V2</p>
              <p className="text-sm text-cyan-100/80 mt-1">
                {batchProgress.completed} de {batchProgress.total} etapas processadas.
              </p>
            </div>
            <p className="text-sm text-cyan-200">
              O lote migra, reavalia e promove ao catálogo tudo que ficar elegível no mesmo fluxo.
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

      {isBatchPromoting && (
        <div className="mb-6 bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-primary-300 font-medium">Promovendo versões V2 para o catálogo público</p>
              <p className="text-sm text-primary-100/80 mt-1">
                {batchPromoteProgress.completed} de {batchPromoteProgress.total} versões processadas.
              </p>
            </div>
            <p className="text-sm text-primary-200">
              Publicação e busca serão ajustadas automaticamente quando necessário.
            </p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-primary-400 transition-all"
              style={{
                width: `${batchPromoteProgress.total > 0 ? (batchPromoteProgress.completed / batchPromoteProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {isBatchApplyingStudyDefaults && (
        <div className="mb-6 bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-violet-300 font-medium">Aplicando study defaults editoriais</p>
              <p className="text-sm text-violet-100/80 mt-1">
                {batchStudyDefaultsProgress.completed} de {batchStudyDefaultsProgress.total} versões processadas.
              </p>
            </div>
            <p className="text-sm text-violet-200">
              O modo estudo passa a abrir automaticamente pela primeira seção disponível.
            </p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-violet-400 transition-all"
              style={{
                width: `${batchStudyDefaultsProgress.total > 0 ? (batchStudyDefaultsProgress.completed / batchStudyDefaultsProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {isBatchRebuildingSections && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-amber-300 font-medium">Reconstruindo seções a partir do conteúdo armazenado</p>
              <p className="text-sm text-amber-100/80 mt-1">
                {batchRebuildSectionsProgress.completed} de {batchRebuildSectionsProgress.total} versões processadas.
              </p>
            </div>
            <p className="text-sm text-amber-200">
              O lote reaproveita `body_ast` e cai para `body_text` quando necessário.
            </p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{
                width: `${batchRebuildSectionsProgress.total > 0 ? (batchRebuildSectionsProgress.completed / batchRebuildSectionsProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {!isBatchMigrating && lastBatchFailures.length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-red-300 font-medium">Falhas no último lote operacional</p>
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
              <p className="text-xs text-gray-400 mt-2">
                Cobertura do catálogo: {rolloutStats.catalogCoveragePercent}% (
                {rolloutStats.eligibleCatalogVersions > 0
                  ? `${rolloutStats.eligibleCatalogVersions - rolloutStats.pendingCatalogVersions}/${rolloutStats.eligibleCatalogVersions} versões elegíveis`
                  : 'sem versões elegíveis ainda'}
                ).
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm min-w-0">
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
                <p className="text-gray-400">Elegíveis</p>
                <p className="text-white font-semibold">{rolloutStats.eligibleCatalogVersions}</p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-gray-400">Fora catálogo</p>
                <p className="text-white font-semibold">{rolloutStats.pendingCatalogVersions}</p>
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

      {rolloutStats && (
        <section className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4" aria-labelledby="cifras-status-heading">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="cifras-status-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-300">
                Estado real das versões V2
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Estes números vêm de <code>cifra_versions</code> e da fila editorial; não são a contagem da tabela legada <code>cifras</code>.
              </p>
            </div>
            <p className="text-xs text-gray-500">Total V2: {rolloutStats.versionsTotal}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {[
              { label: 'Publicadas', value: rolloutStats.publishedVersions, tone: 'text-emerald-300' },
              { label: 'Rascunhos', value: rolloutStats.draftVersions, tone: 'text-amber-300' },
              { label: 'Em revisão', value: rolloutStats.inReviewVersions, tone: 'text-cyan-300' },
              { label: 'Alterações solicitadas', value: rolloutStats.changesRequestedReviewItems, tone: 'text-orange-300' },
              { label: 'Reprovadas', value: rolloutStats.rejectedReviewItems, tone: 'text-red-300' },
              { label: 'Arquivadas', value: rolloutStats.archivedVersions, tone: 'text-gray-300' },
              { label: 'Sem conteúdo', value: rolloutStats.versionsWithoutContent, tone: 'text-rose-300' },
              { label: 'Fila pendente', value: rolloutStats.pendingReviewItems, tone: 'text-violet-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <p className="text-xs leading-4 text-gray-500">{item.label}</p>
                <p className={`mt-1 text-xl font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-100/80">
            <strong className="text-amber-200">A revisar:</strong>{' '}
            {rolloutStats.draftVersions + rolloutStats.inReviewVersions + rolloutStats.approvedVersions + rolloutStats.changesRequestedReviewItems}{' '}
            versões aguardam decisão editorial. Os 26 hinos recém-criados permanecem nesta área e não são publicados automaticamente.
          </div>
        </section>
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
          onChange={e => setFilterV2Status(e.target.value as 'all' | 'pending' | 'migrated' | 'catalog' | 'promotable' | 'missing-sections' | 'missing-study')}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todas as cifras</option>
          <option value="pending">Somente V2 pendentes</option>
          <option value="migrated">Somente V2 migradas</option>
          <option value="promotable">Prontas para catálogo</option>
          <option value="catalog">Já no catálogo V2</option>
          <option value="missing-sections">V2 sem seções</option>
          <option value="missing-study">V2 sem study defaults</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'pending', label: 'Pendentes', count: totalPending },
            { key: 'promotable', label: 'Prontas para catálogo', count: promotableCount },
            { key: 'missing-sections', label: 'Sem seções', count: rebuildableCount || missingSectionsCount },
            { key: 'missing-study', label: 'Sem study', count: missingStudyCount },
            { key: 'catalog', label: 'No catálogo', count: catalogVisibleCount },
          ].map((item) => {
          const isActive = filterV2Status === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterV2Status((current) => (current === item.key ? 'all' : item.key as typeof filterV2Status))}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-500 text-black font-semibold'
                  : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <span>{item.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-black/15' : 'bg-black/30 text-gray-200'}`}>
                {item.count}
              </span>
            </button>
          );
        })}
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
            {hasActiveFilters ? 'Nenhuma cifra encontrada' : 'Nenhuma cifra cadastrada'}
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters ? 'Tente ajustar os filtros' : 'Comece adicionando a primeira cifra'}
          </p>
          {!hasActiveFilters && (
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getV2StatusTone(migrationStatuses[cifra.id])}`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {getV2StatusLabel(migrationStatuses[cifra.id])}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          V2 pendente
                        </span>
                        )}
                        {migrationStatuses[cifra.id]?.versionId && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              migrationStatuses[cifra.id].versionIsPrimary
                                ? 'bg-primary-500/20 text-primary-300'
                                : 'bg-gray-700/60 text-gray-300'
                            }`}>
                              {migrationStatuses[cifra.id].versionIsPrimary ? 'Principal' : 'Secundária'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              migrationStatuses[cifra.id].versionIsSearchable
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {migrationStatuses[cifra.id].versionIsSearchable ? 'Busca on' : 'Busca off'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              migrationStatuses[cifra.id].hasStudyDefaults
                                ? 'bg-violet-500/20 text-violet-300'
                                : 'bg-gray-700/60 text-gray-300'
                            }`}>
                              {migrationStatuses[cifra.id].hasStudyDefaults ? 'Estudo pronto' : 'Sem defaults'}
                            </span>
                            {getV2ReadinessIssues(migrationStatuses[cifra.id]).map((issue) => (
                              <span
                                key={`${cifra.id}-${issue}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300"
                              >
                                Falta {issue}
                              </span>
                            ))}
                          </div>
                        )}
                        {migrationStatuses[cifra.id]?.versionId && !migrationStatuses[cifra.id].publicCatalogVisible && migrationStatuses[cifra.id].sectionsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => void handlePromoteVersion(migrationStatuses[cifra.id])}
                            disabled={promotingVersionId === migrationStatuses[cifra.id].versionId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            {promotingVersionId === migrationStatuses[cifra.id].versionId ? 'Enviando...' : 'Levar ao catálogo'}
                          </button>
                        )}
                        {canPrepareVersion(migrationStatuses[cifra.id]) && (
                          <button
                            type="button"
                            onClick={() => void handlePrepareVersion(migrationStatuses[cifra.id])}
                            disabled={preparingVersionId === migrationStatuses[cifra.id].versionId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            {preparingVersionId === migrationStatuses[cifra.id].versionId ? 'Preparando...' : 'Preparar V2'}
                          </button>
                        )}
                        {canRebuildSections(migrationStatuses[cifra.id]) && (
                          <button
                            type="button"
                            onClick={() => void handleRebuildSections(migrationStatuses[cifra.id])}
                            disabled={rebuildingSectionsVersionId === migrationStatuses[cifra.id].versionId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            {rebuildingSectionsVersionId === migrationStatuses[cifra.id].versionId ? 'Gerando...' : 'Gerar seções'}
                          </button>
                        )}
                        {canApplyStudyDefaults(migrationStatuses[cifra.id]) && (
                          <button
                            type="button"
                            onClick={() => void handleApplyStudyDefaults(migrationStatuses[cifra.id])}
                            disabled={applyingStudyDefaultsVersionId === migrationStatuses[cifra.id].versionId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {applyingStudyDefaultsVersionId === migrationStatuses[cifra.id].versionId ? 'Aplicando...' : 'Aplicar study'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={getCifraViewPath(cifra)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title={migrationStatuses[cifra.id]?.publicCatalogVisible ? 'Visualizar página pública' : 'Visualizar preview admin'}
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
                        {migrationStatuses[cifra.id]?.publicPath && (
                          <Link
                            to={getCifraViewPath(cifra)}
                            className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400 hover:text-emerald-300"
                            title={migrationStatuses[cifra.id].publicCatalogVisible ? 'Abrir página pública V2' : 'Abrir preview admin da versão V2'}
                            target="_blank"
                          >
                            <ExternalLink className="w-4 h-4" />
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
