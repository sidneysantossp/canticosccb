# 🎵 Cânticos CCB - Plataforma de Hinos

Plataforma web moderna para ouvir, descobrir e compartilhar hinos da Congregação Cristã no Brasil.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## ✨ Funcionalidades

- 🎵 **Player de Áudio Completo** - Reproduza hinos com controles avançados
- 🔍 **Busca Inteligente** - Encontre hinos por número, título ou compositor
- 📚 **Biblioteca Pessoal** - Organize seus hinos favoritos em playlists
- 👤 **Perfis de Compositores** - Descubra e siga compositores
- 📊 **Analytics para Compositores** - Visualize estatísticas de reprodução
- 🎨 **Design Moderno** - Interface responsiva e intuitiva
- 🌐 **Multi-idioma** - Rotas em português e inglês
- 🔐 **Autenticação Segura** - Firebase Auth com Firestore

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org))
- npm ou yarn
- Conta Firebase ([Criar grátis](https://console.firebase.google.com))

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/canticosccb.git
cd canticosccb

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Firebase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

📖 **[Guia de Setup Completo →](./SETUP.md)**

---

## 📁 Estrutura do Projeto

```
canticosccb/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── ui/              # Botões, Cards, Modais
│   │   └── SEO/             # SEO e metadados
│   ├── contexts/            # React Context (Auth, Player)
│   ├── pages/               # Páginas da aplicação
│   │   ├── admin/           # Painel administrativo
│   │   ├── composer/        # Painel do compositor
│   │   └── ...              # Páginas públicas
│   ├── lib/                 # Configurações e APIs
│   │   ├── firebase.ts      # Setup Firebase
│   │   └── mockApis.ts      # APIs mockadas
│   ├── stores/              # Zustand state management
│   ├── styles/              # CSS global e Tailwind
│   └── utils/               # Funções utilitárias
├── public/                  # Assets estáticos
├── .env.example             # Template de variáveis
├── MIGRATION.md             # Guia de migração Supabase → Firebase
└── SETUP.md                 # Guia de configuração inicial
```

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor dev (porta 5173)

# Build
npm run build        # Build de produção
npm run preview      # Preview do build

# Linting
npm run lint         # Executa ESLint

# Typecheck
npm run typecheck    # Verifica tipos TypeScript
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Estilização utilitária
- **React Router v6** - Roteamento
- **Zustand** - State management
- **Lucide React** - Ícones modernos

### Backend / Serviços
- **Firebase Auth** - Autenticação de usuários
- **Firestore** - Banco de dados NoSQL em tempo real
- **Firebase Storage** - (opcional) Armazenamento de arquivos
- **VPS** - Hospedagem de arquivos de mídia (.mp3/.mp4)

### Deploy
- **Vercel** - Hospedagem frontend
- **GitHub** - Versionamento de código

---

## 🔐 Autenticação e Segurança

- ✅ Firebase Authentication (Email/Senha)
- ✅ Firestore Security Rules configuradas
- ✅ Tokens JWT com refresh automático
- ✅ Proteção de rotas (ProtectedRoute component)
- ✅ Roles: `user`, `composer`, `admin`

📖 **[Ver Security Rules →](./SETUP.md#passo-4-configurar-security-rules)**

---

## 🎨 Páginas Principais

### Públicas
- `/` - Home com hinos em destaque
- `/search` - Busca de hinos, álbuns e compositores
- `/categories` - Categorias de hinos
- `/album/:id` - Detalhes do álbum
- `/compositor/:id` - Perfil público do compositor

### Usuário Autenticado
- `/profile` - Perfil do usuário
- `/library` - Biblioteca pessoal
- `/liked-songs` - Hinos curtidos
- `/history` - Histórico de reprodução
- `/subscription` - Gerenciar assinatura

### Compositor
- `/composer` - Dashboard do compositor
- `/composer/songs` - Gerenciar hinos
- `/composer/albums` - Gerenciar álbuns
- `/composer/analytics` - Estatísticas de reprodução
- `/composer/followers` - Seguidores
- `/composer/copyright-claims` - Reivindicações de direitos

### Administrador
- `/admin` - Dashboard administrativo
- `/admin/users` - Gerenciar usuários
- `/admin/hymns` - Moderar hinos
- `/admin/categories` - Gerenciar categorias
- `/admin/playlists` - Playlists editoriais

---

## 🌐 Rotas Multi-idioma

Todas as rotas principais têm aliases em inglês e português:

| Português | Inglês |
|-----------|--------|
| `/buscar` | `/search` |
| `/biblioteca` | `/library` |
| `/favoritos` | `/liked-songs` |
| `/historico` | `/history` |
| `/compositor/*` | `/composer/*` |

---

## 📦 Deploy

### Vercel (Recomendado)

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### Variáveis de Ambiente no Vercel

Configure no dashboard Vercel (Settings → Environment Variables):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

📖 **[Guia de Deploy Completo →](./MIGRATION.md#-github--vercel)**

---

## 🔄 Migração Supabase → Firebase

Se você está migrando de Supabase para Firebase, siga o guia completo:

📖 **[MIGRATION.md →](./MIGRATION.md)**

Tópicos incluídos:
- ✅ Configuração Firebase
- ✅ Migração de autenticação
- ✅ Setup de VPS para mídia
- ✅ Scripts de migração de dados
- ✅ Troubleshooting

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

- 📧 Email: suporte@canticosccb.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/canticosccb/issues)
- 📖 Docs: [SETUP.md](./SETUP.md) | [MIGRATION.md](./MIGRATION.md)

---

## 🙏 Agradecimentos

- Congregação Cristã no Brasil
- Comunidade Open Source
- Todos os compositores e usuários da plataforma

---

**Desenvolvido com ❤️ para a comunidade CCB**
