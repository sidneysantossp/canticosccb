# Admin Panel - Refatoração para Supabase Real

## Objetivo
Substituir todos os dados mock por chamadas reais ao Supabase em todas as telas admin.

## Status Geral
- ✅ Usuários (usersAdminApi.ts) - Conectado ao Supabase
- ✅ Compositores (compositoresApi em api-client.ts) - Conectado ao Supabase
- ✅ Playlists Editoriais (playlistsAdminApi.ts) - Conectado ao Supabase
- ✅ Banners (bannersAdminApi.ts) - Conectado ao Supabase
- ✅ Songs/Hinos (songsAdminApi.ts) - **REFATORADO** - Conectado ao Supabase
- ✅ Dashboard Stats (adminStatsApi.ts) - **ESTENDIDO** - KPIs reais implementados
- ✅ Reports (reportsAdminApi.ts) - **IMPLEMENTADO** - Conectado ao Supabase
- ❌ Analytics (analyticsAdminApi.ts) - Ainda usa mock
- ❌ Promotions (promotionsAdminApi.ts) - Ainda usa mock
- ❌ Backups (backupAdminApi.ts) - Ainda usa mock
- ❌ Campaigns (campaignsAdminApi.ts) - Ainda usa mock
- ❌ Coupons (couponsAdminApi.ts) - Ainda usa mock
- ❌ Imports (importAdminApi.ts) - Ainda usa mock
- ❌ Royalties (royaltiesAdminApi.ts) - Ainda usa mock
- ❌ Security Settings (securitySettingsApi.ts) - Ainda usa mock
- ❌ Integrations (integrationsSettingsApi.ts) - Ainda usa mock

## Prioridade de Implementação

### Alta Prioridade (Core Features)
1. **songsAdminApi.ts** - Gerenciamento de músicas/hinos
2. **adminStatsApi.ts** - Dashboard com KPIs reais
3. **reportsAdminApi.ts** - Sistema de denúncias

### Média Prioridade (Admin Tools)
4. **analyticsAdminApi.ts** - Relatórios e métricas
5. **promotionsAdminApi.ts** - Campanhas promocionais
6. **royaltiesAdminApi.ts** - Pagamentos de royalties

### Baixa Prioridade (Utilities)
7. **backupAdminApi.ts** - Sistema de backups
8. **campaignsAdminApi.ts** - Campanhas de marketing
9. **couponsAdminApi.ts** - Cupons de desconto
10. **importAdminApi.ts** - Importação de dados

## Tabelas Supabase Necessárias

### Existentes
- ✅ usuarios
- ✅ hinos
- ✅ playlists
- ✅ banners
- ✅ notifications

### A Criar/Verificar
- ❓ plays (histórico de reproduções)
- ❓ favorites (favoritos dos usuários)
- ❓ reports (denúncias)
- ❓ royalties (pagamentos)
- ❓ promotions (promoções)
- ❓ coupons (cupons)
- ❓ analytics_events (eventos de analytics)
- ❓ backups (registros de backup)
- ❓ campaigns (campanhas)
- ❓ imports (histórico de importações)

## Implementações Concluídas (Sessão Atual)

### 1. songsAdminApi.ts - ✅ COMPLETO
- Implementado `getAllSongs` com paginação e filtros (status, search)
- Implementado `getPendingSongs` para hinos aguardando aprovação
- Implementado `getSongById` para buscar hino específico
- Implementado `createSong` para criar novos hinos
- Implementado `updateSong` para atualizar hinos existentes
- Implementado `deleteSong` para remover hinos
- Implementado `approveSong`, `rejectSong`, `toggleSongStatus`, `toggleSongFeatured`
- Implementado `getSongStats` para estatísticas de hinos
- Mapeamento completo de campos Supabase ↔ Interface Song
- Fallback para mock em caso de erro

### 2. adminStatsApi.ts - ✅ ESTENDIDO
- Implementado `getAdminStats` com KPIs reais:
  - Total de usuários, compositores, hinos
  - Total de plays e likes (agregação real)
  - Novos usuários hoje
  - Hinos pendentes e compositores pendentes
- Implementado `getUserGrowth` com dados mensais reais
- Implementado `getRevenueStats` com cálculo de MRR e ARR
- Implementado `getRecentActivity` com atividades recentes reais
- Implementado `getTopSongs` com músicas mais tocadas

### 3. reportsAdminApi.ts - ✅ IMPLEMENTADO
- Criada interface `Report` completa
- Implementado `getAll` com filtros (status, type, priority)
- Implementado `getById` para buscar denúncia específica
- Implementado `create` para criar novas denúncias
- Implementado `update` para atualizar denúncias
- Implementado `deleteItem` para remover denúncias
- Implementado `getOpenReports` para denúncias abertas
- Implementado `resolveReport` para resolver denúncias
- Implementado `dismissReport` para descartar denúncias
- Mapeamento completo de campos Supabase ↔ Interface Report

## Próximos Passos

### Alta Prioridade
1. ✅ Auditar arquivos mock
2. ✅ Refatorar songsAdminApi.ts
3. ✅ Estender adminStatsApi.ts
4. ✅ Implementar reportsAdminApi.ts
5. ⏳ Atualizar componentes React para usar APIs reais:
   - AdminSongs.tsx → usar songsAdminApi
   - AdminSongsPending.tsx → usar getPendingSongs
   - AdminDashboardSimple.tsx → usar getAdminStats
   - AdminReports.tsx → usar reportsAdminApi
   - AdminReportLogs.tsx → implementar logs reais
   - AdminReportAnalytics.tsx → usar dados reais

### Média Prioridade
6. ⏳ Implementar promotionsAdminApi.ts
7. ⏳ Implementar analyticsAdminApi.ts
8. ⏳ Atualizar AdminPromotions.tsx
9. ⏳ Atualizar AdminAnalytics.tsx

### Baixa Prioridade
10. ⏳ Implementar backupAdminApi.ts
11. ⏳ Implementar campaignsAdminApi.ts
12. ⏳ Implementar couponsAdminApi.ts
13. ⏳ Implementar importAdminApi.ts
14. ⏳ Implementar royaltiesAdminApi.ts

## Notas Técnicas

- Usar `supabaseFetch`, `supabaseInsert`, `supabaseUpdate`, `supabaseDelete` de `supabaseRest.ts`
- Manter interfaces TypeScript compatíveis
- Adicionar logs de debug em desenvolvimento
- Implementar tratamento de erros adequado
- Manter paginação e filtros funcionando
