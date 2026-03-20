import React from 'react';
import { ArrowRight, Ban, ShieldAlert, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminSettingsPremium: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configuracoes de Premium (descontinuado)</h1>
        <p className="text-gray-400">A plataforma nao opera mais assinatura premium. O modelo atual e ativacao por cadastro.</p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-yellow-300 mt-0.5" />
          <div>
            <h2 className="text-yellow-100 font-semibold">Superficie administrativa neutralizada</h2>
            <p className="text-yellow-200/90 text-sm mt-1">
              Esta area foi mantida apenas para compatibilidade de rota e para evitar erro em links antigos do admin. Nao ha configuracao
              ativa de premium nesta plataforma.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/admin/users/premium')}
          className="text-left bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-primary-600 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary-400" />
            <h3 className="text-white font-semibold">Limpeza de usuarios premium legados</h3>
          </div>
          <p className="text-gray-400 text-sm">Revise e mova usuarios legados para plano gratuito.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-primary-300 text-sm">
            Abrir limpeza
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/settings/users')}
          className="text-left bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-primary-600 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <Ban className="w-5 h-5 text-red-400" />
            <h3 className="text-white font-semibold">Voltar para configuracoes ativas</h3>
          </div>
          <p className="text-gray-400 text-sm">Gerencie apenas as configuracoes validas da operacao atual.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-primary-300 text-sm">
            Ir para configuracoes de usuarios
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPremium;
