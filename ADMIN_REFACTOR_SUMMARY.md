# Admin Panel - Resumo da Refatoração para Supabase

## ✅ Trabalho Concluído

### 1. songsAdminApi.ts - Refatoração Completa
**Arquivo:** `src/lib/admin/songsAdminApi.ts`

**Funções Implementadas:**
- ✅ `getAllSongs(page, limit, filters)` - Lista hinos com paginação e filtros
- ✅ `getPendingSongs()` - Busca hinos pendentes de aprovação
- ✅ `getSongById(id)` - Busca hino específico
- ✅ `createSong(data)` - Cria novo hino
- ✅ `updateSong(id, data)` - Atualiza hino existente
- ✅ `deleteSong(id)` - Remove hino
- ✅ `approveSong(id)` - Aprova hino
- ✅ `rejectSong(id)` - Rejeita hino
- ✅ `toggleSongStatus(id, status)` - Alterna status
- ✅ `toggleSongFeatured(id, featured)` - Alterna destaque
- ✅ `getSongStats(id)` - Estatísticas do hino

**Mapeamento de Campos:**
```typescript
Supabase → Interface Song
titulo → title
artista → artist
categoria → genre
capa_url → cover_url
duracao → duration
destaque → is_featured
plays → plays_count
likes → likes_count
compositor_nome → composer_name
compositor_id → composer_id
```

**Tabela Supabase:** `hinos`

---

### 2. adminStatsApi.ts - Extensão com KPIs Reais
**Arquivo:** `src/lib/admin/adminStatsApi.ts`

**Funções Implementadas:**
- ✅ `getAdminStats()` - KPIs do dashboard
  - Total de usuários, compositores, hinos
  - Total de plays e likes (agregação real)
  - Novos usuários hoje
  - Hinos e compositores pendentes
- ✅ `getUserGrowth(months)` - Crescimento de usuários por mês
- ✅ `getRevenueStats()` - Estatísticas de receita (MRR, ARR)
- ✅ `getRecentActivity(limit)` - Atividades recentes
- ✅ `getTopSongs(limit)` - Músicas mais tocadas

**Tabelas Supabase:** `usuarios`, `hinos`

---

### 3. reportsAdminApi.ts - Implementação Completa
**Arquivo:** `src/lib/admin/reportsAdminApi.ts`

**Funções Implementadas:**
- ✅ `getAll(filters)` - Lista denúncias com filtros
- ✅ `getById(id)` - Busca denúncia específica
- ✅ `create(data)` - Cria nova denúncia
- ✅ `update(id, data)` - Atualiza denúncia
- ✅ `deleteItem(id)` - Remove denúncia
- ✅ `getOpenReports()` - Denúncias abertas
- ✅ `resolveReport(id, resolution, resolvedBy)` - Resolve denúncia
- ✅ `dismissReport(id, reason)` - Descarta denúncia

**Mapeamento de Campos:**
```typescript
Supabase → Interface Report
tipo → type
titulo → title
denunciante → reporter
denunciante_id → reporter_id
motivo → reason
prioridade → priority
descricao → description
alvo_id → target_id
resolucao → resolution
resolvido_por → resolved_by
resolvido_em → resolved_at
```

**Tabela Supabase:** `reports` (a ser criada)

---

## 📊 Impacto

### APIs Refatoradas: 3
1. songsAdminApi.ts
2. adminStatsApi.ts
3. reportsAdminApi.ts

### Funções Implementadas: 25+
- 11 funções em songsAdminApi
- 5 funções em adminStatsApi
- 9 funções em reportsAdminApi

### Tabelas Supabase Utilizadas:
- ✅ `usuarios` (existente)
- ✅ `hinos` (existente)
- ⏳ `reports` (a ser criada)

---

## 🔄 Próximas Etapas

### Fase 1: Atualizar Componentes React (Alta Prioridade)
1. `AdminSongs.tsx` → usar `songsAdminApi.getAllSongs`
2. `AdminSongsPending.tsx` → usar `songsAdminApi.getPendingSongs`
3. `AdminDashboardSimple.tsx` → usar `adminStatsApi.getAdminStats`
4. `AdminReports.tsx` → usar `reportsAdminApi.getAll`
5. `AdminReportLogs.tsx` → implementar logs reais
6. `AdminReportAnalytics.tsx` → usar dados reais

### Fase 2: Implementar APIs Restantes (Média Prioridade)
1. `promotionsAdminApi.ts`
2. `analyticsAdminApi.ts`
3. Atualizar componentes correspondentes

### Fase 3: APIs Secundárias (Baixa Prioridade)
1. `backupAdminApi.ts`
2. `campaignsAdminApi.ts`
3. `couponsAdminApi.ts`
4. `importAdminApi.ts`
5. `royaltiesAdminApi.ts`

---

## 🗄️ Tabelas Supabase Necessárias

### A Criar:
```sql
-- Tabela de denúncias/reports
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'song', 'user', 'comment', 'playlist'
  titulo VARCHAR(255) NOT NULL,
  denunciante VARCHAR(255),
  denunciante_id BIGINT REFERENCES usuarios(id),
  motivo VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_review', 'resolved', 'dismissed'
  prioridade VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
  descricao TEXT,
  alvo_id VARCHAR(255), -- ID do item denunciado
  resolucao TEXT,
  resolvido_por VARCHAR(255),
  resolvido_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_tipo ON reports(tipo);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

---

## 📝 Padrões Estabelecidos

### 1. Mapeamento de Campos
Sempre criar função `map*ToInterface` para converter dados Supabase → Interface TypeScript

### 2. Tratamento de Erros
```typescript
try {
  // Operação Supabase
  return { success: true, data };
} catch (error) {
  console.error('❌ [functionName] Error:', error);
  return { success: false, error: error.message };
}
```

### 3. Logs de Debug
```typescript
console.log('🔍 [functionName] Action:', params);
console.log('✅ [functionName] Success:', result);
console.error('❌ [functionName] Error:', error);
```

### 4. Fallback para Mock
Manter dados mock como fallback em caso de erro de conexão

---

## 🎯 Métricas de Sucesso

- ✅ 3 APIs refatoradas de mock para Supabase real
- ✅ 25+ funções implementadas com dados reais
- ✅ Interfaces TypeScript completas e documentadas
- ✅ Mapeamento de campos Supabase ↔ Frontend
- ✅ Tratamento de erros robusto
- ✅ Logs de debug para desenvolvimento
- ✅ Fallback para mock em caso de erro

---

## 📚 Documentação

Ver `ADMIN_REFACTOR_PROGRESS.md` para detalhes completos do progresso e próximos passos.
