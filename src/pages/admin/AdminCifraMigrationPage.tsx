import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, Music, PenSquare, Sparkles, Wand2 } from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/ui/AlertModal';
import {
  fetchLegacyCifraMigrationStatuses,
  migrateLegacyCifraById,
  previewLegacyCifraMigrationById,
  type LegacyCifraMigrationPreview,
  type LegacyCifraMigrationStatus,
} from '@/lib/admin/cifrasV2AdminApi';

const AdminCifraMigrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const legacyId = Number(id);

  const [preview, setPreview] = useState<LegacyCifraMigrationPreview | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<LegacyCifraMigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    void loadPage();
  }, [legacyId]);

  const loadPage = async () => {
    if (!legacyId) {
      setError('ID de cifra inválido.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [previewResult, statuses] = await Promise.all([
        previewLegacyCifraMigrationById(legacyId),
        fetchLegacyCifraMigrationStatuses([legacyId]),
      ]);

      if (!previewResult) {
        setError('Cifra legada não encontrada.');
        return;
      }

      setPreview(previewResult);
      setMigrationStatus(statuses[legacyId] ?? null);
    } catch (pageError: any) {
      console.error('Erro ao carregar preview de migração:', pageError);
      setError(pageError?.message || 'Erro ao carregar preview de migração.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!legacyId) return;

    try {
      setIsMigrating(true);
      const result = await migrateLegacyCifraById(legacyId, {
        publishActive: true,
        markAsPrimary: true,
      });

      if (!result) {
        throw new Error('Cifra legada não encontrada para migração.');
      }

      const statuses = await fetchLegacyCifraMigrationStatuses([legacyId]);
      setMigrationStatus(statuses[legacyId] ?? null);
      setAlert({
        isOpen: true,
        title: 'Migração concluída',
        message: `A cifra legada #${legacyId} foi migrada para o módulo v2 com status ${result.status}.`,
        type: 'success',
      });
    } catch (migrationError: any) {
      console.error('Erro ao migrar cifra legada:', migrationError);
      setAlert({
        isOpen: true,
        title: 'Erro na migração',
        message: migrationError?.message || 'Não foi possível migrar a cifra legada.',
        type: 'error',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <button
          onClick={() => navigate('/admin/cifras')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para cifras
        </button>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300">
          {error || 'Preview indisponível.'}
        </div>
      </div>
    );
  }

  const isMigrated = Boolean(migrationStatus?.versionId);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/cifras')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para cifras
          </button>

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary-400" />
            Migrar Cifra para V2
          </h1>
          <p className="text-gray-400 mt-2">
            Preview da conversão da cifra legada para o novo modelo estruturado de cifras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/admin/cifras/${legacyId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
            Editar legado
          </Link>

          {isMigrated && migrationStatus?.versionId ? (
            <Link
              to={`/admin/cifras-v2/versions/${migrationStatus.versionId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-xl transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              Abrir editor V2
            </Link>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isMigrating}
              className="inline-flex items-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-black font-semibold rounded-xl transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              {isMigrating ? 'Migrando...' : 'Migrar agora'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-2">Cifra legada</p>
          <h2 className="text-xl font-semibold text-white">{preview.legacy.title}</h2>
          <p className="text-gray-400 mt-1">{preview.legacy.artist || 'Sem compositor informado'}</p>
          <div className="mt-4 space-y-2 text-sm text-gray-300">
            <p>Instrumento: <span className="text-white">{preview.legacy.instrument}</span></p>
            <p>Tom: <span className="text-white">{preview.legacy.original_key}</span></p>
            <p>Categoria: <span className="text-white">{preview.legacy.category}</span></p>
            <p>Status legado: <span className={preview.legacy.is_active ? 'text-green-400' : 'text-red-400'}>{preview.legacy.is_active ? 'Ativa' : 'Inativa'}</span></p>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-2">Destino V2</p>
          <div className="space-y-2 text-sm text-gray-300">
            <p>Song slug: <span className="text-white">{preview.inferred.canonicalSlug}</span></p>
            <p>Version slug: <span className="text-white">{preview.inferred.publicSlug}</span></p>
            <p>Tipo de fonte: <span className="text-white">{preview.inferred.sourceType}</span></p>
            <p>Arranjo: <span className="text-white">{preview.inferred.arrangementType}</span></p>
            <p>Número do hinário: <span className="text-white">{preview.inferred.hinarioNumero ?? 'Não identificado'}</span></p>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-2">Status da migração</p>
          {isMigrated ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Migrada
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Version ID: <span className="text-white break-all">{migrationStatus?.versionId}</span></p>
                <p>Status V2: <span className="text-white">{migrationStatus?.versionStatus}</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">
                <Music className="w-4 h-4" />
                Pendente
              </div>
              <p className="text-sm text-gray-400">
                Esta cifra ainda não foi convertida para o modelo v2.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr,1fr] gap-4">
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-white">Seções estruturadas</h2>
              <p className="text-gray-400 text-sm mt-1">
                {preview.inferred.sectionsCount} seções, {preview.inferred.linesCount} linhas, {preview.inferred.chordsIndex.length} acordes indexados
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {preview.sections.map((section) => (
              <div key={`${section.order}-${section.label}`} className="border border-gray-700 rounded-xl p-4 bg-black/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">{section.label}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">{section.key}</p>
                  </div>
                  <span className="text-xs text-gray-500">{section.lines.length} linhas</span>
                </div>
                <pre className="mt-3 text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-hidden">
                  {section.lines.map((line) => line.text ?? '').join('\n').slice(0, 400) || 'Sem conteúdo textual'}
                </pre>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white">Acordes detectados</h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {preview.inferred.chordsIndex.length > 0 ? (
                preview.inferred.chordsIndex.map((chord) => (
                  <span key={chord} className="px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-300 text-sm font-medium">
                    {chord}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400">Nenhum acorde detectado.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white">Observações</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>A migração preserva a cifra legada em `metadata` para auditoria.</li>
              <li>O conteúdo é convertido em seções e pode ser refinado no editor V2.</li>
              <li>Se a cifra legada estiver ativa, a migração publica a versão V2 por padrão.</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleMigrate}
        title="Migrar cifra para V2?"
        message={`A cifra legada #${legacyId} será convertida para o módulo novo de cifras, com publicação estruturada e histórico de revisão.`}
        confirmText="Migrar"
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

export default AdminCifraMigrationPage;
