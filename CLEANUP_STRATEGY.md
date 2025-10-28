# 🧹 Estratégia de Limpeza para Deploy

## ❌ Problema Atual

O build está falhando porque **removemos completamente o backend do Supabase**, mas o código ainda tenta importar arquivos que não existem mais.

## 🎯 Arquivos Deletados (causando erros):

1. `src/lib/admin/` - **PASTA INTEIRA deletada** (60+ arquivos)
2. `src/services/` - Deletada
3. `src/lib/*Api.ts` - Todos deletados
4. `src/components/debug/` - Deletada

## ⚠️ Componentes Quebrados

Estes componentes/páginas ainda tentam usar APIs deletadas:

### **Páginas que NÃO vão funcionar sem backend:**
- LoginPage.tsx → usa `logosAdminApi`
- RegisterPage.tsx → usa `logosAdminApi`
- OnboardingPage.tsx → usa `getPopularComposers`
- AdminSongForm.tsx → usa `createSong`, `updateSong`
- AdminUserEdit.tsx → usa `getUserById`, `updateUser`
- ComposerNotifications.tsx → usa queries do Firestore antigas
- Todas as páginas Admin (AdminDashboard, AdminUsers, etc.)
- Todas as páginas Composer (ComposerDashboard, etc.)

## ✅ Solução Recomendada

### **Opção 1: Deploy Mínimo (Apenas Vitrine)** ⭐

Manter apenas páginas que **NÃO** dependem de backend:

**Manter:**
- ✅ HomePage (visual estático)
- ✅ Páginas legais (Termos, Privacidade, etc.)
- ✅ Página de categoria (se tiver dados mocados)

**Desabilitar temporariamente:**
- ❌ Login/Register
- ❌ Painel Admin
- ❌ Painel Compositor  
- ❌ Player de músicas
- ❌ Playlists

### **Opção 2: Migração Gradual** (Recomendado)

Reescrever os componentes **um por um** para usar Firebase:

1. ✅ AuthContext (JÁ FEITO - usa Firebase Auth)
2. ⏳ HomePage (adaptar para buscar do Firestore)
3. ⏳ LoginPage (remover logo API, usar Firebase Auth)
4. ⏳ Player (adaptar para Firestore + VPS)
5. ⏳ Admin (reescrever APIs para Firestore)

### **Opção 3: Deploy com Fallback Mockado**

Criar APIs mockadas temporárias para fazer o build passar:

```typescript
// src/lib/admin/mockApis.ts
export const logosAdminApi = {
  getLogoByType: async () => null
};

export const createSong = async () => {};
export const updateSong = async () => {};
// etc...
```

## 💡 Recomendação Imediata

**Para fazer o deploy AGORA:**

1. **Comentar** todas as rotas Admin e Composer no `App.tsx`
2. **Criar** APIs mockadas para Login/Register
3. **Desabilitar** funcionalidades de backend temporariamente
4. **Deploy** na Vercel apenas como vitrine/landing page

**Depois:**
- Reescrever componentes aos poucos para Firebase
- Habilitar rotas conforme forem migradas

## 📝 Próximo Passo

Você prefere:

**A)** Deploy mínimo agora (só vitrine, sem funcionalidades)
**B)** Reescrever componentes principais antes de fazer deploy
**C)** Criar mocks temporários para fazer build passar

**Qual opção você prefere?**
