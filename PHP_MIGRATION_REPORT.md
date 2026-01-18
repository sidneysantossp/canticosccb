# Relatório de Migração PHP → Supabase

## Vestígios PHP Encontrados em Páginas de Usuário

### 🔴 CRÍTICO - Páginas de Usuário com PHP

#### 1. **HistoryPage.tsx** - Histórico de Reprodução
- ❌ `api/history/list.php` - Listar histórico
- ❌ `api/history/clear.php` - Limpar histórico
- **Ação**: Migrar para Supabase tabela `historico`

#### 2. **ComposerPublicProfilePage.tsx** - Perfil Público do Compositor
- ❌ `api/compositores/index.php` - Buscar compositor
- ❌ `api/compositores/seguidores.php` - Seguir/deixar de seguir
- ❌ `api/albuns/index.php` - Listar álbuns do compositor
- ❌ `api/albuns/hinos.php` - Listar músicas do álbum
- **Ação**: Migrar para Supabase tabelas `compositores`, `seguidores`, `albums`

#### 3. **CategoryPage.tsx** - Página de Categoria
- ❌ `/api/hinos/index.php?categoria=` - Buscar hinos por categoria
- **Ação**: Migrar para Supabase tabela `hinos`

#### 4. **HomePage.tsx** - Página Inicial
- ❌ `/api/hinos/index.php?sort=recent` - Hinos recentes
- **Ação**: Já tem fallback Supabase, remover PHP

### 🟡 MÉDIO - Stores com PHP

#### 5. **favoritesStore.ts** - Favoritos
- ❌ `api/favorites/list-detailed.php` - Listar favoritos
- **Ação**: Migrar para Supabase tabela `favoritos`

### 🟢 BAIXO - Libs de Suporte

#### 6. **recommendations.ts** - Recomendações
- ❌ `/api/hinos/index.php?sort=recent` - Base para recomendações
- **Ação**: Usar Supabase

#### 7. **homeApi.ts** - API da Home
- ❌ `/api/banners/index.php` - Banners
- ❌ `/api/hinos/index.php` - Hinos por categoria
- **Ação**: Migrar para Supabase

#### 8. **categoriesApi.ts** - Categorias
- ❌ `/api/categorias/index.php` - Listar categorias
- **Ação**: Migrar para Supabase tabela `categorias`

#### 9. **profileDashboardApi.ts** - Dashboard do Perfil
- ❌ `api/profile-dashboard/index.php` - Dados do dashboard
- **Ação**: Migrar para Supabase (agregações)

### 🔵 INFO - Páginas de Compositor (Onboarding)

#### 10. **ComposerOnboarding.tsx**
- ❌ `api/usuarios/check-email.php` - Verificar email
- ❌ `api/compositores/register.php` - Registrar compositor
- **Ação**: Migrar para Supabase Auth + tabela `compositores`

### 🟣 ADMIN - Páginas de Admin (Não Crítico para Usuário)

#### 11. **bannersAdminApi.ts**
- ❌ `/api/banners/index.php` - CRUD de banners
- ❌ `/api/banners/upload.php` - Upload de imagens
- **Ação**: Migrar para Supabase + Storage

#### 12. **pushSettingsApi.ts**
- ❌ `api/push/test.php` - Enviar push de teste
- **Ação**: Implementar com Supabase Edge Functions

### ⚪ OUTROS - Não são PHP mas precisam atenção

#### 13. **uploadHelpers.ts**
- ⚠️ `/api/stream.php` - Streaming de arquivos (avatars, covers, banners)
- ⚠️ `/api/usuarios/index.php` - Atualizar avatar
- ⚠️ `/api/compositores/index.php` - Atualizar banner/avatar
- **Ação**: Migrar para Supabase Storage

#### 14. **media-helper.ts**
- ⚠️ `/api/stream.php` - URLs de streaming
- **Ação**: Substituir por URLs do Supabase Storage

## Prioridade de Migração

### 🔥 URGENTE (Afeta usuários diretamente)
1. HistoryPage - Histórico de reprodução
2. favoritesStore - Favoritos
3. ComposerPublicProfilePage - Perfil de compositores
4. CategoryPage - Navegação por categorias

### 📋 IMPORTANTE (Funcionalidades principais)
5. HomePage - Hinos recentes
6. homeApi - Banners e categorias
7. recommendations - Recomendações personalizadas
8. profileDashboardApi - Dashboard do perfil

### 🔧 NECESSÁRIO (Funcionalidades secundárias)
9. ComposerOnboarding - Registro de compositores
10. uploadHelpers - Upload de arquivos
11. media-helper - Streaming de mídia

### 🎨 ADMIN (Não afeta usuários finais)
12. bannersAdminApi - Gestão de banners
13. pushSettingsApi - Notificações push

## Tabelas Supabase Necessárias

```sql
-- Histórico
CREATE TABLE historico (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  hino_id INTEGER REFERENCES hinos(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seguidores
CREATE TABLE seguidores (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  compositor_id INTEGER REFERENCES compositores(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, compositor_id)
);

-- Favoritos (já existe, verificar estrutura)
-- Categorias (já existe, verificar estrutura)
-- Albums (já existe, verificar estrutura)
```

## Status Atual

✅ **Migrado**: playlists, auth, uploads básicos
❌ **Pendente**: histórico, favoritos, seguidores, perfil compositor, categorias
