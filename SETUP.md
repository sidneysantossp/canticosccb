# ⚡ Setup Rápido - Cânticos CCB

## 🚀 Início Rápido (5 minutos)

### 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/canticosccb.git
cd canticosccb
npm install
```

### 2. Configurar Firebase

```bash
# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env com suas credenciais Firebase
# (obtenha em https://console.firebase.google.com)
```

### 3. Iniciar Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## 🔥 Configuração Firebase (Primeira vez)

### Passo 1: Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em "Add Project" (Adicionar Projeto)
3. Nome: `canticosccb` (ou seu escolhido)
4. Habilite Google Analytics (opcional)

### Passo 2: Ativar Autenticação

1. No menu lateral, clique em **Authentication**
2. Clique em "Get Started"
3. Ative **Email/Password**
4. (Opcional) Ative **Google Sign-in**

### Passo 3: Criar Firestore Database

1. No menu lateral, clique em **Firestore Database**
2. Clique em "Create Database"
3. Escolha localização: `us-central1` (ou mais próximo)
4. Modo: **Produção** (security rules já configuradas)

### Passo 4: Configurar Security Rules

Cole estas regras no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regra para coleção 'users'
    match /users/{userId} {
      // Usuário pode ler próprio documento
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Apenas admin pode escrever
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_admin == true;
    }
    
    // Regra para coleção 'hymns' (hinos)
    match /hymns/{hymnId} {
      // Todos podem ler
      allow read: if true;
      
      // Apenas compositores e admins podem escrever
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_composer == true ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_admin == true
      );
    }
    
    // Regra para coleção 'playlists'
    match /playlists/{playlistId} {
      // Todos podem ler playlists públicas
      allow read: if resource.data.is_public == true || 
                     (request.auth != null && request.auth.uid == resource.data.user_id);
      
      // Apenas dono pode escrever
      allow write: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
  }
}
```

### Passo 5: Obter Credenciais

1. No menu lateral, clique no **ícone de engrenagem** → "Project Settings"
2. Role até "Your apps" → clique no ícone **</>** (Web)
3. Nome do app: `Cânticos CCB Web`
4. Copie as credenciais e cole no `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=canticosccb.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=canticosccb
VITE_FIREBASE_STORAGE_BUCKET=canticosccb.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

---

## 📦 Estrutura do Projeto

```
canticosccb/
├── src/
│   ├── components/      # Componentes React
│   ├── contexts/        # Context API (Auth, Player)
│   ├── pages/           # Páginas da aplicação
│   ├── lib/             # Firebase config, APIs
│   ├── stores/          # Zustand stores
│   └── styles/          # CSS global
├── public/              # Assets estáticos
├── .env                 # Variáveis de ambiente (NÃO commitar!)
├── .env.example         # Template de variáveis
└── MIGRATION.md         # Guia de migração completo
```

---

## 🧪 Testando a Autenticação

### Teste 1: Registro de Usuário

```bash
# 1. Acesse http://localhost:5173/register
# 2. Preencha:
#    Email: teste@example.com
#    Senha: senha123
#    Nome: Usuário Teste
# 3. Clique em "Cadastrar"
# 4. Verifique no Firebase Console → Authentication
```

### Teste 2: Login

```bash
# 1. Acesse http://localhost:5173/login
# 2. Use as credenciais do teste anterior
# 3. Deve redirecionar para a home logado
```

### Teste 3: Perfil de Admin

```bash
# 1. No Firebase Console → Firestore Database
# 2. Navegue até users/{uid_do_usuario}
# 3. Edite o documento e adicione:
#    is_admin: true
# 4. Faça logout e login novamente
# 5. Acesse http://localhost:5173/admin
# 6. Deve ter acesso ao painel admin
```

---

## 🎵 Próximos Passos

1. **[Configurar VPS](./MIGRATION.md#-armazenamento-de-mídia-vps)** para hospedar arquivos .mp3/.mp4
2. **[Fazer deploy no Vercel](./MIGRATION.md#-github--vercel)**
3. **Migrar dados existentes** do Supabase (se aplicável)

---

## 🆘 Problemas Comuns

### "Firebase is not initialized"
→ Verifique se o arquivo `.env` existe e está preenchido corretamente

### "Permission denied" no Firestore
→ Verifique as Security Rules no Firebase Console

### "Module not found: firebase"
→ Execute `npm install firebase`

### Porta 5173 já em uso
→ Mude em `vite.config.ts` ou `npm run dev -- --port 3000`

---

## 📚 Documentação Adicional

- [MIGRATION.md](./MIGRATION.md) - Guia completo de migração
- [Firebase Docs](https://firebase.google.com/docs/web/setup)
- [React Router Docs](https://reactrouter.com)
- [Vite Docs](https://vitejs.dev)

---

**Precisa de ajuda?** Abra uma issue no GitHub ou consulte o arquivo MIGRATION.md para detalhes técnicos.
