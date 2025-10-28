# 🔥 Guia de Configuração Firebase - Cânticos CCB

## ✅ Configuração Inicial Concluída

### 1. Dependências Instaladas
- ✅ `firebase` instalado via npm

### 2. Arquivos Criados
- ✅ `src/lib/firebase.ts` - Configuração principal do Firebase
- ✅ `src/lib/firebaseHelpers.ts` - Funções auxiliares para Firestore e Storage
- ✅ `.env.example` - Atualizado com suas credenciais

### 3. Variáveis de Ambiente Configuradas
```env
VITE_FIREBASE_API_KEY=AIzaSyA4kAO_LMNtD7UvJrYB9yCqdsiylkRI0sk
VITE_FIREBASE_AUTH_DOMAIN=canticosccb-93133.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=canticosccb-93133
VITE_FIREBASE_STORAGE_BUCKET=canticosccb-93133.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=738151357983
VITE_FIREBASE_APP_ID=1:738151357983:web:9c3cdbac35f6707469ff2a
VITE_FIREBASE_MEASUREMENT_ID=G-09DDLDHF2S
```

---

## 📋 Próximos Passos Obrigatórios

### **Passo 1: Copiar as variáveis de ambiente**

Execute no terminal:
```bash
copy .env.example .env
```

Ou crie manualmente o arquivo `.env` na raiz do projeto com o conteúdo do `.env.example`

### **Passo 2: Habilitar Authentication no Firebase Console**

1. Acesse: https://console.firebase.google.com/project/canticosccb-93133/authentication
2. Clique em **"Começar"**
3. Vá em **"Sign-in method"**
4. Habilite **"E-mail/senha"**
5. (Opcional) Habilite **"Google"** para login social

### **Passo 3: Configurar Storage no Firebase Console**

1. Acesse: https://console.firebase.google.com/project/canticosccb-93133/storage
2. Clique em **"Começar"**
3. Escolha **"Iniciar no modo de teste"**
4. Selecione região: **southamerica-east1 (São Paulo)**

### **Passo 4: Configurar Regras de Segurança do Firestore**

1. Acesse: https://console.firebase.google.com/project/canticosccb-93133/firestore/rules
2. Cole as regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função auxiliar para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_admin == true;
    }
    
    // Hinos - Leitura pública, escrita admin
    match /hymns/{hymnId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Compositores - Leitura pública, escrita admin ou próprio compositor
    match /composers/{composerId} {
      allow read: if true;
      allow write: if isAdmin() || (request.auth != null && request.auth.uid == composerId);
    }
    
    // Álbuns - Leitura pública, escrita admin
    match /albums/{albumId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Categorias - Leitura pública, escrita admin
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Banners - Leitura pública, escrita admin
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Usuários - Leitura autenticada, escrita próprio usuário ou admin
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Playlists de usuários - Privadas
    match /user_playlists/{playlistId} {
      allow read, write: if request.auth != null && 
                            resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Favoritos - Privados
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null && 
                            resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Analytics - Escrita pública, leitura admin
    match /hymn_plays/{playId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
    
    // Notificações - Leitura próprio usuário
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
                    resource.data.user_id == request.auth.uid;
      allow write: if isAdmin();
    }
  }
}
```

### **Passo 5: Configurar Regras de Segurança do Storage**

1. Acesse: https://console.firebase.google.com/project/canticosccb-93133/storage/rules
2. Cole as regras abaixo:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Função auxiliar para verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.is_admin == true;
    }
    
    // Imagens de hinos (público ler, admin escrever)
    match /hymns/{hymnId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Imagens de compositores (público ler, admin/compositor escrever)
    match /composers/{composerId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin() || (request.auth != null && request.auth.uid == composerId);
    }
    
    // Avatares de usuários (público ler, próprio usuário escrever)
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Álbuns (público ler, admin escrever)
    match /albums/{albumId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Banners (público ler, admin escrever)
    match /banners/{bannerId}/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Arquivos temporários (próprio usuário)
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔧 Como Usar no Código

### **Importar Firebase**

```typescript
import { db, auth, storage } from '@/lib/firebase';
import { 
  getDocument, 
  getDocuments, 
  setDocument, 
  updateDocument,
  deleteDocument,
  uploadFile,
  deleteFile 
} from '@/lib/firebaseHelpers';
```

### **Exemplos de Uso**

#### **1. Buscar um hino por ID**
```typescript
const hymn = await getDocument('hymns', 'hymn-123');
```

#### **2. Buscar todos os hinos com filtros**
```typescript
import { where, orderBy, limit } from 'firebase/firestore';

const hymns = await getDocuments('hymns', [
  where('is_published', '==', true),
  orderBy('plays_count', 'desc'),
  limit(10)
]);
```

#### **3. Criar/atualizar um documento**
```typescript
await setDocument('hymns', 'hymn-123', {
  title: 'Hino 1',
  number: 1,
  composer_id: 'composer-1',
  plays_count: 0
});
```

#### **4. Upload de arquivo**
```typescript
const url = await uploadFile(
  'hymns/hymn-123/cover.jpg',
  file,
  (progress) => console.log(`Upload: ${progress}%`)
);
```

#### **5. Autenticação**
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const userCredential = await signInWithEmailAndPassword(
  auth,
  'email@exemplo.com',
  'senha123'
);
```

---

## 📊 Estrutura de Coleções Recomendada

```
📁 Firestore Database
├── 📄 users/
│   └── {userId}
│       ├── email
│       ├── name
│       ├── avatar_url
│       ├── is_admin
│       ├── is_composer
│       └── created_at
│
├── 📄 hymns/
│   └── {hymnId}
│       ├── number
│       ├── title
│       ├── composer_id
│       ├── lyrics
│       ├── audio_url
│       ├── cover_url
│       ├── plays_count
│       └── created_at
│
├── 📄 composers/
│   └── {composerId}
│       ├── name
│       ├── bio
│       ├── avatar_url
│       ├── followers_count
│       └── is_verified
│
├── 📄 albums/
├── 📄 categories/
├── 📄 banners/
├── 📄 user_playlists/
├── 📄 favorites/
└── 📄 hymn_plays/
```

---

## ✅ Checklist de Configuração

- [ ] Copiar `.env.example` para `.env`
- [ ] Habilitar Authentication (Email/Password)
- [ ] Habilitar Storage
- [ ] Configurar regras de segurança do Firestore
- [ ] Configurar regras de segurança do Storage
- [ ] Testar conexão com Firebase
- [ ] Criar primeiro usuário admin
- [ ] Importar dados do Supabase (se houver)

---

## 🚀 Testar Configuração

Execute o projeto:
```bash
npm run dev
```

Abra o console do navegador e verifique se não há erros do Firebase.

---

## 📞 Links Úteis

- Firebase Console: https://console.firebase.google.com/project/canticosccb-93133
- Authentication: https://console.firebase.google.com/project/canticosccb-93133/authentication
- Firestore: https://console.firebase.google.com/project/canticosccb-93133/firestore
- Storage: https://console.firebase.google.com/project/canticosccb-93133/storage
- Documentação: https://firebase.google.com/docs/web/setup
