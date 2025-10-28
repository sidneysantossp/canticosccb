# 🔧 Setup da API Backend (PHP + MySQL)

## 📋 Visão Geral

A API backend é responsável por:
- ✅ Upload de arquivos de áudio (.mp3, .wav, etc.)
- ✅ Upload de imagens (capas de hinos)
- ✅ CRUD completo de hinos (MySQL)
- ✅ Gerenciamento de categorias e compositores

---

## 🚀 Passo 1: Upload dos Arquivos PHP

### Via cPanel File Manager

1. Acesse: `https://canticosccb.com.br:2083/` (ou porta 2087 se WHM)
2. Vá para **File Manager**
3. Navegue até: `/home/canticosccb/public_html/`
4. Crie a pasta `api` (se não existir)
5. Faça upload de TODOS os arquivos da pasta `api/` do projeto:
   ```
   api/
   ├── .htaccess
   ├── config.php
   ├── hinos/
   │   └── index.php
   ├── upload/
   │   ├── audio.php
   │   └── cover.php
   └── database/
       └── create_tables.sql
   ```

### Via FTP (FileZilla)

1. Conecte via FTP:
   - Host: `ftp.canticosccb.com.br`
   - Usuário: Seu usuário cPanel
   - Senha: Sua senha
   - Porta: 21

2. Navegue até `/public_html/`
3. Arraste a pasta `api/` completa

---

## 🗄️ Passo 2: Criar Tabelas no MySQL

### Método 1: Via cPanel (phpMyAdmin)

1. Acesse cPanel → **phpMyAdmin**
2. Selecione o banco: `canticosccb_plataforma`
3. Clique em **SQL**
4. Cole TODO o conteúdo de `api/database/create_tables.sql`
5. Clique em **Executar**

### Método 2: Via SQL direto

Copie e execute este SQL:

```sql
-- Criar tabela de hinos
CREATE TABLE IF NOT EXISTS `hinos` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `numero` INT(11) DEFAULT NULL COMMENT 'Número do hino',
  `titulo` VARCHAR(255) NOT NULL COMMENT 'Título do hino',
  `compositor` VARCHAR(255) DEFAULT NULL COMMENT 'Nome do compositor',
  `categoria` VARCHAR(100) DEFAULT NULL COMMENT 'Categoria/Tema',
  `audio_url` VARCHAR(500) NOT NULL COMMENT 'URL do áudio',
  `cover_url` VARCHAR(500) DEFAULT NULL COMMENT 'URL da capa',
  `duracao` INT(11) DEFAULT NULL COMMENT 'Duração em segundos',
  `letra` TEXT DEFAULT NULL COMMENT 'Letra completa',
  `tags` TEXT DEFAULT NULL COMMENT 'Tags separadas por vírgula',
  `ativo` TINYINT(1) DEFAULT 1 COMMENT '1 = ativo, 0 = inativo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_numero` (`numero`),
  INDEX `idx_categoria` (`categoria`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Resultado esperado**: 
```
✅ Query OK, 0 rows affected (0.05 sec)
```

---

## 🧪 Passo 3: Testar a API

### Teste 1: Config

Acesse no navegador:
```
https://canticosccb.com.br/api/config.php
```

**Esperado**: Deve retornar JSON ou página em branco (CORS funcionando)

### Teste 2: Listar Hinos (vazio inicialmente)

```
https://canticosccb.com.br/api/hinos/
```

**Esperado**:
```json
{
  "hinos": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 0
}
```

### Teste 3: Upload de Áudio

Use o Postman ou curl:

```bash
curl -X POST https://canticosccb.com.br/api/upload/audio \
  -F "audio=@teste.mp3"
```

**Esperado**:
```json
{
  "success": true,
  "filename": "teste-1729280000.mp3",
  "url": "https://canticosccb.com.br/media/hinos/teste-1729280000.mp3",
  "size": 4838400
}
```

---

## 🎨 Passo 4: Configurar Frontend

### 4.1 Criar arquivo `.env`

Na raiz do projeto React:

```bash
cp .env.example .env
```

### 4.2 Editar `.env`

```env
# API Backend
VITE_API_BASE_URL=https://canticosccb.com.br/api

# Media Base URL
VITE_MEDIA_BASE_URL=https://canticosccb.com.br/media
```

### 4.3 Reiniciar servidor dev

```bash
npm run dev
```

---

## 📝 Passo 5: Testar Cadastro de Hino

1. Acesse: `http://localhost:5173/admin` (ou seu domínio)
2. Vá para: **Gerenciar Hinos**
3. Clique em: **Adicionar Hino**
4. Preencha o formulário:
   - **Título**: Teste de Upload
   - **Número**: 999
   - **Compositor**: Teste
   - **Categoria**: Louvor
   - **Áudio**: Selecione um arquivo .mp3
   - **Capa**: Selecione uma imagem .jpg (opcional)
5. Clique em: **Cadastrar Hino**

**Resultado esperado**:
- ✅ Progresso de upload aparece
- ✅ Mensagem "Hino cadastrado com sucesso!"
- ✅ Hino aparece na lista

---

## 🔍 Passo 6: Verificar no Banco

Via phpMyAdmin:

```sql
SELECT * FROM hinos ORDER BY created_at DESC LIMIT 1;
```

**Deve retornar**:
```
id: 1
numero: 999
titulo: Teste de Upload
compositor: Teste
categoria: Louvor
audio_url: https://canticosccb.com.br/media/hinos/teste-1729280000.mp3
cover_url: https://canticosccb.com.br/media/albuns/capa-1729280000.jpg
ativo: 1
created_at: 2025-10-18 19:00:00
```

---

## 🔍 Passo 7: Verificar Arquivos Salvos

### Via cPanel File Manager

1. Navegue até: `/home/canticosccb/public_html/media/hinos/`
2. Verifique se o arquivo `.mp3` está lá
3. Navegue até: `/home/canticosccb/public_html/media/albuns/`
4. Verifique se a imagem está lá

### Via FTP

1. Conecte via FileZilla
2. Vá para `/public_html/media/hinos/`
3. Confirme presença do arquivo

---

## 📊 Estrutura Final

```
/home/canticosccb/public_html/
├── api/
│   ├── .htaccess
│   ├── config.php
│   ├── hinos/
│   │   └── index.php
│   ├── upload/
│   │   ├── audio.php
│   │   └── cover.php
│   └── database/
│       └── create_tables.sql
├── media/
│   ├── hinos/
│   │   └── teste-1729280000.mp3 ✅
│   ├── albuns/
│   │   └── capa-1729280000.jpg ✅
│   ├── avatars/
│   └── covers/
└── index.html (seu frontend)
```

---

## 🆘 Troubleshooting

### Erro: "CORS policy blocked"

**Solução**: Edite `api/config.php` e adicione:
```php
header('Access-Control-Allow-Origin: *');
```

### Erro: "Connection refused"

**Solução**: Verifique se API está no lugar certo:
```bash
ls -la /home/canticosccb/public_html/api/
```

### Erro: "File too large"

**Solução**: Edite `api/.htaccess` e aumente:
```apache
php_value post_max_size 200M
php_value upload_max_filesize 100M
```

### Erro: "Database connection failed"

**Solução**: Verifique credenciais em `api/config.php`:
```php
define('DB_HOST', '203.161.46.119');
define('DB_USER', 'canticosccb_plataforma');
define('DB_PASS', 'Sidney10@KmSs147258!@#$%');
define('DB_NAME', 'canticosccb_plataforma');
```

### Erro: "Table doesn't exist"

**Solução**: Execute o SQL de criação novamente (Passo 2)

---

## 📖 Endpoints da API

### Hinos

- `GET /api/hinos/` - Listar hinos
- `GET /api/hinos/:id` - Buscar hino específico
- `POST /api/hinos/` - Criar hino
- `PUT /api/hinos/:id` - Atualizar hino
- `DELETE /api/hinos/:id` - Deletar hino

### Upload

- `POST /api/upload/audio` - Upload de áudio
- `POST /api/upload/cover` - Upload de capa

### Exemplo de Request (JavaScript)

```javascript
// Criar hino
const response = await fetch('https://canticosccb.com.br/api/hinos/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    numero: 1,
    titulo: 'Grande Deus',
    compositor: 'Desconhecido',
    categoria: 'Louvor',
    audio_url: 'https://canticosccb.com.br/media/hinos/001.mp3',
    letra: 'Grande Deus, eterno Pai...',
    ativo: true
  })
});

const hino = await response.json();
console.log('Hino criado:', hino);
```

---

## ✅ Checklist Final

- [ ] Arquivos PHP uploaded para `/public_html/api/`
- [ ] Tabela `hinos` criada no MySQL
- [ ] `.env` configurado no frontend
- [ ] Teste de upload funcionando
- [ ] Hino aparece na lista do admin
- [ ] Arquivo salvo em `/media/hinos/`
- [ ] Registro salvo no banco de dados

---

**Última atualização**: 18 de outubro de 2025  
**Autor**: Equipe Cânticos CCB

**Próximo passo**: Deploy do frontend no Vercel!
