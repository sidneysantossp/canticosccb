# 📘 Guia Rápido da API PHP

## 🚀 Início Rápido

### **Base URL**
```
Local:     http://localhost/1canticosccb/api
Produção:  https://canticosccb.com.br/api
```

### **Configuração**
Todas as configurações estão em `/api/config.php`:
- Conexão MySQL
- Diretórios de upload
- Tamanhos máximos
- Formatos permitidos

---

## 📋 Endpoints Disponíveis

### **1. Hinos** `/api/hinos`

#### **Listar Hinos**
```http
GET /api/hinos?categoria=louvor&page=1&limit=20
```

**Parâmetros de Query:**
- `categoria` (opcional)
- `compositor` (opcional)
- `ativo` (opcional): 0 ou 1
- `page` (opcional): padrão 1
- `limit` (opcional): padrão 20, max 100

**Resposta:**
```json
{
  "hinos": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

#### **Buscar Hino**
```http
GET /api/hinos/123
```

#### **Criar Hino**
```http
POST /api/hinos
Content-Type: application/json

{
  "numero": 1,
  "titulo": "Nome do Hino",
  "compositor": "Compositor",
  "categoria": "louvor",
  "audio_url": "https://...",
  "cover_url": "https://...",
  "duracao": "3:45",
  "letra": "Letra...",
  "tags": "louvor, adoração",
  "ativo": 1
}
```

#### **Atualizar Hino**
```http
PUT /api/hinos/123
Content-Type: application/json

{
  "titulo": "Novo Título",
  "ativo": 0
}
```

#### **Deletar Hino**
```http
DELETE /api/hinos/123
```

---

### **2. Compositores** `/api/compositores`

#### **Listar Compositores**
```http
GET /api/compositores?search=joão&page=1&limit=20
```

#### **Criar Compositor**
```http
POST /api/compositores
Content-Type: application/json

{
  "nome": "João Silva",
  "nome_artistico": "João Cantor",
  "biografia": "Compositor de hinos...",
  "avatar_url": "https://...",
  "verificado": 1,
  "ativo": 1
}
```

#### **Atualizar Compositor**
```http
PUT /api/compositores/123
Content-Type: application/json

{
  "biografia": "Nova biografia...",
  "verificado": 1
}
```

---

### **3. Álbuns** `/api/albuns`

#### **Listar Álbuns**
```http
GET /api/albuns?search=coletânea&page=1&limit=20
```

#### **Criar Álbum**
```http
POST /api/albuns
Content-Type: application/json

{
  "titulo": "Coletânea 2024",
  "descricao": "Descrição do álbum",
  "cover_url": "https://...",
  "ano": 2024,
  "compositor_id": 5,
  "ativo": 1
}
```

---

### **4. Categorias** `/api/categorias`

#### **Listar Categorias**
```http
GET /api/categorias?search=louvor&limit=50
```

#### **Criar Categoria**
```http
POST /api/categorias
Content-Type: application/json

{
  "nome": "Louvor",
  "slug": "louvor",
  "descricao": "Hinos de louvor",
  "imagem_url": "https://...",
  "ativo": 1
}
```

---

### **5. Usuários** `/api/usuarios`

#### **Listar Usuários**
```http
GET /api/usuarios?search=maria&page=1&limit=20
```

#### **Criar Usuário**
```http
POST /api/usuarios
Content-Type: application/json

{
  "nome": "Maria Santos",
  "email": "maria@email.com",
  "avatar_url": "https://...",
  "tipo": "usuario",
  "ativo": 1
}
```

**Tipos de Usuário:**
- `usuario` - Usuário comum
- `compositor` - Compositor
- `admin` - Administrador

---

### **6. Uploads**

#### **Upload de Áudio**
```http
POST /api/upload/audio
Content-Type: multipart/form-data

audio: [arquivo.mp3]
```

**Formatos Aceitos:** mp3, wav, ogg, m4a  
**Tamanho Máximo:** 50 MB

**Resposta:**
```json
{
  "success": true,
  "filename": "audio-1234567890.mp3",
  "url": "https://canticosccb.com.br/api/stream.php?type=hinos&file=audio-1234567890.mp3",
  "size": 4567890
}
```

#### **Upload de Capa**
```http
POST /api/upload/cover
Content-Type: multipart/form-data

cover: [imagem.jpg]
```

**Formatos Aceitos:** jpg, jpeg, png, webp  
**Tamanho Máximo:** 10 MB

**Resposta:**
```json
{
  "success": true,
  "filename": "cover-1234567890.jpg",
  "url": "https://canticosccb.com.br/api/stream.php?type=albuns&file=cover-1234567890.jpg",
  "size": 234567,
  "dimensions": {
    "width": 1200,
    "height": 1200
  }
}
```

#### **Upload de Avatar**
```http
POST /api/upload/avatar
Content-Type: multipart/form-data

avatar: [imagem.jpg]
```

---

## 🔒 **Sistema de Streaming Protegido**

Todos os arquivos de mídia são servidos via `/api/stream.php`:

```
https://canticosccb.com.br/api/stream.php?type=hinos&file=arquivo.mp3
https://canticosccb.com.br/api/stream.php?type=albuns&file=capa.jpg
https://canticosccb.com.br/api/stream.php?type=avatars&file=avatar.jpg
```

**Tipos Permitidos:**
- `hinos` - Arquivos de áudio
- `albuns` - Capas de álbuns
- `avatars` - Avatars de usuários/compositores
- `covers` - Outras capas

**Segurança:**
- ✅ Path traversal bloqueado
- ✅ Validação de tipos
- ✅ Verificação de arquivo existente
- ✅ MIME types corretos
- ✅ Suporte a Range Requests (seek no player)

---

## 💻 **Uso no Frontend (TypeScript)**

### **Instalação**
Nenhuma instalação necessária. O cliente já está em `src/lib/api-client.ts`.

### **Importação**
```typescript
import { 
  hinosApi, 
  compositoresApi, 
  albunsApi, 
  categoriasApi, 
  usuariosApi, 
  uploadApi 
} from '@/lib/api-client';
```

### **Exemplos de Uso**

#### **Listar Hinos**
```typescript
const response = await hinosApi.list({ 
  categoria: 'louvor',
  page: 1,
  limit: 20 
});

if (response.data) {
  console.log('Hinos:', response.data.hinos);
  console.log('Total:', response.data.total);
} else {
  console.error('Erro:', response.error);
}
```

#### **Criar Compositor**
```typescript
const response = await compositoresApi.create({
  nome: 'João Silva',
  nome_artistico: 'João Cantor',
  biografia: 'Compositor...',
  verificado: 1,
  ativo: 1
});

if (response.data) {
  console.log('Compositor criado:', response.data);
} else {
  console.error('Erro:', response.error);
}
```

#### **Upload de Arquivo**
```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const response = await uploadApi.audio(file);

if (response.data) {
  console.log('Upload sucesso!');
  console.log('URL:', response.data.url);
  console.log('Filename:', response.data.filename);
} else {
  console.error('Erro:', response.error);
}
```

#### **Tratamento de Erros**
```typescript
try {
  const response = await hinosApi.get(123);
  
  if (response.error) {
    // Erro da API
    alert(response.error);
  } else if (response.data) {
    // Sucesso
    console.log(response.data);
  }
} catch (error) {
  // Erro de rede/conexão
  console.error('Erro de conexão:', error);
}
```

---

## 🎯 **Boas Práticas**

### **1. Sempre Validar Dados**
```typescript
if (!formData.nome.trim()) {
  throw new Error('Nome é obrigatório');
}
```

### **2. Converter Booleanos**
```typescript
// MySQL espera 0 ou 1, não true/false
const data = {
  ativo: formData.ativo ? 1 : 0,
  verificado: formData.verificado ? 1 : 0
};
```

### **3. Tratar IDs Numéricos**
```typescript
// IDs são numéricos no MySQL
const id = Number(params.id);
await compositoresApi.get(id);
```

### **4. Feedback ao Usuário**
```typescript
try {
  setLoading(true);
  const response = await compositoresApi.create(data);
  
  if (response.error) {
    setError(response.error);
  } else {
    setSuccess('Compositor criado com sucesso!');
    navigate('/admin/composers');
  }
} finally {
  setLoading(false);
}
```

---

## 🐛 **Troubleshooting**

### **Erro: "Erro de conexão"**
- ✅ Verificar se MySQL está rodando
- ✅ Verificar credenciais em `/api/config.php`
- ✅ Verificar nome do banco de dados

### **Erro: "Nenhum arquivo enviado"**
- ✅ Verificar nome do campo no FormData
- ✅ Deve ser: `audio`, `cover` ou `avatar`

### **Erro: "CORS"**
- ✅ CORS já configurado em `config.php`
- ✅ Verificar se headers estão sendo enviados

### **Erro: "404 Not Found"**
- ✅ Verificar URL base (`VITE_API_BASE_URL`)
- ✅ Verificar se arquivo PHP existe
- ✅ Verificar .htaccess configurado

---

## 📊 **Estrutura de Resposta Padrão**

### **Sucesso**
```json
{
  "data": {
    "id": 123,
    "nome": "...",
    ...
  }
}
```

### **Erro**
```json
{
  "error": "Mensagem de erro"
}
```

### **Lista Paginada**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

## 🔐 **Segurança**

### **SQL Injection**
✅ Todas as queries usam **prepared statements**

### **XSS**
✅ JSON encoding com flags de segurança

### **File Upload**
✅ Validação de tipo e tamanho  
✅ Nome sanitizado  
✅ Pasta fora de public_html

### **Path Traversal**
✅ `basename()` em todos os arquivos  
✅ Validação de tipos permitidos

---

**Documentação Completa**
Versão: 1.0  
Data: 2025-01-18
