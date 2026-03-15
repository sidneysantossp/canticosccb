import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { fetchLegacyCifraMigrationStatuses } from '@/lib/admin/cifrasV2AdminApi';

const AdminCifraForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const redirectToV2Flow = async () => {
      try {
        setError(null);

        if (isNew) {
          navigate('/admin/cifras-v2/new', { replace: true });
          return;
        }

        const legacyId = Number(id);
        if (!Number.isFinite(legacyId)) {
          throw new Error('Identificador de cifra inválido.');
        }

        const statuses = await fetchLegacyCifraMigrationStatuses([legacyId]);
        if (cancelled) {
          return;
        }

        const status = statuses[legacyId];
        if (status?.versionId) {
          navigate(`/admin/cifras-v2/versions/${status.versionId}/edit`, { replace: true });
          return;
        }

        navigate(`/admin/cifras/${legacyId}/migrate`, { replace: true });
      } catch (routeError: any) {
        if (!cancelled) {
          console.error('Erro ao redirecionar fluxo legado de cifra:', routeError);
          setError(routeError?.message || 'Não foi possível abrir o fluxo V2 da cifra.');
        }
      }
    };

    void redirectToV2Flow();

    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Link
          to="/admin/cifras"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para cifras
        </Link>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16">
      <div className="rounded-3xl border border-primary-500/20 bg-gray-800/30 p-8 text-center">
        <Sparkles className="w-10 h-10 text-primary-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Abrindo o fluxo de Cifras V2</h1>
        <p className="text-gray-400 mt-3">
          O formulário legado foi substituído pelo editor novo. Você será redirecionado automaticamente.
        </p>
      </div>
    </div>
  );
};

export default AdminCifraForm;
