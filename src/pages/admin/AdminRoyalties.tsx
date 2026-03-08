import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, Download, Filter, Search, TrendingUp } from 'lucide-react';
import { getRoyalties, processPayment, type RoyaltyRecord } from '@/lib/admin/royaltiesAdminApi';

const getStatusBadge = (status: string) => {
  const styles = {
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels = {
    paid: 'Pago',
    processing: 'Processando',
    pending: 'Pendente',
  };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

const AdminRoyalties: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [royalties, setRoyalties] = useState<RoyaltyRecord[]>([]);

  useEffect(() => {
    void loadRoyalties();
  }, []);

  const loadRoyalties = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRoyalties(await getRoyalties());
    } catch (err: any) {
      console.error('Erro ao carregar royalties:', err);
      setError(err?.message || 'Erro ao carregar royalties');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoyalties = useMemo(
    () =>
      royalties
        .filter((royalty) => filterStatus === 'all' || royalty.status === filterStatus)
        .filter((royalty) => royalty.composer.toLowerCase().includes(searchQuery.toLowerCase())),
    [filterStatus, royalties, searchQuery]
  );

  const totalRevenue = royalties.reduce((sum, royalty) => sum + royalty.revenue, 0);
  const totalStreams = royalties.reduce((sum, royalty) => sum + royalty.streams, 0);
  const pendingPayments = royalties.filter((royalty) => royalty.status === 'pending').length;

  const handleProcess = async (id: string) => {
    try {
      await processPayment(id);
      await loadRoyalties();
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
    }
  };

  const handleExport = () => {
    if (filteredRoyalties.length === 0) return;

    const headers = ['compositor', 'periodo', 'streams', 'receita', 'status'];
    const lines = [
      headers.join(','),
      ...filteredRoyalties.map((royalty) =>
        [
          royalty.composer,
          royalty.month,
          royalty.streams,
          royalty.revenue.toFixed(2),
          royalty.status,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `royalties_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando royalties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar royalties</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={() => loadRoyalties()} className="btn-primary">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Royalties</h1>
          <p className="text-gray-400">Gestão de pagamentos aos compositores</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Exportar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Receita Total</p>
              <p className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Streams</p>
              <p className="text-2xl font-bold text-white">{totalStreams.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pagamentos Pendentes</p>
              <p className="text-2xl font-bold text-white">{pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar compositor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
            >
              <option value="all">Todos os Status</option>
              <option value="paid">Pagos</option>
              <option value="processing">Processando</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Compositor</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Período</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Streams</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Receita</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredRoyalties.map((royalty) => (
              <tr key={royalty.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{royalty.composer}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-300">{royalty.month}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-300">{royalty.streams.toLocaleString('pt-BR')}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(royalty.revenue)}
                  </p>
                </td>
                <td className="px-6 py-4">{getStatusBadge(royalty.status)}</td>
                <td className="px-6 py-4 text-right">
                  {royalty.status === 'pending' ? (
                    <button
                      onClick={() => handleProcess(royalty.id)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Processar
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">Sem ação</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRoyalties.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg">Nenhum royalty encontrado</p>
        </div>
      )}
    </div>
  );
};

export default AdminRoyalties;
