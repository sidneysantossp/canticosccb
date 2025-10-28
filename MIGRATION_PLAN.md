# 🔄 Plano de Migração Completo - Cânticos CCB

## 🎯 Estratégia: Limpar → Visual → Reconstruir

### **FASE 1: LIMPEZA TOTAL** ✂️

#### **1.1. Remover Contextos de Auth Antigos**
- [x] Deletar `src/contexts/AuthContext.tsx` (já criamos novo com Firebase)
- [ ] Verificar se há outros contextos de auth

#### **1.2. Criar Contextos Dummy**
- [ ] `AuthContext.tsx` - Versão mockada sem backend
- [ ] `PlayerContext.tsx` - Manter como está (sem backend)

#### **1.3. Limpar Páginas - Remover Imports de APIs**

**Páginas de Login/Auth:**
- [ ] `LoginPage.tsx` - Remover `logosAdminApi`
- [ ] `RegisterPage.tsx` - Remover `logosAdminApi`
- [ ] `OnboardingPage.tsx` - Remover `getPopularComposers`

**Páginas Admin:**
- [ ] `AdminDashboard.tsx`
- [ ] `AdminUsers.tsx`
- [ ] `AdminComposers.tsx`
- [ ] `AdminSongs.tsx`
- [ ] `AdminAlbums.tsx`
- [ ] `AdminCategories.tsx`
- [ ] `AdminSongForm.tsx`
- [ ] `AdminUserEdit.tsx`
- [ ] Todas as outras páginas admin (30+)

**Páginas Compositor:**
- [ ] `ComposerDashboard.tsx`
- [ ] `ComposerNotifications.tsx`
- [ ] `ComposerAnalytics.tsx`
- [ ] `ComposerSongs.tsx`
- [ ] Todas as outras páginas compositor (15+)

**Páginas Públicas:**
- [ ] `HomePage.tsx`
- [ ] `CategoryPage.tsx`
- [ ] `PlaylistDetailPage.tsx`
- [ ] `AlbumDetailPage.tsx`
- [ ] `ComposerPublicProfilePage.tsx`

#### **1.4. Criar Dados Mockados**
```typescript
// src/data/mockData.ts
export const mockHymns = [ /* dados estáticos */ ];
export const mockComposers = [ /* dados estáticos */ ];
export const mockCategories = [ /* dados estáticos */ ];
```

---

### **FASE 2: FRONTEND VISUAL SEM BACKEND** 🎨

#### **2.1. AuthContext Mockado**
```typescript
// Versão sem Firebase, apenas state local
const AuthContext = {
  user: null,
  isAdmin: false,
  isComposer: false,
  signIn: () => alert('Login mockado'),
  signOut: () => {}
}
```

#### **2.2. Páginas com Dados Estáticos**
- Todas navegam sem erros
- Layout e design perfeitos
- Dados mockados exibidos corretamente

#### **2.3. Teste Local**
```bash
npm run dev
# Todas as páginas devem abrir sem erros
```

#### **2.4. Build e Deploy**
```bash
npm run build
# Deploy na Vercel
```

---

### **FASE 3: RECONSTRUÇÃO COM FIREBASE** 🔥

#### **3.1. Configurar Firebase (JÁ FEITO ✅)**
- [x] Firebase instalado
- [x] Credenciais configuradas
- [x] Firestore habilitado
- [x] Authentication habilitado

#### **3.2. Criar APIs com Firestore**
```typescript
// src/lib/firebaseApis/hymnsApi.ts
export const getHymns = async () => {
  return await getDocuments('hymns');
}

export const getHymnById = async (id: string) => {
  return await getDocument('hymns', id);
}
```

#### **3.3. Migrar Componentes (1 por vez)**
1. HomePage → usar Firestore
2. LoginPage → usar Firebase Auth
3. CategoryPage → usar Firestore
4. Player → usar Firestore + VPS
5. Admin → reescrever completamente
6. Composer → reescrever completamente

---

## 📊 Progresso

### Fase 1: Limpeza
- [ ] 0% - Remover imports antigos
- [ ] 0% - Criar mocks
- [ ] 0% - Build passando

### Fase 2: Visual
- [ ] 0% - Páginas navegáveis
- [ ] 0% - Deploy Vercel

### Fase 3: Firebase
- [ ] 0% - APIs criadas
- [ ] 0% - Componentes migrados

---

## ✅ Checklist Diária

**Hoje (Fase 1):**
- [ ] Limpar LoginPage
- [ ] Limpar RegisterPage  
- [ ] Limpar HomePage
- [ ] Criar mockData.ts
- [ ] Build funcionando

**Amanhã (Fase 2):**
- [ ] Testar todas as rotas
- [ ] Deploy na Vercel
- [ ] Link funcionando

**Depois (Fase 3):**
- [ ] API de hinos com Firestore
- [ ] Login com Firebase Auth
- [ ] Upload VPS

---

## 🚀 Próximo Passo AGORA

Vou começar a limpar os arquivos. Me confirme:

1. ✅ Posso **COMENTAR** código de banco/auth nas páginas?
2. ✅ Posso criar dados **mockados estáticos**?
3. ✅ Objetivo é fazer **build passar e deploy funcionar**?

**Confirmado? Vou começar!**
