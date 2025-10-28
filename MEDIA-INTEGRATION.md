# 🎵 Integração de Mídia - VPS

## 📋 Visão Geral

Todos os arquivos de mídia (.mp3, .mp4, imagens) estão hospedados na VPS em:
```
https://canticosccb.com.br/media/
```

## 🚀 Como Usar

### 1. Importar Helpers

```typescript
import { getHinoUrl, getAlbumCoverUrl, getAvatarUrl } from '@/lib/config';
import { buildHinoUrl, buildAlbumCoverUrl, buildAvatarUrl } from '@/lib/media-helper';
```

### 2. Usar URLs de Hinos

```typescript
// Forma simples (apenas ID ou filename)
const hinoUrl = getHinoUrl('001'); // https://canticosccb.com.br/media/hinos/001.mp3
const hinoUrl2 = getHinoUrl('hino-001.mp3'); // https://canticosccb.com.br/media/hinos/hino-001.mp3

// Forma avançada (com objeto)
const hino = { id: '001', audio_url: 'custom-name.mp3' };
const hinoUrl3 = buildHinoUrl(hino); // https://canticosccb.com.br/media/hinos/custom-name.mp3
```

### 3. Usar URLs de Capas

```typescript
// Capa de álbum
const capaUrl = getAlbumCoverUrl('album-001'); // https://canticosccb.com.br/media/albuns/album-001.jpg

// Com objeto
const album = { id: '001', cover_url: 'capa-especial.jpg' };
const capaUrl2 = buildAlbumCoverUrl(album);
```

### 4. Usar URLs de Avatares

```typescript
// Avatar por ID
const avatarUrl = getAvatarUrl('user-123'); // https://canticosccb.com.br/media/avatars/user-123.jpg

// Com fallback para UI Avatars
const user = { id: '123', name: 'João Silva', avatar_url: null };
const avatarUrl2 = buildAvatarUrl(user); // Gera avatar com iniciais se não tiver imagem
```

## 📦 Exemplos Práticos

### Player de Áudio

```typescript
import { buildHinoUrl } from '@/lib/media-helper';

const AudioPlayer = ({ hino }) => {
  const audioUrl = buildHinoUrl(hino);
  
  return (
    <audio controls src={audioUrl}>
      Seu navegador não suporta o elemento de áudio.
    </audio>
  );
};
```

### Card de Hino com Capa

```typescript
import { buildHinoUrl, buildAlbumCoverUrl } from '@/lib/media-helper';

const HinoCard = ({ hino }) => {
  const audioUrl = buildHinoUrl(hino);
  const coverUrl = buildAlbumCoverUrl(hino.album);
  
  return (
    <div className="hino-card">
      <img 
        src={coverUrl} 
        alt={hino.title}
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/300x300/1db954/ffffff?text=Hino';
        }}
      />
      <h3>{hino.title}</h3>
      <button onClick={() => playAudio(audioUrl)}>
        ▶️ Tocar
      </button>
    </div>
  );
};
```

### Lista de Hinos

```typescript
import { getHinoUrl } from '@/lib/config';

const HinosList = ({ hinos }) => {
  return (
    <ul>
      {hinos.map((hino) => (
        <li key={hino.id}>
          <a href={getHinoUrl(hino.id)} target="_blank">
            {hino.title}
          </a>
        </li>
      ))}
    </ul>
  );
};
```

### Upload de Arquivo (Admin)

```typescript
const AdminUpload = () => {
  const handleUpload = async (file: File) => {
    // Criar FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload via API ou diretamente via cPanel
    // Por enquanto, use o cPanel File Manager
    console.log('Arquivo para upload:', file.name);
    console.log('Destino: /home/canticosccb/public_html/media/hinos/');
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="audio/*" 
        onChange={(e) => handleUpload(e.target.files[0])}
      />
    </div>
  );
};
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Copiar de .env.example
VITE_MEDIA_BASE_URL=https://canticosccb.com.br/media
```

### Desenvolvimento Local

Para testar com mídia local durante desenvolvimento:

```env
# .env.local (não commitar)
VITE_MEDIA_BASE_URL=http://localhost:3000/media
```

## 📁 Estrutura de Arquivos na VPS

```
/home/canticosccb/public_html/media/
├── hinos/
│   ├── 001.mp3
│   ├── 002.mp3
│   └── ...
├── albuns/
│   ├── album-001.jpg
│   ├── album-002.jpg
│   └── ...
├── avatars/
│   ├── user-123.jpg
│   ├── user-456.jpg
│   └── ...
└── covers/
    ├── cover-001.jpg
    └── ...
```

## 🎨 Naming Convention

### Hinos
```
Formato: {numero}-{nome-sanitizado}.mp3
Exemplo: 001-grande-deus.mp3
        249-o-vem-jesus.mp3
```

### Álbuns
```
Formato: album-{id}-{nome-sanitizado}.jpg
Exemplo: album-001-coletanea-2024.jpg
        album-gold-hinos-classicos.jpg
```

### Avatares
```
Formato: user-{id}.jpg ou avatar-{id}.jpg
Exemplo: user-123.jpg
        avatar-456.png
```

## 🧪 Testes

### Testar URL de Hino

```bash
# No terminal
curl -I https://canticosccb.com.br/media/hinos/teste.mp3

# Ou no navegador
https://canticosccb.com.br/media/hinos/teste.mp3
```

### Testar CORS

```javascript
fetch('https://canticosccb.com.br/media/hinos/teste.mp3')
  .then(res => console.log('CORS OK:', res.ok))
  .catch(err => console.error('CORS Error:', err));
```

## 🔒 Segurança

### Headers CORS

O nginx está configurado com:
```nginx
add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
```

### Cache

```nginx
add_header Cache-Control "public, max-age=31536000, immutable";
```

Isso significa que arquivos são cacheados por 1 ano no navegador.

## 📊 Monitoramento

### Ver Logs de Acesso

```bash
# SSH na VPS
ssh root@203.161.46.119

# Ver logs
tail -f /var/log/nginx/access.log | grep "/media/"
```

### Bandwidth Usage

Use o painel cPanel:
- **Métricas** → **Bandwidth**
- **Arquivos** → **Uso de Disco**

## 🆘 Troubleshooting

### Arquivo não encontrado (404)

```typescript
// Verificar se arquivo existe
import { checkMediaUrl } from '@/lib/media-helper';

const url = getHinoUrl('001');
const exists = await checkMediaUrl(url);

if (!exists) {
  console.error('Arquivo não encontrado:', url);
  // Usar fallback
}
```

### CORS Error

1. Verifique se o arquivo existe
2. Verifique headers nginx
3. Limpe cache do navegador

### Áudio não toca

1. Verifique Content-Type do arquivo
2. Teste URL diretamente no navegador
3. Verifique se navegador suporta formato

## 📖 Referências

- [Config.ts](./src/lib/config.ts) - Configurações centralizadas
- [Media Helper](./src/lib/media-helper.ts) - Funções utilitárias
- [VPS Setup](./VPS-SETUP.md) - Configuração da VPS

---

**Última atualização**: 18 de outubro de 2025  
**Autor**: Equipe Cânticos CCB
