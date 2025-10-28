# Guia de Deploy - Cânticos CCB

## Arquitetura de Portas

### Desenvolvimento Local

**Frontend (Vite):**
- Porta: 5173 (ou outra disponível)
- URL: `http://localhost:5173` ou `http://192.168.0.11:5173`
- Serve apenas arquivos React (HTML, CSS, JS)

**Backend (Apache/XAMPP):**
- Porta: 80 (padrão HTTP)
- URL: `http://localhost/1canticosccb/api` ou `http://192.168.0.11/1canticosccb/api`
- Serve APIs PHP e arquivos de mídia

**Por que não incluir a porta do Vite nas URLs de API?**
- O Vite (porta 5173) serve apenas o frontend
- O Apache (porta 80) serve as APIs
- As URLs de API sempre apontam para porta 80, não 5173

### Produção

**Frontend:**
- Build estático hospedado no Vercel/Netlify
- URL: `https://canticosccb.com.br`
- Porta: 443 (HTTPS padrão)

**Backend:**
- Hospedado no cPanel/VPS
- URL: `https://canticosccb.com.br/api`
- Porta: 443 (HTTPS padrão)

**Mídia:**
- Hospedada no mesmo servidor
- URL: `https://canticosccb.com.br/media`
- Porta: 443 (HTTPS padrão)

## Como as URLs são Geradas

### Desenvolvimento (localhost ou IP local)

```typescript
// Frontend acessa via: http://192.168.0.11:5173
// APIs são chamadas em: http://192.168.0.11/1canticosccb/api/...
// Áudio é servido em: http://192.168.0.11/1canticosccb/api/stream.php?...
```

**Detecção automática:**
```typescript
const isLocalhost = 
  hostname === 'localhost' || 
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.0.');
```

### Produção

```typescript
// Frontend: https://canticosccb.com.br
// APIs: https://canticosccb.com.br/api/...
// Áudio: https://canticosccb.com.br/api/stream.php?...
```

## Configuração de Produção

### 1. Build do Frontend

```bash
npm run build
```

Isso gera a pasta `dist/` com arquivos estáticos.

### 2. Deploy no Vercel/Netlify

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
netlify deploy --prod --dir=dist
```

### 3. Configurar Variáveis de Ambiente

Criar `.env.production`:
```env
VITE_API_BASE_URL=https://canticosccb.com.br/api
VITE_MEDIA_BASE_URL=https://canticosccb.com.br/media
```

### 4. Backend no cPanel

**Estrutura de pastas:**
```
/home/canticosccb/public_html/
├── api/                    # APIs PHP
│   ├── auth/
│   ├── compositores/
│   ├── hinos/
│   └── stream.php
├── media_protegida/        # Arquivos protegidos
│   ├── hinos/
│   ├── avatars/
│   └── covers/
└── .htaccess              # Configurações Apache
```

**Configurar CORS no `.htaccess`:**
```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://canticosccb.com.br"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

## Testando em Rede Local

### No PC (servidor):
1. Iniciar XAMPP (Apache)
2. Iniciar Vite: `npm run dev`
3. Descobrir IP: `ipconfig` → 192.168.0.11

### No celular (cliente):
1. Conectar na mesma rede Wi-Fi
2. Acessar: `http://192.168.0.11:5173`
3. As APIs serão chamadas em: `http://192.168.0.11/1canticosccb/api/...`

**Importante:**
- O celular acessa o Vite na porta 5173
- Mas as APIs são chamadas na porta 80 (Apache)
- Isso funciona porque são portas diferentes no mesmo IP

## Solução de Problemas

### Compositores não aparecem
- Verificar console: deve mostrar `🌐 API Request: http://192.168.0.11/1canticosccb/api/...`
- Testar URL diretamente no navegador
- Verificar se Apache está rodando (porta 80)

### Áudio não toca no celular
- Verificar se o arquivo MP3 existe
- Testar URL do stream.php diretamente
- Verificar CORS no Apache
- Verificar modo silencioso do iPhone
- Verificar volume do sistema

### ERR_CONNECTION_REFUSED
- Apache não está rodando
- Firewall bloqueando porta 80
- Celular não está na mesma rede Wi-Fi

## Resumo

✅ **Desenvolvimento:** Frontend (5173) + Backend (80) no mesmo IP  
✅ **Produção:** Frontend (443) + Backend (443) no mesmo domínio  
✅ **URLs dinâmicas:** Detectam automaticamente o ambiente  
✅ **Sem porta nas APIs:** Sempre usa porta padrão (80 ou 443)
