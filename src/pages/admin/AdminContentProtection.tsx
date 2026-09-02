import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle, FileText, Library, Save, Shield } from 'lucide-react';
import {
  getContentProtectionSettings,
  saveContentProtectionSettings,
} from '@/lib/admin/contentProtectionAdminApi';
import {
  DEFAULT_CONTENT_PROTECTION_SETTINGS,
  type ContentProtectionDirectory,
  type ContentProtectionSettings,
} from '@/lib/contentProtectionConfig';

const directoryOptions: Array<{
  id: ContentProtectionDirectory;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'hinario',
    title: 'Hinário',
    description: 'Bloqueia seleção, cópia, recorte e menu de contexto nas páginas do Hinário.',
    icon: Library,
  },
  {
    id: 'cifras',
    title: 'Cifras',
    description: 'Protege as cifras de violão, ukulele e teclado contra cópia direta.',
    icon: FileText,
  },
  {
    id: 'biblia',
    title: 'Bíblia',
    description: 'Impede a cópia do conteúdo nas páginas de livros, capítulos e leitura bíblica.',
    icon: BookOpen,
  },
];

const AdminContentProtection: React.FC = () => {
  const [settings, setSettings] = useState<ContentProtectionSettings>(
    DEFAULT_CONTENT_PROTECTION_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getContentProtectionSettings()
      .then((value) => {
        if (active) setSettings(value);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : 'Não foi possível carregar as configurações.';
        setError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggle = (directory: ContentProtectionDirectory) => {
    setSuccess(null);
    setSettings((current) => ({ ...current, [directory]: !current[directory] }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      await saveContentProtectionSettings(settings);
      setSuccess('Configurações salvas. A alteração será aplicada ao recarregar a página pública.');
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : 'Não foi possível salvar as configurações.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-xl border border-primary-500/20 bg-primary-500/10 p-2.5">
              <Shield className="h-6 w-6 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Proteção de conteúdo</h1>
          </div>
          <p className="max-w-2xl text-sm text-gray-400 sm:text-base">
            Escolha em quais diretórios a cópia deve permanecer bloqueada. Checkbox marcado significa proteção ativa.
          </p>
        </div>
      </header>

      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 text-sm text-primary-100">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40">
        <div className="border-b border-gray-800 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-white">Diretórios protegidos</h2>
          <p className="mt-1 text-sm text-gray-500">Você pode alterar cada diretório de forma independente.</p>
        </div>

        <div className="divide-y divide-gray-800">
          {directoryOptions.map(({ id, title, description, icon: Icon }) => (
            <label
              key={id}
              htmlFor={`content-protection-${id}`}
              className="flex cursor-pointer items-start gap-4 px-5 py-5 transition-colors hover:bg-white/[0.025] sm:items-center sm:px-6"
            >
              <span className="mt-0.5 rounded-lg bg-gray-800 p-2 sm:mt-0">
                <Icon className="h-5 w-5 text-gray-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${settings[id] ? 'bg-primary-500/15 text-primary-300' : 'bg-gray-800 text-gray-400'}`}>
                    {settings[id] ? 'Proteção ativa' : 'Cópia permitida'}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-500">{description}</span>
              </span>
              <input
                id={`content-protection-${id}`}
                type="checkbox"
                checked={settings[id]}
                disabled={isLoading || isSaving}
                onChange={() => handleToggle(id)}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
                aria-label={`Ativar proteção de cópia em ${title}`}
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 font-semibold text-black transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
};

export default AdminContentProtection;
