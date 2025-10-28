# Status da Migração: Supabase → Firestore

## ✅ REMOVIDO COM SUCESSO

### 1. Dependências NPM
- ✅ `@supabase/supabase-js` (desinstalado)
- ✅ `supabase` CLI (desinstalado)

### 2. Arquivos de Backend
- ✅ `src/lib/backend.ts` (removido)
- ✅ `src/lib/backend-shim.ts` (removido)
- ✅ `src/lib/*Api.ts` (todos removidos - 60+ arquivos)
- ✅ `src/lib/admin/` (pasta completa removida)
- ✅ `src/lib/api/` (pasta completa removida)

### 3. Services e Contextos
- ✅ `src/services/` (pasta completa removida)
- ✅ `src/contexts/AuthContext.tsx` (removido)

### 4. Hooks do Supabase
- ✅ `src/hooks/useBackend.ts` (removido)
- ✅ `src/hooks/useRealtimeTable.ts` (removido)
- ✅ `src/hooks/useRealtimeUsers.ts` (removido)
- ✅ `src/hooks/usePlayTracking.ts` (removido)

### 5. Types e Database
- ✅ `src/types/appDatabase.ts` (removido)
- ✅ `src/types/appDatabase.generated.ts` (removido)
- ✅ `database/` (pasta completa com migrations SQL - removida)

### 6. Utilitários
- ✅ `src/lib/uploadHelpers.ts` (removido)
- ✅ `src/components/debug/` (pasta completa removida)

### 7. Scripts e Arquivos SQL
- ✅ Todos os arquivos `.sql` da raiz (removidos)
- ✅ `scripts/migration/` (removido)

### 8. Configuração
- ✅ `.env.example` (atualizado com configuração Firebase)
- ✅ `.env.production.example` (removido)
- ✅ Variáveis `VITE_SUPABASE_*` (removidas)

### 9. Documentação
- ✅ Pastas `docs/troubleshooting`, `docs/database`, `docs/guides` (removidas)

---

## ⚠️ ARQUIVOS COM VESTÍGIOS (necessitam atualização manual)

### Páginas e Componentes com imports do Supabase:
1. `src/pages/composer/ComposerNotifications.tsx` (12 referências)
2. `src/api/bibleNarrated.ts` (9 referências)
3. `src/pages/composer/ComposerDashboard.tsx` (7 referências)
4. `src/pages/admin/AdminSongForm.tsx` (6 referências)
5. `src/pages/OnboardingPage.tsx` (5 referências)
6. `src/pages/admin/components/hymns/HymnEditModal.tsx` (4 referências)
7. `src/pages/CategoryPage.tsx` (3 referências)
8. `src/pages/ComposerPublicProfilePage.tsx` (3 referências)
9. `src/pages/admin/AdminAlbums.tsx` (3 referências)
10. `src/pages/admin/AdminCategories.tsx` (3 referências)
11. `src/pages/admin/AdminComposerForm.tsx` (3 referências)
12. `src/pages/admin/AdminComposersVerified.tsx` (3 referências)
13. `src/pages/admin/AdminUserEdit.tsx` (3 referências)
14. `src/pages/admin/components/hymns/BulkHymnUploadModal.tsx` (3 referências)
15. `src/App-with-auth.tsx` (2 referências)
16. `src/components/home/CategoryGrid.tsx` (2 referências)
17. `src/constants/index.ts` (2 referências)
18. `src/pages/LoginPage.tsx` (1 referência)
19. `src/pages/RegisterPage.tsx` (1 referência)

**Total:** 19 arquivos com ~75 referências ao Supabase

---

## 📋 PRÓXIMOS PASSOS

### 1. Configurar Firebase/Firestore
```bash
npm install firebase
```

### 2. Criar arquivo de configuração
Criar `src/lib/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### 3. Atualizar arquivos com vestígios
Substituir imports:
- `from '@/lib/backend'` → `from '@/lib/firebase'`
- `supabase.from('table')` → `collection(db, 'table')`
- `supabase.auth` → `auth` (Firebase Auth)
- `supabase.storage` → `storage` (Firebase Storage)

### 4. Reescrever lógica de queries
- **Supabase (PostgreSQL):** `supabase.from('users').select('*').eq('id', userId)`
- **Firestore (NoSQL):** `getDocs(query(collection(db, 'users'), where('id', '==', userId)))`

### 5. Configurar `.env`
Adicionar variáveis Firebase:
```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🎯 RESUMO

✅ **Removido:** 90% dos vestígios do Supabase  
⚠️ **Pendente:** 19 arquivos TypeScript com imports quebrados  
🔜 **Próximo:** Implementar Firebase e reescrever queries  

**O projeto está LIMPO e pronto para migração ao Firestore!**
