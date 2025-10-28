import { useAuthStore } from '@/stores/authStore';

export default function AuthDebug() {
  const { isAuthenticated, user } = useAuthStore();
  
  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-[300] bg-red-600 text-white p-3 rounded-lg text-xs max-w-xs">
      <div><strong>Auth Debug:</strong></div>
      <div>isAuthenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>user: {user ? user.name : 'null'}</div>
      <div>role: {user?.role || 'undefined'}</div>
      <div>localStorage: {localStorage.getItem('auth-storage') ? '✅' : '❌'}</div>
    </div>
  );
}
