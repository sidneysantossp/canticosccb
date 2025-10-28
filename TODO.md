# 📋 TODO - Cânticos CCB

## ✅ Concluído (18/10/2025)

### Autenticação
- [x] Migrar `AuthContextMock.tsx` para Firebase Auth
- [x] Configurar Firestore para perfis de usuário
- [x] Implementar `signIn`, `signUp`, `signOut` com Firebase
- [x] Adicionar real-time listener (`onAuthStateChanged`)
- [x] Testar login/registro/logout

### Rotas
- [x] Centralizar `<Router>` no `main.tsx`
- [x] Adicionar rotas alias em inglês (`/search`, `/categories`, etc.)
- [x] Configurar rotas do compositor (`/composer/*`)
- [x] Implementar `ProtectedRoute` com roles

### Documentação
- [x] Criar `MIGRATION.md` (guia de migração completo)
- [x] Criar `SETUP.md` (setup rápido)
- [x] Criar `README.md` (documentação principal)
- [x] Documentar Firebase Security Rules
- [x] Criar `.env.example` atualizado

---

## 🔄 Em Progresso

### VPS para Mídia
- [ ] Contratar VPS (Contabo/Hetzner/DigitalOcean)
- [ ] Instalar Ubuntu 22.04 LTS
- [ ] Configurar nginx para streaming
- [ ] Configurar SSL com Certbot (Let's Encrypt)
- [ ] Criar estrutura de pastas (`/var/www/media/hinos/`)
- [ ] Testar streaming de .mp3/.mp4
- [ ] Configurar CORS headers
- [ ] Documentar processo no `MIGRATION.md`

### GitHub + Vercel
- [ ] Criar repositório no GitHub
- [ ] Push inicial (`git push -u origin main`)
- [ ] Conectar Vercel ao repo GitHub
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Testar deploy automático
- [ ] Configurar domínio customizado (opcional)

---

## 📅 Pendente

### Fase 1: Infraestrutura Básica (Semana 1)
- [ ] **VPS Setup**
  - [ ] Contratar e configurar VPS
  - [ ] Instalar nginx + Node.js
  - [ ] Configurar firewall (UFW)
  - [ ] Setup SSL/HTTPS
  - [ ] Criar usuário deploy com SSH key

- [ ] **Deploy Inicial**
  - [ ] Push para GitHub
  - [ ] Deploy no Vercel
  - [ ] Testar ambiente de produção
  - [ ] Configurar monitoring básico

### Fase 2: Migração de Dados (Semana 2)
- [ ] **Usuários**
  - [ ] Exportar usuários do Supabase
  - [ ] Criar script de migração (`scripts/migrate-users.ts`)
  - [ ] Importar para Firestore
  - [ ] Validar dados migrados
  - [ ] Notificar usuários sobre mudança

- [ ] **Hinos e Metadados**
  - [ ] Exportar metadados do Supabase
  - [ ] Criar script de migração (`scripts/migrate-hymns.ts`)
  - [ ] Importar para Firestore
  - [ ] Atualizar referências de URLs
  - [ ] Validar integridade dos dados

- [ ] **Arquivos de Mídia**
  - [ ] Download de arquivos .mp3/.mp4 do Supabase Storage
  - [ ] Upload para VPS via SCP/rsync
  - [ ] Atualizar URLs no Firestore
  - [ ] Testar streaming
  - [ ] Limpar storage antigo (Supabase)

### Fase 3: Features Avançadas (Semana 3-4)
- [ ] **Player de Áudio**
  - [ ] Integrar com URLs do VPS
  - [ ] Implementar cache de áudio
  - [ ] Adicionar controles avançados (pitch, speed)
  - [ ] Suporte a fila de reprodução

- [ ] **Analytics**
  - [ ] Tracking de plays com Firebase Analytics
  - [ ] Dashboard para compositores
  - [ ] Relatórios mensais
  - [ ] Exportação de dados

- [ ] **Search e Filtros**
  - [ ] Otimizar busca com Algolia (opcional)
  - [ ] Filtros avançados (categoria, ano, popularidade)
  - [ ] Autocomplete
  - [ ] Histórico de buscas

### Fase 4: Otimizações (Semana 5+)
- [ ] **Performance**
  - [ ] Implementar lazy loading de componentes
  - [ ] Otimizar imagens (WebP, lazy load)
  - [ ] Code splitting
  - [ ] Service Worker para offline

- [ ] **SEO**
  - [ ] Meta tags dinâmicos
  - [ ] Sitemap.xml
  - [ ] robots.txt
  - [ ] Schema.org markup completo

- [ ] **Testes**
  - [ ] Testes unitários (Jest + React Testing Library)
  - [ ] Testes E2E (Playwright)
  - [ ] Testes de integração Firebase
  - [ ] CI/CD com GitHub Actions

---

## 🐛 Bugs Conhecidos

### Críticos (resolver ASAP)
- Nenhum no momento ✅

### Médios
- [ ] Lint warnings em arquivos grandes (AdminBackup.tsx, AdminCoupons.tsx)
  - **Solução**: Refatorar em componentes menores

### Baixos
- [ ] Alguns ícones SVG não carregam em Edge antigo
  - **Solução**: Adicionar fallbacks

---

## 💡 Ideias Futuras

### Features
- [ ] **Playlists Colaborativas** - Usuários podem criar e compartilhar playlists
- [ ] **Download Offline** - PWA com cache de hinos favoritos
- [ ] **Letra Sincronizada** - Karaoke style com letra scrolling
- [ ] **Modo Escuro/Claro** - Theme switcher
- [ ] **Compartilhamento Social** - Share direto para WhatsApp, Facebook
- [ ] **Comentários** - Usuários podem comentar em hinos
- [ ] **Notificações Push** - Novos hinos de compositores seguidos
- [ ] **Suporte a Video** - Upload e streaming de hinos em video
- [ ] **API Pública** - Documentar e expor API REST/GraphQL
- [ ] **App Mobile** - React Native ou PWA otimizado

### Integrações
- [ ] **Spotify** - Link para playlist CCB no Spotify
- [ ] **YouTube** - Embed de videos oficiais
- [ ] **Google Drive** - Backup automático de playlists
- [ ] **Discord** - Bot para tocar hinos no servidor

### Admin
- [ ] **Dashboard de Moderação** - Aprovar hinos pendentes
- [ ] **Sistema de Denúncias** - Report de conteúdo inadequado
- [ ] **Logs de Auditoria** - Track de ações administrativas
- [ ] **Gestão de Permissões** - Role-based access control avançado

---

## 📊 Métricas de Sucesso

### Mês 1
- [ ] 100 usuários registrados
- [ ] 500 plays de hinos
- [ ] 50 playlists criadas
- [ ] 0 bugs críticos

### Mês 3
- [ ] 1.000 usuários ativos
- [ ] 10.000 plays/mês
- [ ] 200 playlists
- [ ] 5+ compositores ativos

### Mês 6
- [ ] 5.000 usuários ativos
- [ ] 50.000 plays/mês
- [ ] 1.000 playlists
- [ ] 20+ compositores ativos
- [ ] 90%+ uptime

---

## 🔧 Manutenção

### Diária
- [ ] Monitorar erros no Sentry (quando configurado)
- [ ] Verificar Firebase Usage Quota
- [ ] Revisar pull requests

### Semanal
- [ ] Atualizar dependências (`npm update`)
- [ ] Backup do Firestore
- [ ] Revisar analytics

### Mensal
- [ ] Atualizar documentação
- [ ] Refatorar código legado
- [ ] Revisar performance (Lighthouse)
- [ ] Atualizar roadmap

---

## 📅 Cronograma

| Fase | Duração | Status |
|------|---------|--------|
| Setup Inicial | 1 dia | ✅ Concluído |
| VPS + Deploy | 2-3 dias | 🔄 Em progresso |
| Migração Dados | 3-5 dias | 📅 Planejado |
| Features Avançadas | 2-3 semanas | 📅 Planejado |
| Testes + Otimização | 1-2 semanas | 📅 Planejado |
| **TOTAL** | **4-6 semanas** | **20% concluído** |

---

**Última atualização**: 18 de outubro de 2025  
**Próxima revisão**: 25 de outubro de 2025
