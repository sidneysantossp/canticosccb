# 🎵 Cânticos CCB - Plataforma Moderna de Hinos

> Plataforma completa de streaming de hinos da Congregação Cristã no Brasil desenvolvida com **React**, **TypeScript**, **Supabase** e **TailwindCSS**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📖 Sobre o Projeto

A plataforma **Cânticos CCB** é uma aplicação web moderna que oferece acesso aos hinos sagrados da Congregação Cristã no Brasil, com recursos avançados de streaming, playlists personalizadas, e uma experiência de usuário premium.

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar em Desenvolvimento
```bash
npm run dev
```

### 3. Acessar a Aplicação
Abra seu navegador em: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Layout components (Header, Sidebar, etc)
│   ├── ui/              # Reusable UI components
│   └── features/        # Feature-specific components
├── pages/               # Page components
├── stores/              # Zustand stores (estado global)
├── types/               # TypeScript types
├── data/                # Mock data
├── styles/              # Global styles
└── utils/               # Utility functions
```

## 🎯 Funcionalidades Implementadas

### ✅ **FASE 1 - Fundação e Navegação (Concluída)**
- [x] Setup React + TypeScript + Vite
- [x] Configuração TailwindCSS
- [x] Design System completo
- [x] Layout responsivo (Header, Sidebar, Mobile Nav)
- [x] Sistema de roteamento
- [x] Estado global (Zustand)
- [x] Mock data estruturado

### ✅ **FASE 2 - Autenticação e Onboarding (Concluída)**
- [x] Página de Login (social + email)
- [x] Página de Registro (validações completas)
- [x] Onboarding interativo (4 passos)
- [x] Seleção de preferências
- [x] Validação de senha (força)

### ✅ **FASE 3 - Home e Biblioteca (Concluída)**
- [x] HomePage com hero banner e seção Popular
- [x] LibraryPage com grid/list view
- [x] PlaylistDetailPage completa
- [x] SearchPage com filtros avançados
- [x] Busca em tempo real

### ✅ **FASE 4 - Player de Áudio (Concluída)**
- [x] Player completo com todos os controles
- [x] Shuffle e Repeat (3 estados)
- [x] Barra de progresso clicável
- [x] Controle de volume
- [x] Estados visuais ativos

### ✅ **FASE 5 - Playlists e Gerenciamento (Concluída)**
- [x] CreatePlaylistPage
- [x] Upload de capa
- [x] Configurações de privacidade
- [x] Validações e feedback

### ✅ **FASE 6 - Fila de Reprodução (Concluída)**
- [x] Queue Component (painel lateral)
- [x] Tab Próximas/Histórico
- [x] Drag & drop (UI ready)
- [x] Remover e limpar fila

### ✅ **FASE 7 - Perfil de Artista (Concluída)**
- [x] ArtistPage com hero section
- [x] Músicas populares
- [x] Discografia completa
- [x] Seguir/Deixar de seguir
- [x] Estatísticas do artista

### ✅ **FASE 8 - Configurações e Conta (Concluída)**
- [x] SettingsPage completa
- [x] 7 seções de configurações
- [x] Toggles e selects funcionais
- [x] Logout e links institucionais

### ✅ **FASE 9 - Premium e Upgrade (Concluída)**
- [x] PremiumPage com 3 planos
- [x] Toggle mensal/anual
- [x] Comparação de features
- [x] FAQ section
- [x] CTAs de conversão

### ✅ **FASE 10 - Funcionalidades Sociais (Concluída)**
- [x] LikedSongsPage
- [x] Busca nas curtidas
- [x] Estatísticas de músicas
- [x] Unlike functionality

### ✅ **FASE 11 - Conteúdo Institucional (Concluída)**
- [x] AboutPage
- [x] Missão, visão e valores
- [x] Timeline da empresa
- [x] Estatísticas

### 🔄 **FASE 12 - Polimento e Otimização (Em andamento)**
- [ ] Performance optimization
- [ ] Acessibilidade (ARIA labels)
- [ ] PWA setup
- [ ] SEO optimization
- [ ] Testes finais

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Animations:** Framer Motion (preparado)

## 🎨 Design System

### Cores
- **Primary:** #1db954 (Verde Spotify)
- **Background:** #121212 (Preto principal)
- **Secondary:** #181818 (Cinza escuro)
- **Tertiary:** #282828 (Cinza médio)

### Componentes
- Botões (primary, secondary, ghost)
- Cards (playlist, track)
- Inputs e formulários
- Navegação (sidebar, mobile nav)
- Player de áudio

## 📱 Responsividade

- **Mobile:** < 768px (Bottom navigation)
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px (Sidebar navigation)

## 🌟 Features Principais

### ✅ Autenticação & Usuários
- Login/Registro com email e senha
- Login social (Google, Facebook)
- Perfis personalizados com avatar
- Onboarding interativo para novos usuários

### ✅ Player de Áudio
- Controles completos (play, pause, next, previous)
- Shuffle e repeat (off, all, one)
- Barra de progresso interativa
- Controle de volume
- Queue (fila de reprodução)

### ✅ Biblioteca & Playlists
- Criar playlists personalizadas
- Grid e List view
- Adicionar/remover músicas
- Playlists públicas e privadas
- Músicas curtidas

### ✅ Busca & Descoberta
- Busca em tempo real
- Filtros por categoria
- Músicas populares
- Recomendações personalizadas

### ✅ Social
- Curtir músicas
- Seguir artistas
- Histórico de reprodução
- Estatísticas pessoais

### ✅ Premium
- Planos Free, Premium e Família
- Comparação de features
- FAQ completo
- Sistema de assinatura

## 🗂️ Estrutura de Dados

### Database Tables (Supabase)
- `profiles` - Perfis de usuários
- `artists` - Artistas e corais
- `albums` - Álbuns
- `songs` - Hinos e músicas
- `playlists` - Playlists dos usuários
- `playlist_songs` - Relação playlist-músicas
- `liked_songs` - Músicas curtidas
- `following_artists` - Artistas seguidos
- `play_history` - Histórico de reprodução
- `queue` - Fila de reprodução
- `user_preferences` - Configurações
- `subscriptions` - Assinaturas Premium

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting
npm run type-check   # Verificação de tipos
```

## 📊 Progresso do Desenvolvimento

**Total de Páginas Criadas:** 14 páginas
**Fases Completas:** 11/12 (92%)
**Status:** Frontend praticamente completo, pronto para integração

### Páginas Implementadas:
1. HomePage - Hero + Popular + Carrossel
2. LibraryPage - Grid/List view
3. PlaylistDetailPage - Detalhes completos
4. SearchPage - Busca com filtros
5. LoginPage - Autenticação completa
6. RegisterPage - Registro com validações
7. OnboardingPage - 4 passos interativos
8. CreatePlaylistPage - Criar playlists
9. ArtistPage - Perfil de artista
10. SettingsPage - Configurações completas
11. PremiumPage - Planos e assinatura
12. LikedSongsPage - Músicas curtidas
13. AboutPage - Institucional
14. Queue Component - Fila de reprodução

## 🚀 Próximos Passos

### Fase 2: Integração Backend
1. **Setup Supabase**
   - Criar projeto
   - Configurar database schema
   - Setup autenticação
   - Configurar storage para mídia

2. **Conectar Frontend**
   - Substituir mock data
   - Implementar queries e mutations
   - Adicionar real-time features
   - Configurar upload de arquivos

3. **Streaming de Áudio**
   - Implementar seek functionality
   - Adicionar buffer e cache
   - Lyrics sync
   - Queue persistence

### Fase 3: Otimização
1. **Performance**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle optimization

2. **PWA**
   - Service worker
   - Offline functionality
   - Install prompt
   - Push notifications

3. **Testes**
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance tests

### Fase 4: Deploy
1. **GitHub**
   - Inicializar repositório
   - Configurar branches
   - Setup CI/CD

2. **Vercel**
   - Deploy frontend
   - Configurar domínio
   - Environment variables
   - Preview deployments

## 🚀 Deploy

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Supabase (Backend)
O backend já está hospedado no Supabase. Basta seguir o guia `SUPABASE_SETUP.md` para configurar.

## 📖 Documentação Adicional

- 📘 [Guia de Setup Supabase](./SUPABASE_SETUP.md) - Como configurar o backend
- 📗 [Guia de Integração](./BACKEND_INTEGRATION_GUIDE.md) - Como integrar frontend com backend
- 📙 [Plano de Desenvolvimento](./PLANO_DESENVOLVIMENTO_FRONTEND.md) - Roadmap completo do projeto

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Sidney Santos** - [GitHub](https://github.com/sidneysantossp)

## 🙏 Agradecimentos

- Congregação Cristã no Brasil pela inspiração
- Comunidade open-source pelas ferramentas incríveis
- Todos que contribuíram para o projeto

## 📞 Contato

Para dúvidas ou sugestões, abra uma [issue](https://github.com/sidneysantossp/canticosccb/issues) no GitHub.

---

**Desenvolvido com ❤️ para a Congregação Cristã no Brasil**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![Styled with TailwindCSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
