import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Eye, Flag, XCircle } from 'lucide-react';
import { getReportById, updateReportStatus, type Report } from '@/lib/admin/reportsApi';

const statusOptions: Array<{ value: Report['status']; label: string; icon: React.ComponentType<any> }> = [
  { value: 'open', label: 'Aberta', icon: Flag },
  { value: 'in_review', label: 'Em análise', icon: Eye },
  { value: 'resolved', label: 'Resolvida', icon: CheckCircle },
  { value: 'rejected', label: 'Rejeitada', icon: XCircle },
];

const AdminReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        const fetched = await getReportById(id);
        if (!fetched) {
          setError('Denúncia não encontrada.');
          return;
        }
        setReport(fetched);
      } catch (err: any) {
        console.error('Erro ao carregar denúncia:', err);
        setError(err?.message || 'Erro ao carregar denúncia.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadReport();
  }, [id]);

  const handleStatusChange = async (status: Report['status']) => {
    if (!report || isUpdating) return;

    try {
      setIsUpdating(true);
      await updateReportStatus(report.id, status);
      setReport({ ...report, status });
    } catch (err) {
      console.error('Erro ao atualizar denúncia:', err);
      alert('Não foi possível atualizar o status da denúncia.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando denúncia...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Falha ao abrir denúncia</h2>
          <p className="text-red-300 mb-4">{error || 'Denúncia não encontrada.'}</p>
          <button
            onClick={() => navigate('/admin/reports')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Voltar para denúncias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/reports')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Denúncia #{report.id}</h1>
          <p className="text-gray-400">Acompanhe e trate esta ocorrência.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Flag className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">{report.title}</h2>
            </div>
            <p className="text-gray-300 mb-4">{report.description || 'Sem descrição adicional informada.'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Tipo</p>
                <p className="text-white capitalize">{report.type}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Motivo</p>
                <p className="text-white">{report.reason}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Denunciante</p>
                <p className="text-white">{report.reporter || 'Anônimo'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Data</p>
                <p className="text-white">{new Date(report.date).toLocaleString('pt-BR')}</p>
              </div>
              {report.target_song_id ? (
                <div>
                  <p className="text-gray-400 mb-1">Alvo: hino</p>
                  <p className="text-white">#{report.target_song_id}</p>
                </div>
              ) : null}
              {report.target_user_id ? (
                <div>
                  <p className="text-gray-400 mb-1">Alvo: usuário</p>
                  <p className="text-white">#{report.target_user_id}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Ações rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const active = report.status === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isUpdating || active}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-gray-700 hover:border-gray-600 text-white'
                    } disabled:opacity-60`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-white capitalize">{report.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prioridade</span>
                <span className="text-white capitalize">{report.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Atualização</span>
                <span className="text-white">{isUpdating ? 'Salvando...' : 'Pronta'}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
              <p className="text-yellow-200 text-sm">
                Esta tela atualiza o status da denúncia no backend real. Se precisar tratar o conteúdo alvo,
                faça a moderação no módulo correspondente depois.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetail;
