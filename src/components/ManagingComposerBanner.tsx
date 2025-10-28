import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import apiClient from '@/lib/api-client';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const ManagingComposerBanner: React.FC = () => {
  const { managingComposerName: contextComposerName, switchBackToSelf, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [composerName, setComposerName] = useState<string | null>(null);
  const [composerId, setComposerId] = useState<number | null>(null);

  useEffect(() => {
    // 1) Ler da sessionStorage (onde o AuthContext grava) se não houver no contexto
    const storedName = sessionStorage.getItem('managingComposerName');
    const storedId = sessionStorage.getItem('managingComposerId');
    const fromContextOrStorage = contextComposerName || storedName || null;
    setComposerName(fromContextOrStorage);
    setComposerId(storedId ? parseInt(storedId, 10) : null);

    // 2) Se não temos nome, mas temos ID na sessão, tentar resolver via API
    const resolveName = async () => {
      try {
        if (!fromContextOrStorage && storedId) {
          const idNum = parseInt(storedId, 10);
          if (Number.isFinite(idNum)) {
            const resp: any = await apiClient.compositores.get(idNum);
            const payload = resp?.data || resp; // compat
            const name = payload?.nome_artistico || payload?.nome || null;
            if (name) {
              setComposerName(name);
              sessionStorage.setItem('managingComposerName', name);
            }
          }
        }
      } catch (_) {
        // silencioso
      }
    };

    resolveName();

    // 3) Auto-select APENAS quando estiver no painel do compositor.
    // Evita reativar banner em rotas de usuário como '/manage-composers'.
    const maybeAutoSelectSingle = async () => {
      try {
        const isComposerRoute = location.pathname.startsWith('/composer');
        const isManagePage = location.pathname.startsWith('/manage-composers');
        if (!isComposerRoute || isManagePage) return;

        if (!fromContextOrStorage && !storedId && user?.id) {
          const resp: any = await apiClient.compositorGerentes.listarCompositores(user.id);
          const payload = resp?.data;
          const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
          // Considerar apenas ativos
          const ativos = list.filter((item: any) => item.status === 'ativo');
          if (ativos.length === 1) {
            const unico = ativos[0];
            const autoId = unico.compositor_id || unico.id;
            const autoName = unico.nome_artistico || unico.nome || 'Compositor';
            if (autoId) {
              sessionStorage.setItem('managingComposerId', String(autoId));
              sessionStorage.setItem('managingComposerName', autoName);
              setComposerId(Number(autoId));
              setComposerName(autoName);
            }
          }
        }
      } catch (_) {
        // silencioso
      }
    };

    maybeAutoSelectSingle();
  }, [contextComposerName, location.pathname]);

  const handleSwitchBack = () => {
    // Limpar sessionStorage (mantém alinhado com AuthContext)
    sessionStorage.removeItem('managingComposerId');
    sessionStorage.removeItem('managingComposerName');
    // Limpar qualquer cache residual em localStorage
    try { localStorage.removeItem('managingComposerId'); } catch {}
    try { localStorage.removeItem('managingComposerName'); } catch {}
    // Atualizar estado local imediatamente para esconder a tarja
    setComposerId(null);
    setComposerName(null);
    
    // Chamar função do contexto se existir
    if (switchBackToSelf) {
      switchBackToSelf();
    }
    
    // Redirecionar para perfil do usuário
    navigate('/profile');
  };

  // Nunca exibir na rota de seleção '/manage-composers'
  if (location.pathname.startsWith('/manage-composers')) return null;
  if (!composerName && !composerId) return null;

  return (
    <div className="w-full bg-yellow-500 text-black py-1.5 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="font-semibold text-sm">
            Você está gerenciando a conta do Compositor: <span className="font-bold">{composerName || 'Carregando...'}</span>
          </p>
        </div>
        
        <button
          onClick={handleSwitchBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-black text-yellow-500 rounded-md font-medium hover:bg-gray-900 transition-colors text-xs whitespace-nowrap"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">Voltar para minha conta</span>
          <span className="sm:hidden">Voltar</span>
        </button>
      </div>
    </div>
  );
};

export default ManagingComposerBanner;
