# ⚡ Guia Rápido: Cadastro de Hinos (Admin)

## 🎯 O que foi criado

✅ **Backend API (PHP + MySQL)**
- Upload de áudio e imagens
- CRUD completo de hinos
- Integração com cPanel/VPS

✅ **Frontend (React)**
- Modal de cadastro de hinos
- Preview de áudio e imagem
- Barra de progresso de upload
- Validação de campos

✅ **Banco de Dados (MySQL)**
- Tabela `hinos` criada
- Tabelas `categorias` e `compositores`
- Índices e triggers configurados

---

## 🚀 PASSOS PARA ATIVAR (5 minutos)

### 1️⃣ Upload dos Arquivos PHP (2 min)

**Via cPanel File Manager:**

1. Acesse: `https://canticosccb.com.br:2083/`
2. Login: seu usuário / senha
3. Clique em **File Manager**
4. Navegue até: `/public_html/`
5. Clique em **Upload**
6. Selecione **TODOS** os arquivos da pasta `api/` do seu projeto:
   ```
   api/config.php
   api/.htaccess
   api/hinos/index.php
   api/upload/audio.php
   api/upload/cover.php
   api/database/create_tables.sql
   ```
7. Aguarde upload completar

### 2️⃣ Criar Tabelas no Banco (1 min)

1. No cPanel, clique em **phpMyAdmin**
2. Selecione banco: `canticosccb_plataforma`
3. Clique na aba **SQL**
4. Abra o arquivo: `api/database/create_tables.sql`
5. Copie TODO o conteúdo
6. Cole no phpMyAdmin
7. Clique em **Executar**
8. Deve aparecer: ✅ "Query OK"

### 3️⃣ Configurar Frontend (1 min)

1. Abra o terminal no projeto
2. Execute:
   ```bash
   cp .env.example .env
   ```
3. Edite `.env` e confirme:
   ```env
   VITE_API_BASE_URL=https://canticosccb.com.br/api
   VITE_MEDIA_BASE_URL=https://canticosccb.com.br/media
   ```
4. Reinicie o servidor:
   ```bash
   npm run dev
   ```

### 4️⃣ Testar Cadastro (1 min)

1. Acesse: `http://localhost:5173/admin`
2. Vá em: **Gerenciar Hinos**
3. Clique: **Adicionar Hino** (botão verde)
4. Preencha:
   - **Título**: Teste de Upload ✅
   - **Número**: 999
   - **Compositor**: Seu Nome
   - **Categoria**: Louvor
   - **Áudio**: Selecione arquivo .mp3
   - **Capa**: Selecione imagem .jpg (opcional)
5. Clique: **Cadastrar Hino**

**Resultado esperado:**
- ✅ Barra de progresso aparece
- ✅ "Hino cadastrado com sucesso!"
- ✅ Hino aparece na lista

---

## ✅ Verificar se Funcionou

### Verificação 1: Banco de Dados

**phpMyAdmin → SQL:**
```sql
SELECT * FROM hinos ORDER BY id DESC LIMIT 1;
```

**Deve mostrar:**
```
id: 1
titulo: Teste de Upload
audio_url: https://canticosccb.com.br/media/hinos/...
ativo: 1
```

### Verificação 2: Arquivo Salvo

**File Manager:**
1. Vá para: `/public_html/media/hinos/`
2. Verifique se o arquivo `.mp3` está lá
3. Clique com botão direito → **View**
4. Deve tocar o áudio!

### Verificação 3: URL Pública

Abra no navegador:
```
https://canticosccb.com.br/media/hinos/[nome-do-arquivo].mp3
```

**Deve tocar o áudio diretamente!**

---

## 📋 Campos do Formulário

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Número** | Não | Número do hino (ex: 1, 249) |
| **Título** | ✅ Sim | Nome do hino |
| **Compositor** | Não | Nome do compositor |
| **Categoria** | Não | Louvor, Gratidão, Oração, etc. |
| **Áudio** | ✅ Sim | Arquivo .mp3, .wav, .ogg (máx 50 MB) |
| **Capa** | Não | Imagem .jpg, .png (máx 10 MB) |
| **Letra** | Não | Letra completa do hino |
| **Tags** | Não | Tags separadas por vírgula |
| **Ativo** | Não | Se marcado, hino fica visível |

---

## 🎨 Recursos do Formulário

✅ **Upload Drag & Drop**
- Arraste arquivo direto para o campo

✅ **Preview em Tempo Real**
- Áudio: Player integrado
- Imagem: Visualização da capa

✅ **Barra de Progresso**
- Acompanhe upload em tempo real

✅ **Validação Automática**
- Tamanho máximo
- Formato de arquivo
- Campos obrigatórios

✅ **Feedback Visual**
- ✅ Sucesso em verde
- ❌ Erro em vermelho

---

## 🆘 Problemas Comuns

### "Erro ao cadastrar hino"

**Causa**: API não está acessível

**Solução**:
1. Verifique se arquivos PHP foram enviados
2. Teste: `https://canticosccb.com.br/api/hinos/`
3. Deve retornar JSON, não erro 404

### "Arquivo muito grande"

**Causa**: Limite de upload

**Solução**:
1. Edite `api/.htaccess`
2. Aumente:
   ```apache
   php_value post_max_size 200M
   php_value upload_max_filesize 100M
   ```

### "CORS error"

**Causa**: Headers CORS não configurados

**Solução**:
1. Verifique `api/config.php`
2. Deve ter:
   ```php
   header('Access-Control-Allow-Origin: *');
   ```

### "Database error"

**Causa**: Tabela não foi criada

**Solução**:
1. Execute o SQL novamente (Passo 2)
2. Verifique credenciais em `api/config.php`

---

## 📊 Estrutura Completa

```
Projeto Local:
c:\xampp\htdocs\1canticosccb\
├── src/
│   ├── pages/admin/
│   │   ├── AdminHymns.tsx ✅
│   │   └── components/hymns/
│   │       └── HymnCreateModal.tsx ✅
│   └── lib/
│       ├── mysql.ts ✅
│       ├── config.ts ✅
│       └── media-helper.ts ✅
└── api/
    ├── config.php ✅
    ├── .htaccess ✅
    ├── hinos/index.php ✅
    ├── upload/
    │   ├── audio.php ✅
    │   └── cover.php ✅
    └── database/
        └── create_tables.sql ✅

Servidor (VPS):
/home/canticosccb/public_html/
├── api/ ← Upload AQUI
│   ├── config.php
│   ├── .htaccess
│   ├── hinos/
│   ├── upload/
│   └── database/
└── media/ ← Arquivos salvos AQUI
    ├── hinos/
    └── albuns/
```

---

## 🎉 Próximos Passos

Depois de testar:

1. **Cadastre hinos reais**
   - Use arquivos .mp3 de qualidade
   - Adicione capas bonitas
   - Preencha letra completa

2. **Organize categorias**
   - Crie categorias personalizadas
   - Agrupe hinos por tema

3. **Teste no frontend público**
   - Acesse `/` (home)
   - Busque o hino cadastrado
   - Toque para confirmar

4. **Deploy no Vercel**
   - Push para GitHub
   - Conectar Vercel
   - Configurar variáveis de ambiente

---

## 📞 Suporte

Se algo não funcionar:

1. **Console do navegador** (F12)
   - Veja erros em vermelho
   - Copie a mensagem

2. **Logs PHP**
   - cPanel → **Error Log**
   - Verifique mensagens de erro

3. **Teste endpoints direto**
   - `https://canticosccb.com.br/api/hinos/`
   - Deve retornar JSON

---

**Tudo pronto!** 🎵

Agora você pode cadastrar hinos com upload automático de arquivos e salvamento no banco de dados MySQL!

**Tempo estimado**: 5 minutos  
**Dificuldade**: ⭐⭐ (Fácil)
