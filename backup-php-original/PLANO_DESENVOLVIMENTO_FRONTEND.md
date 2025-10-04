# Plano de Desenvolvimento Frontend - Plataforma de Cânticos CCB

## Visão Geral
Este documento detalha o plano completo de desenvolvimento frontend da plataforma, baseado nos fluxos de usuário identificados. O desenvolvimento será incremental, com testes em desktop e mobile a cada etapa concluída.

---

## Estrutura de Fluxos Identificados

### 1. **Onboarding** (14 telas)
Fluxo inicial de apresentação da plataforma para novos usuários.

### 2. **Upgrading to Premium** (12 telas)
Processo de upgrade para conta premium com benefícios e pagamento.

### 3. **Home** (4 telas principais)
- **Filtering library** (2 telas)
- **Sorting library** (3 telas)
- **Switching to grid view** (4 telas)
- **Collapsing library** (2 telas)

### 4. **Searching Spotify** (4 telas)
Sistema de busca e descoberta de conteúdo.

### 5. **Playlist** (3 telas principais)
- **Playing a playlist** (2 telas)
- **Adding to liked songs** (4 telas)
- **Song credits** (3 telas)
- **Enabling repeat** (4 telas)
- **Enabling now playing view** (4 telas)
- **Switching to lyrics view** (3 telas)
- **Queue** (2 telas)
  - Adding to queue (4 telas)
  - Reordering queue (3 telas)
- **Connecting to a device** (4 telas)
- **Switching to fullscreen** (4 telas)
- **Adding to library** (2 telas)
- **Reporting a playlist** (8 telas)
- **Excluding from taste profile** (2 telas)
- **Copying playlist link** (3 telas)
- **Copying embed code** (5 telas)
- **Switching to compact view** (3 telas)

### 6. **Creating a Playlist**
- Editing playlist details
- Adding a song
- Adding a song (Liked Songs)
- Removing from profile
- Moving playlist to a folder
- Pinning a playlist
- **Deleting a playlist** (3 telas)

### 7. **Artist Profile** (6 telas)
- **Discography** (2 telas)
- **Following an artist** (2 telas)
- **Muting an artist** (3 telas)
- **About** (4 telas)

### 8. **Inviting to a Blend Playlist**
- Joining a blend

### 9. **Account Settings**
- **Canceling subscription** (12 telas)
- **Editing profile** (5 telas)
- **Change payment detail** (4 telas)
- **Recovering a playlist** (3 telas)
- **Top up listening time** (3 telas)
- **Order history** (2 telas)
- **Redeem gift card** (4 telas)
- **Changing password** (5 telas)
- **Editing notification settings** (5 telas)
- **Requesting account data** (5 telas)
- **Adding a login method** (4 telas)
- **Deleting an account** (3 telas)

### 10. **Profile**
- Uploading profile photo

### 11. **Settings**
- Changing language

### 12. **Logging Out**

### 13. **Logging In**
- Resetting password

### 14. **Landing Page**

### 15. **About (Marketing)** (2 telas)

### 16. **Jobs**

### 17. **For the Record**
- Article detail
- News
- Loud and clear
- Audiobooks (marketing)
- Spotify Wrapped
- Press center
- **Spotify Design** (8 telas)
  - Story detail (6 telas)
  - Stories (3 telas)
  - Listen (3 telas)
  - Team (4 telas)

### 18. **For Artists** (7 telas)
- **Marquee** (6 telas)
- **Countdown pages** (5 telas)
- **Fan study** (10 telas)
- **Made to be found** (13 telas)
- **Creating a promo card** (11 telas)

---

## Fases de Desenvolvimento

### **FASE 1: Fundação e Navegação Principal**
**Objetivo:** Estabelecer estrutura base, navegação e layout responsivo.

#### Etapa 1.1 - Estrutura Base
- [ ] Criar sistema de roteamento (SPA ou multi-page)
- [ ] Implementar layout master (header, sidebar, main, footer)
- [ ] Configurar sistema de grid responsivo
- [ ] Definir breakpoints mobile/tablet/desktop
- [ ] Criar componentes base (buttons, inputs, cards)

#### Etapa 1.2 - Navegação Principal
- [ ] Sidebar com menu principal
- [ ] Top navigation bar
- [ ] Mobile bottom navigation (já implementado)
- [ ] Breadcrumbs
- [ ] Menu hamburguer mobile

#### Etapa 1.3 - Sistema de Temas
- [ ] Variáveis CSS para cores/tipografia
- [ ] Dark mode (padrão)
- [ ] Light mode (opcional)
- [ ] Transições suaves entre temas

**Teste:** Navegação fluida em todas as resoluções, menu responsivo funcionando.

---

### **FASE 2: Autenticação e Onboarding**
**Objetivo:** Fluxos de entrada do usuário na plataforma.

#### Etapa 2.1 - Landing Page
- [ ] Hero section
- [ ] Features showcase
- [ ] Call-to-action buttons
- [ ] Footer com links

#### Etapa 2.2 - Login/Registro
- [ ] Tela de login
- [ ] Tela de registro
- [ ] Recuperação de senha
- [ ] Validação de formulários
- [ ] Feedback visual de erros

#### Etapa 2.3 - Onboarding (14 telas)
- [ ] Tela de boas-vindas
- [ ] Tour guiado (slides/steps)
- [ ] Seleção de preferências musicais
- [ ] Configuração inicial de perfil
- [ ] Animações de transição

**Teste:** Fluxo completo de cadastro/login, onboarding responsivo.

---

### **FASE 3: Home e Biblioteca**
**Objetivo:** Tela principal com biblioteca de conteúdo.

#### Etapa 3.1 - Home Dashboard
- [ ] Grid de playlists/álbuns
- [ ] Carrosséis de conteúdo
- [ ] Seções "Recém adicionados", "Mais ouvidos"
- [ ] Cards de playlist/álbum com hover effects

#### Etapa 3.2 - Biblioteca (Library)
- [ ] Lista de playlists do usuário
- [ ] Filtros (Filtering library - 2 telas)
- [ ] Ordenação (Sorting library - 3 telas)
- [ ] Visualização em grid/lista (Switching to grid view - 4 telas)
- [ ] Colapsar/expandir biblioteca (Collapsing library - 2 telas)

#### Etapa 3.3 - Busca (Searching - 4 telas)
- [ ] Barra de busca global
- [ ] Resultados em tempo real
- [ ] Filtros de busca (músicas, playlists, artistas)
- [ ] Histórico de buscas

**Teste:** Navegação na home, filtros/ordenação funcionando, busca responsiva.

---

### **FASE 4: Player de Áudio (Core)**
**Objetivo:** Funcionalidade principal de reprodução.

#### Etapa 4.1 - Mini Player (já implementado - melhorias)
- [x] Barra mini acima do menu mobile
- [x] Controles play/pause
- [x] Indicador de tempo
- [x] Barra de progresso
- [ ] Integração com áudio real (aguardando backend)

#### Etapa 4.2 - Player Completo
- [ ] Tela de "Now Playing" (Enabling now playing view - 4 telas)
- [ ] Capa do álbum em destaque
- [ ] Controles avançados (shuffle, repeat)
- [ ] Barra de progresso interativa
- [ ] Volume control
- [ ] Fila de reprodução (Queue - 2 telas)

#### Etapa 4.3 - Funcionalidades Avançadas do Player
- [ ] Letra da música (Switching to lyrics view - 3 telas)
- [ ] Modo fullscreen (Switching to fullscreen - 4 telas)
- [ ] Conectar a dispositivo (Connecting to a device - 4 telas)
- [ ] Repeat mode (Enabling repeat - 4 telas)
- [ ] Créditos da música (Song credits - 3 telas)

**Teste:** Player funcional em mobile/desktop, controles responsivos, transições suaves.

---

### **FASE 5: Playlists e Gerenciamento**
**Objetivo:** CRUD completo de playlists.

#### Etapa 5.1 - Visualização de Playlist (Playing a playlist - 2 telas)
- [ ] Página de detalhes da playlist
- [ ] Lista de músicas
- [ ] Botão play/pause geral
- [ ] Informações (duração total, nº de músicas)

#### Etapa 5.2 - Criação e Edição
- [ ] Modal/página de criação de playlist
- [ ] Editar detalhes (nome, descrição, capa)
- [ ] Adicionar músicas (Adding a song)
- [ ] Adicionar de "Liked Songs" (Adding a song Liked Songs)
- [ ] Remover músicas

#### Etapa 5.3 - Ações de Playlist
- [ ] Adicionar à biblioteca (Adding to library - 2 telas)
- [ ] Remover do perfil (Removing from profile)
- [ ] Mover para pasta (Moving playlist to a folder)
- [ ] Fixar playlist (Pinning a playlist)
- [ ] Deletar playlist (Deleting a playlist - 3 telas)
- [ ] Reportar playlist (Reporting a playlist - 8 telas)

#### Etapa 5.4 - Compartilhamento
- [ ] Copiar link (Copying playlist link - 3 telas)
- [ ] Copiar embed code (Copying embed code - 5 telas)
- [ ] Convidar para blend (Inviting to a blend playlist)

#### Etapa 5.5 - Visualizações Alternativas
- [ ] Compact view (Switching to compact view - 3 telas)
- [ ] Grid view
- [ ] Lista detalhada

**Teste:** CRUD completo de playlists, compartilhamento funcionando, responsividade.

---

### **FASE 6: Fila de Reprodução (Queue)**
**Objetivo:** Gerenciamento da fila de músicas.

#### Etapa 6.1 - Visualização da Fila (Queue - 2 telas)
- [ ] Sidebar/modal com fila atual
- [ ] Próximas músicas
- [ ] Histórico de reprodução

#### Etapa 6.2 - Manipulação da Fila
- [ ] Adicionar à fila (Adding to queue - 4 telas)
- [ ] Reordenar fila (Reordering queue - 3 telas)
- [ ] Remover da fila
- [ ] Limpar fila

**Teste:** Fila funcional, drag-and-drop para reordenar, sincronização com player.

---

### **FASE 7: Perfil de Artista**
**Objetivo:** Páginas de artistas com discografia e informações.

#### Etapa 7.1 - Página do Artista (Artist profile - 6 telas)
- [ ] Header com foto e nome
- [ ] Botão de seguir (Following an artist - 2 telas)
- [ ] Estatísticas (ouvintes mensais, seguidores)
- [ ] Músicas populares

#### Etapa 7.2 - Discografia (Discography - 2 telas)
- [ ] Lista de álbuns
- [ ] Singles e EPs
- [ ] Filtros por tipo/ano

#### Etapa 7.3 - Informações Adicionais
- [ ] Sobre o artista (About - 4 telas)
- [ ] Artistas relacionados
- [ ] Silenciar artista (Muting an artist - 3 telas)

**Teste:** Navegação no perfil, discografia carregando, ações de seguir/silenciar.

---

### **FASE 8: Configurações e Conta**
**Objetivo:** Gerenciamento de conta e preferências.

#### Etapa 8.1 - Perfil do Usuário (Profile)
- [ ] Visualização de perfil
- [ ] Upload de foto (Uploading profile photo)
- [ ] Editar perfil (Editing profile - 5 telas)
- [ ] Playlists públicas

#### Etapa 8.2 - Configurações Gerais (Settings)
- [ ] Alterar idioma (Changing language)
- [ ] Notificações (Editing notification settings - 5 telas)
- [ ] Privacidade

#### Etapa 8.3 - Conta (Account Settings)
- [ ] Alterar senha (Changing password - 5 telas)
- [ ] Métodos de login (Adding a login method - 4 telas)
- [ ] Solicitar dados (Requesting account data - 5 telas)
- [ ] Deletar conta (Deleting an account - 3 telas)

#### Etapa 8.4 - Assinatura e Pagamento
- [ ] Detalhes da assinatura
- [ ] Alterar método de pagamento (Change payment detail - 4 telas)
- [ ] Cancelar assinatura (Canceling subscription - 12 telas)
- [ ] Histórico de pedidos (Order history - 2 telas)
- [ ] Resgatar gift card (Redeem gift card - 4 telas)
- [ ] Adicionar tempo de escuta (Top up listening time - 3 telas)

#### Etapa 8.5 - Recuperação
- [ ] Recuperar playlist (Recovering a playlist - 3 telas)

**Teste:** Todas as configurações salvando, fluxo de cancelamento completo, responsividade.

---

### **FASE 9: Premium e Upgrade**
**Objetivo:** Fluxo de conversão para premium.

#### Etapa 9.1 - Upgrading to Premium (12 telas)
- [ ] Página de comparação de planos
- [ ] Benefícios destacados
- [ ] Seleção de plano
- [ ] Formulário de pagamento
- [ ] Confirmação de upgrade
- [ ] Tela de sucesso

**Teste:** Fluxo completo de upgrade, validações de formulário, responsividade.

---

### **FASE 10: Funcionalidades Sociais**
**Objetivo:** Interações sociais e compartilhamento.

#### Etapa 10.1 - Liked Songs
- [ ] Página de músicas curtidas
- [ ] Adicionar/remover (Adding to liked songs - 4 telas)
- [ ] Filtros e ordenação

#### Etapa 10.2 - Blend Playlists
- [ ] Convidar amigos (Inviting to a blend playlist)
- [ ] Entrar em blend (Joining a blend)

#### Etapa 10.3 - Exclusões e Preferências
- [ ] Excluir do perfil de gosto (Excluding from taste profile - 2 telas)

**Teste:** Ações sociais funcionando, sincronização de estados.

---

### **FASE 11: Conteúdo Institucional**
**Objetivo:** Páginas informativas e marketing.

#### Etapa 11.1 - About/Marketing (About marketing - 2 telas)
- [ ] Página sobre a plataforma
- [ ] Missão e valores

#### Etapa 11.2 - Jobs
- [ ] Página de carreiras
- [ ] Lista de vagas

#### Etapa 11.3 - For the Record
- [ ] Article detail
- [ ] News
- [ ] Loud and clear
- [ ] Audiobooks (marketing)
- [ ] Spotify Wrapped
- [ ] Press center

#### Etapa 11.4 - Spotify Design (8 telas)
- [ ] Story detail (6 telas)
- [ ] Stories (3 telas)
- [ ] Listen (3 telas)
- [ ] Team (4 telas)

#### Etapa 11.5 - For Artists (7 telas)
- [ ] Marquee (6 telas)
- [ ] Countdown pages (5 telas)
- [ ] Fan study (10 telas)
- [ ] Made to be found (13 telas)
- [ ] Creating a promo card (11 telas)

**Teste:** Páginas carregando, links funcionando, responsividade.

---

### **FASE 12: Polimento e Otimização**
**Objetivo:** Refinamento final e performance.

#### Etapa 12.1 - Animações e Transições
- [ ] Micro-interações
- [ ] Loading states
- [ ] Skeleton screens
- [ ] Page transitions

#### Etapa 12.2 - Acessibilidade
- [ ] ARIA labels
- [ ] Navegação por teclado
- [ ] Contraste de cores (WCAG)
- [ ] Screen reader support

#### Etapa 12.3 - Performance
- [ ] Lazy loading de imagens
- [ ] Code splitting
- [ ] Minificação de assets
- [ ] Otimização de bundle

#### Etapa 12.4 - Testes Finais
- [ ] Testes cross-browser
- [ ] Testes em dispositivos reais
- [ ] Testes de usabilidade
- [ ] Correção de bugs

**Teste:** Performance auditada (Lighthouse), acessibilidade validada, bugs corrigidos.

---

## Cronograma Estimado

| Fase | Duração Estimada | Prioridade |
|------|------------------|------------|
| Fase 1 | 1-2 semanas | Alta |
| Fase 2 | 1 semana | Alta |
| Fase 3 | 2 semanas | Alta |
| Fase 4 | 2-3 semanas | Crítica |
| Fase 5 | 2 semanas | Alta |
| Fase 6 | 1 semana | Média |
| Fase 7 | 1 semana | Média |
| Fase 8 | 2 semanas | Alta |
| Fase 9 | 1 semana | Média |
| Fase 10 | 1 semana | Baixa |
| Fase 11 | 2 semanas | Baixa |
| Fase 12 | 2 semanas | Alta |

**Total estimado:** 18-22 semanas (4-5 meses)

---

## Stack Tecnológico Sugerido

### Frontend Core
- **Framework:** React.js ou Vue.js
- **Roteamento:** React Router / Vue Router
- **Estado:** Context API + Hooks / Vuex / Pinia
- **Estilização:** CSS Modules / Styled Components / TailwindCSS (já em uso)

### Bibliotecas Auxiliares
- **Player de Áudio:** Howler.js / WaveSurfer.js
- **Animações:** Framer Motion / GSAP
- **Drag and Drop:** react-beautiful-dnd / Vue.Draggable
- **Formulários:** React Hook Form / VeeValidate
- **Validação:** Yup / Zod

### Ferramentas
- **Build:** Vite / Webpack
- **Linting:** ESLint + Prettier
- **Testes:** Jest + React Testing Library / Vitest

---

## Metodologia de Teste

### Teste por Fase
1. **Desktop First:** Testar em resolução 1920x1080
2. **Tablet:** Testar em 768x1024
3. **Mobile:** Testar em 375x667 e 414x896
4. **Cross-browser:** Chrome, Firefox, Safari, Edge

### Checklist de Teste por Etapa
- [ ] Layout responsivo funcionando
- [ ] Interações (cliques, hovers) responsivas
- [ ] Navegação fluida
- [ ] Formulários validando corretamente
- [ ] Feedback visual adequado
- [ ] Performance aceitável (< 3s load time)
- [ ] Sem erros no console

---

## Próximos Passos

1. **Revisar e aprovar este plano**
2. **Iniciar Fase 1 - Fundação e Navegação Principal**
3. **Desenvolver incrementalmente, testando a cada etapa**
4. **Documentar componentes reutilizáveis**
5. **Preparar para integração com backend após conclusão do frontend**

---

## Notas Importantes

- **Backend será desenvolvido apenas após frontend completo**
- **Dados mockados serão usados durante desenvolvimento**
- **Cada fase deve ser testada em desktop e mobile antes de prosseguir**
- **Componentes devem ser reutilizáveis e bem documentados**
- **Manter consistência visual com design system estabelecido**

---

**Documento criado em:** 04/10/2025  
**Versão:** 1.0  
**Status:** Aguardando aprovação para início da Fase 1
