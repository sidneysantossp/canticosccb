import React, { useState, useEffect } from 'react';
import { CheckCircle, Search, Eye, Edit, Ban, Music, Award } from 'lucide-react';
import { compositoresApi } from '@/lib/api-client';
import { Link } from 'react-router-dom';

interface Composer {
  id: number;
  nome: string;
  nome_artistico?: string;
  email?: string;
  verificado: boolean;
  created_at: string;
}

const AdminComposersVerified: React.FC = () => {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVerifiedComposers();
  }, []);

  const loadVerifiedComposers = async () => {
    try {
      setIsLoading(true);
      console.log('✅ [Verified] Carregando compositores verificados...');
      
      const response = await compositoresApi.list({ limit: 100 });
      console.log('✅ [Verified] Resposta API:', response);
      
      if (response.data) {
        const apiData = response.data as any;
        const allComposers = apiData.compositores || [];
        
        // Filtrar apenas verificados
        const verified = allComposers.filter((c: any) => c.verificado);
        console.log('✅ [Verified] Compositores verificados:', verified);
        
        setComposers(verified);
      }
    } catch (error) {
      console.error('❌ [Verified] Erro ao carregar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVerification = async (id: number, name: string) => {
    if (!window.confirm(`Remover verificação de "${name}"?`)) return;

    try {
      await compositoresApi.update(id, { verificado: 0 });
      loadVerifiedComposers();
    } catch (error) {
      console.error('Error removing verification:', error);
      alert('Erro ao remover verificação');
    }
  };

  const filteredComposers = composers.filter(c =>
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nome_artistico?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Removed page-level loading to render instantly

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Compositores Verificados</h1>
        <p className="text-gray-400">Total: {composers.length} compositores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Verificados</p>
              <p className="text-2xl font-bold text-white">{composers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Com Nome Artístico</p>
              <p className="text-2xl font-bold text-white">
                {composers.filter(c => c.nome_artistico).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Com Email</p>
              <p className="text-2xl font-bold text-white">
                {composers.filter(c => c.email).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar compositor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
          />
        </div>
      </div>

      {/* Composers Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Compositor
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Nome Artístico
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredComposers.map((composer) => (
              <tr key={composer.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-white font-medium">{composer.nome}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-300">{composer.email || '-'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-300">{composer.nome_artistico || '-'}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                    Verificado
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/admin/composers/edit/${composer.id}`}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </Link>
                    <button
                      onClick={() => handleRemoveVerification(composer.id, composer.nome)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Remover verificação"
                    >
                      <Ban className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredComposers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg">
            {searchQuery
              ? 'Nenhum compositor encontrado'
              : 'Nenhum compositor verificado ainda'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminComposersVerified;
