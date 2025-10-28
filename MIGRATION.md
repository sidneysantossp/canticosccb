# 🚀 Guia de Migração: Supabase → Firebase + VPS

## 📋 Status da Migração

### ✅ Concluído
- [x] **Firebase Auth implementado** em `AuthContextMock.tsx`
- [x] **Firestore configurado** para perfis de usuário
- [x] **Variáveis de ambiente** configuradas (`.env.example`)
- [x] **Rotas inglês/português** configuradas em `App.tsx`

### 🔄 Em Progresso
- [ ] **Migração de mídia** para VPS
- [ ] **Setup GitHub** para versionamento
- [ ] **Deploy Vercel** automatizado

### 📅 Pendente
- [ ] Migração de dados existentes do Supabase
- [ ] Configuração de CDN para mídia
- [ ] Testes de integração completos
- [ ] Documentação de API

---

## 🔧 Configuração do Ambiente

### 1. Criar arquivo `.env` local

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais reais do Firebase:

```env
# Firebase Configuration (obtido no console Firebase)
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

### 2. Instalar dependências Firebase (se necessário)

```bash
npm install firebase
```

---

## 🔐 Autenticação (Firebase Auth + Firestore)

### Arquivos Modificados
- ✅ `src/contexts/AuthContextMock.tsx` → Migrado para Firebase Auth
- ✅ `src/lib/firebase.ts` → Configuração Firebase
- ✅ `src/main.tsx` → Router centralizado

### Como Funciona

1. **Login**: `signInWithEmailAndPassword()` do Firebase Auth
2. **Registro**: `createUserWithEmailAndPassword()` + criação de perfil no Firestore
3. **Perfil do Usuário**: Armazenado em `users/{uid}` no Firestore com:
   ```typescript
   {
     id: string,
     email: string,
     name: string,
     avatar_url?: string,
     plan: 'free' | 'premium',
     is_admin: boolean,
     is_composer: boolean,
     is_blocked?: boolean,
     email_verified?: boolean
   }
   ```

4. **Real-time**: `onAuthStateChanged()` mantém estado sincronizado

### Testando Autenticação

```bash
# Inicie o servidor dev
npm run dev

# Acesse http://localhost:5173/login
# Registre um novo usuário
# Login será autenticado via Firebase
```

---

## 🎵 Armazenamento de Mídia (VPS)

### Arquitetura Planejada

```
Frontend (Vercel)
    ↓
Firestore (metadados: título, artista, categoria)
    ↓
VPS (nginx) → Streaming de .mp3/.mp4
URL: https://media.canticosccb.com/hinos/{id}.mp3
```

### Setup do VPS (Próximo Passo)

**Opções recomendadas:**
- **Contabo**: 4GB RAM, 200GB SSD, €4.99/mês
- **Hetzner**: 4GB RAM, 80GB SSD, €4.51/mês
- **DigitalOcean**: 2GB RAM, 50GB SSD, $12/mês

**Stack do VPS:**
```
Ubuntu 22.04 LTS
nginx (web server + streaming)
Node.js (API de upload opcional)
Certbot (SSL/HTTPS)
```

### Estrutura de Pastas no VPS

```
/var/www/media/
├── hinos/
│   ├── 001.mp3
│   ├── 002.mp3
│   └── ...
├── albuns/
│   └── cover-{id}.jpg
└── avatars/
    └── user-{id}.jpg
```

### Configuração nginx (exemplo)

```nginx
server {
    listen 80;
    server_name media.canticosccb.com;
    
    root /var/www/media;
    
    location /hinos/ {
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
        mp4; # módulo de streaming
    }
    
    location /albuns/ {
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

---

## 🐙 GitHub + Vercel

### 1. Criar Repositório no GitHub

```bash
# Na raiz do projeto
git init
git add .
git commit -m "Initial commit - Firebase migration"
git branch -M main
git remote add origin https://github.com/seu-usuario/canticosccb.git
git push -u origin main
```

### 2. Deploy no Vercel

**Via Dashboard:**
1. Acesse [vercel.com](https://vercel.com)
2. Import Git Repository
3. Selecione `canticosccb`
4. Configure variáveis de ambiente (copie de `.env`)
5. Deploy!

**Via CLI:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Variáveis de Ambiente no Vercel

Adicione no dashboard Vercel (Settings → Environment Variables):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

---

## 📊 Migração de Dados (Supabase → Firestore)

### Scripts de Migração (a criar)

```typescript
// scripts/migrate-users.ts
import { supabase } from './old-supabase';
import { db } from './firebase';

async function migrateUsers() {
  const { data: users } = await supabase.from('users').select('*');
  
  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan || 'free',
      is_admin: user.is_admin || false,
      is_composer: user.is_composer || false,
    });
  }
  
  console.log(`✅ ${users.length} usuários migrados`);
}
```

---

## 🧪 Testes

### Checklist de Testes

- [ ] Login com email/senha funciona
- [ ] Registro cria usuário no Firestore
- [ ] Logout limpa estado
- [ ] Refresh mantém autenticação
- [ ] Rotas protegidas bloqueiam acesso não autenticado
- [ ] Admin/Composer roles funcionam corretamente
- [ ] URLs de mídia carregam do VPS
- [ ] Deploy no Vercel funciona sem erros

---

## 📚 Recursos

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Vercel Docs](https://vercel.com/docs)
- [nginx Streaming](http://nginx.org/en/docs/http/ngx_http_mp4_module.html)

---

## 🆘 Troubleshooting

### "Firebase não está definido"
→ Verifique se `.env` está configurado e reinicie o servidor

### "CORS error ao carregar mídia"
→ Adicione headers CORS no nginx:
```nginx
add_header Access-Control-Allow-Origin *;
```

### "Deploy falha no Vercel"
→ Verifique variáveis de ambiente no dashboard

---

## 📝 Notas

- **Custo estimado**: $5-20/mês (VPS) + $0 (Firebase free tier) + $0 (Vercel free tier)
- **Escalabilidade**: Firebase auto-scale até 1M leituras/dia grátis
- **Backup**: Configurar backup automático do VPS e export do Firestore
- **CDN**: Considerar Cloudflare na frente do VPS para cache global

---

**Última atualização**: 18 de outubro de 2025
**Autor**: Migração automatizada via Cascade AI
