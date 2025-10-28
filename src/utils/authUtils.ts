// Utilitários para verificação de autenticação mais robusta

export function checkAuthStatus() {
  try {
    const authData = localStorage.getItem('auth-storage');
    if (!authData) return { isAuthenticated: false, user: null };
    
    const parsed = JSON.parse(authData);
    const state = parsed.state || parsed;
    
    return {
      isAuthenticated: state.isAuthenticated || false,
      user: state.user || null
    };
  } catch (error) {
    console.error('Erro ao verificar auth status:', error);
    return { isAuthenticated: false, user: null };
  }
}

export function forceLogin(user: any) {
  try {
    const authData = {
      state: {
        user,
        isAuthenticated: true
      },
      version: 0
    };
    
    localStorage.setItem('auth-storage', JSON.stringify(authData));
    
    // Forçar reload da página para garantir que o Zustand carregue o novo estado
    window.location.reload();
  } catch (error) {
    console.error('Erro ao forçar login:', error);
  }
}

export function debugAuth() {
  const authData = localStorage.getItem('auth-storage');
  console.log('=== AUTH DEBUG ===');
  console.log('localStorage auth-storage:', authData);
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      console.log('Parsed data:', parsed);
    } catch (e) {
      console.log('Erro ao fazer parse:', e);
    }
  }
  
  return checkAuthStatus();
}
