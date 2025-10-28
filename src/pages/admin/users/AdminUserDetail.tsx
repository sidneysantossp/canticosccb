import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Ban, Mail, Crown, Music, List, Clock } from 'lucide-react';

const AdminUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = {
    id: 1,
    avatar: 'https://i.pravatar.cc/150?img=1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    plan: 'premium',
    status: 'active',
    joinDate: '2023-06-15',
    lastAccess: '2024-01-22 14:30',
    playlists: 12,
    totalPlays: 1547,
    likedSongs: 234,
    followers: 45,
    location: 'São Paulo, SP',
    birthdate: '1990-05-15'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">Perfil do Usuário</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-6">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  {user.plan === 'premium' && (
                    <Crown className="w-6 h-6 text-yellow-500" />
                  )}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                  </span>
                </div>

                <div className="space-y-2 text-gray-400 mb-4">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                  <p className="md:hidden flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Membro desde {user.joinDate}
                  </p>
                  <p>{user.phone}</p>
                  <p>{user.location}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/admin/users/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    Suspender
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Enviar Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Atividade</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400">Total de Plays</span>
                  </div>
                  <span className="text-white font-bold">{user.totalPlays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-green-400" />
                    <span className="text-gray-400">Playlists</span>
                  </div>
                  <span className="text-white font-bold">{user.playlists}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-red-400" />
                    <span className="text-gray-400">Músicas Curtidas</span>
                  </div>
                  <span className="text-white font-bold">{user.likedSongs}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Plano</p>
                  <p className="text-white capitalize">{user.plan}</p>
                </div>
                <div>
                  <div className="hidden md:block">
                    <p className="text-gray-400 mb-1">Membro desde</p>
                    <p className="text-white">{user.joinDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Último acesso</p>
                  <p className="text-white">{user.lastAccess}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Histórico de Atividades</h3>
            <div className="space-y-3">
              {[
                { action: 'Criou playlist', detail: 'Meus Favoritos', time: '2h atrás' },
                { action: 'Curtiu hino', detail: 'Hino 50', time: '5h atrás' },
                { action: 'Seguiu compositor', detail: 'Coral CCB', time: '1 dia atrás' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-gray-400 text-xs">{activity.detail}</p>
                  </div>
                  <span className="text-gray-500 text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Gráfico de Uso</h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              [Gráfico de Atividade]
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Playlists Públicas</h3>
            <div className="space-y-2">
              {['Meus Favoritos', 'Adoração', 'Para Meditar'].map((playlist, index) => (
                <div key={index} className="p-2 bg-gray-800/50 rounded-lg text-white text-sm">
                  {playlist}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
