import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Shield, Music, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';

const AdminComposerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const composer = {
    id: 1,
    avatar: 'https://i.pravatar.cc/150?img=11',
    name: 'João Silva',
    artisticName: 'João Silva',
    email: 'joao@email.com',
    type: 'Solo',
    verified: true,
    status: 'active',
    joinDate: '2023-01-15',
    totalSongs: 15,
    totalPlays: 125400,
    followers: 8200,
    royalties: 5234.50,
    biography: 'Compositor há mais de 10 anos, dedica sua música à glória de Deus...',
    location: 'São Paulo, SP',
    social: {
      instagram: '@joaosilva',
      facebook: 'joaosilvamusic',
      youtube: '@joaosilva'
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/composers')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">Perfil do Compositor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-6">
              <img
                src={composer.avatar}
                alt={composer.name}
                className="w-32 h-32 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{composer.artisticName}</h2>
                  {composer.verified && (
                    <Shield className="w-6 h-6 text-blue-400" title="Verificado" />
                  )}
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                    {composer.type}
                  </span>
                </div>

                <div className="space-y-2 text-gray-400 mb-4">
                  <p>{composer.email}</p>
                  <p className="md:hidden flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Membro desde {composer.joinDate}
                  </p>
                </div>

                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => navigate(`/admin/composers/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {!composer.verified && (
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Verificar
                    </button>
                  )}
                </div>

                <p className="text-gray-300 text-sm">{composer.biography}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <Music className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-gray-400 text-xs mb-1">Hinos</p>
              <p className="text-2xl font-bold text-white">{composer.totalSongs}</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <TrendingUp className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-gray-400 text-xs mb-1">Plays</p>
              <p className="text-2xl font-bold text-white">{(composer.totalPlays / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <Users className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-gray-400 text-xs mb-1">Seguidores</p>
              <p className="text-2xl font-bold text-white">{(composer.followers / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <DollarSign className="w-8 h-8 text-yellow-400 mb-2" />
              <p className="text-gray-400 text-xs mb-1">Royalties</p>
              <p className="text-2xl font-bold text-white">R$ {composer.royalties.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Hinos Publicados</h3>
            <div className="space-y-2">
              {['Hino da Paz', 'Glória Eterna', 'Cântico de Louvor'].map((song, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-white">{song}</span>
                  <span className="text-gray-400 text-sm">2.5K plays</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Informações</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Nome Real</p>
                <p className="text-white">{composer.name}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Localização</p>
                <p className="text-white">{composer.location}</p>
              </div>
              <div className="hidden md:block">
                <p className="text-gray-400 mb-1">Membro desde</p>
                <p className="text-white">{composer.joinDate}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Redes Sociais</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Instagram</span>
                <span className="text-white">{composer.social.instagram}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Facebook</span>
                <span className="text-white">{composer.social.facebook}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">YouTube</span>
                <span className="text-white">{composer.social.youtube}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Performance</h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              [Gráfico de Crescimento]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComposerDetail;
