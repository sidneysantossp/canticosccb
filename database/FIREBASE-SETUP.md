# 🔥 Configuração Firebase Auth + MySQL

## 🏗️ **Arquitetura**

```
┌─────────────────────────────────────────────┐
│          FIREBASE (Autenticação)            │
│  - Login/Logout                             │
│  - Gerenciamento de senhas                  │
│  - Tokens JWT                               │
│  - Email verification                       │
└─────────────────┬───────────────────────────┘
                  │
                  │ Sincronização
                  ▼
┌─────────────────────────────────────────────┐
│        MYSQL (Dados do Perfil)              │
│  - firebase_uid (referência)                │
│  - nome, email, avatar_url                  │
│  - tipo (usuario/compositor/admin)          │
│  - Dados complementares                     │
└─────────────────────────────────────────────┘
```

---

## 🚀 **Configuração Inicial**

### **1. Criar Usuário Admin no Firebase**

1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto: **canticosccb-93133**
3. Vá em **Authentication** → **Users**
4. Clique em **Add user**
5. Preencha:
   - **Email:** `admin@canticosccb.com.br`
   - **Password:** (crie uma senha forte)
6. Clique em **Add user**
7. **COPIE O UID** gerado (exemplo: `xYz123aBc456DeF...`)

### **2. Sincronizar no MySQL**

```sql
-- Substitua 'SEU_FIREBASE_UID' pelo UID copiado
UPDATE usuarios 
SET firebase_uid = 'SEU_FIREBASE_UID'
WHERE email = 'admin@canticosccb.com.br';

-- Ou insira diretamente:
INSERT INTO usuarios (firebase_uid, nome, email, tipo, ativo) 
VALUES ('SEU_FIREBASE_UID', 'Administrador', 'admin@canticosccb.com.br', 'admin', 1);
```

---

## 🔄 **Fluxo de Autenticação**

### **Login (Frontend)**

```typescript
// src/contexts/AuthContext.tsx
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const login = async (email: string, password: string) => {
  // 1. Autentica no Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // 2. Busca dados do perfil no MySQL
  const response = await fetch(`/api/usuarios/by-firebase-uid/${firebaseUser.uid}`);
  const userData = await response.json();
  
  // 3. Atualiza estado local
  setUser({
    id: userData.id,
    firebaseUid: firebaseUser.uid,
    nome: userData.nome,
    email: userData.email,
    tipo: userData.tipo,
    avatarUrl: userData.avatar_url
  });
};
```

### **Registro (Frontend)**

```typescript
const register = async (email: string, password: string, nome: string) => {
  // 1. Cria usuário no Firebase
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // 2. Cria perfil no MySQL
  await fetch('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify({
      firebase_uid: firebaseUser.uid,
      nome,
      email,
      tipo: 'usuario',
      ativo: 1
    })
  });
};
```

---

## 🛠️ **Endpoints da API Necessários**

### **1. Criar endpoint para buscar por Firebase UID**

```php
// api/usuarios/by-firebase-uid.php
<?php
require_once __DIR__ . '/../config.php';

$firebase_uid = $_GET['uid'] ?? null;

if (!$firebase_uid) {
    jsonResponse(['error' => 'UID não fornecido'], 400);
}

$conn = getDBConnection();
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE firebase_uid = ?");
$stmt->execute([$firebase_uid]);
$usuario = $stmt->fetch();

if (!$usuario) {
    jsonResponse(['error' => 'Usuário não encontrado'], 404);
}

jsonResponse($usuario);
?>
```

### **2. Atualizar endpoint de criação de usuário**

```php
// api/usuarios/index.php (POST)
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['firebase_uid']) || empty($data['email'])) {
    jsonResponse(['error' => 'firebase_uid e email são obrigatórios'], 400);
}

$sql = "INSERT INTO usuarios (firebase_uid, nome, email, avatar_url, tipo, ativo) 
        VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->execute([
    $data['firebase_uid'],
    $data['nome'],
    $data['email'],
    $data['avatar_url'] ?? null,
    $data['tipo'] ?? 'usuario',
    isset($data['ativo']) ? (int)$data['ativo'] : 1
]);
```

---

## 📋 **Checklist de Setup**

### **Backend (MySQL)**
- [x] Tabela `usuarios` com campo `firebase_uid`
- [ ] Endpoint GET `/api/usuarios/by-firebase-uid/{uid}`
- [ ] Endpoint POST `/api/usuarios` aceita `firebase_uid`
- [ ] Remover validação de senha (Firebase cuida disso)

### **Frontend (React)**
- [ ] Configuração Firebase em `src/lib/firebase.ts`
- [ ] AuthContext integrado com Firebase Auth
- [ ] Login sincroniza Firebase → MySQL
- [ ] Registro cria usuário em ambos
- [ ] Logout limpa ambos estados

### **Firebase Console**
- [ ] Usuário admin criado
- [ ] Email verification configurado (opcional)
- [ ] Custom claims para roles (opcional)

---

## 🔐 **Segurança**

### **Validação de Token JWT**

Para proteger endpoints admin, valide o token Firebase:

```php
// api/middleware/auth.php
function validateFirebaseToken($token) {
    // Usar Firebase Admin SDK para validar token
    // Retornar UID do usuário se válido
}

// Em cada endpoint protegido:
$token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $token);

if (!$token) {
    jsonResponse(['error' => 'Token não fornecido'], 401);
}

$firebase_uid = validateFirebaseToken($token);

// Buscar usuário e verificar permissões
$stmt = $conn->prepare("SELECT tipo FROM usuarios WHERE firebase_uid = ?");
$stmt->execute([$firebase_uid]);
$user = $stmt->fetch();

if ($user['tipo'] !== 'admin') {
    jsonResponse(['error' => 'Acesso negado'], 403);
}
```

---

## 🧪 **Teste Rápido**

### **1. Criar usuário de teste no Firebase**
```javascript
// No console do navegador
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';

await createUserWithEmailAndPassword(auth, 'teste@email.com', 'senha123');
// Copie o UID retornado
```

### **2. Sincronizar no MySQL**
```sql
INSERT INTO usuarios (firebase_uid, nome, email, tipo, ativo) 
VALUES ('UID_COPIADO', 'Usuário Teste', 'teste@email.com', 'usuario', 1);
```

### **3. Fazer login no frontend**
```typescript
await signInWithEmailAndPassword(auth, 'teste@email.com', 'senha123');
// Deve retornar dados do MySQL
```

---

## 📊 **Migração de Usuários Existentes**

Se você já tem usuários no sistema antigo:

```sql
-- Adicionar firebase_uid em lote (depois de criar no Firebase)
UPDATE usuarios 
SET firebase_uid = 'firebase_uid_correspondente'
WHERE email = 'email@usuario.com';
```

---

## 🆘 **Troubleshooting**

### **Erro: "User not found in MySQL"**
- Certifique-se de criar o perfil no MySQL após registro no Firebase
- Verifique se `firebase_uid` está correto

### **Erro: "Invalid token"**
- Token expirado - reautentique no Firebase
- Token malformado - verifique header Authorization

### **Erro: "Email already exists"**
- Email já existe no Firebase
- Use recuperação de senha ou faça login

---

## 📝 **Exemplo Completo de AuthContext**

```typescript
// src/contexts/AuthContext.tsx
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usuariosApi } from '@/lib/api-client';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listener do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Buscar dados no MySQL
        const response = await fetch(
          `/api/usuarios/by-firebase-uid/${firebaseUser.uid}`
        );
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged irá buscar dados automaticamente
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    
    // Criar perfil no MySQL
    await usuariosApi.create({
      firebase_uid: userCredential.user.uid,
      nome,
      email,
      tipo: 'usuario',
      ativo: 1
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

**Última Atualização:** 2025-01-18
