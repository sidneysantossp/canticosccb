# Migração Supabase Storage → Cloudflare R2

Script para copiar todas as imagens do Supabase Storage para o bucket Cloudflare R2 `canticos-media`.

## Pré-requisitos

- Node.js 18+
- Credenciais do Supabase (service_role key)
- Credenciais do Cloudflare R2 (API token)

## Como obter as credenciais R2

1. Acesse https://dash.cloudflare.com → **R2 Object Storage** → **Manage R2 API Tokens**
2. Clique **Create API Token**
3. Permissões: **Object Read & Write**
4. Selecione o bucket `canticos-media`
5. Copie: **Access Key ID** e **Secret Access Key**
6. O **Account ID** aparece na URL do painel: `https://dash.cloudflare.com/<ACCOUNT_ID>/r2/...`

## Setup

```bash
cd scripts/migrate-to-r2
npm install
cp .env.example .env
# Edite o .env com suas credenciais
```

## Uso

### 0. Auditoria completa da plataforma

Antes de migrar, rode a auditoria completa para medir:
- buckets e objetos existentes no storage antigo
- pastas internas do bucket `images`
- tabelas do banco novo que ainda apontam para URLs do projeto legado

```bash
npm run audit
```

Variáveis esperadas no `.env` para a auditoria:

```bash
OLD_DB_URL=postgresql://...
NEW_DB_URL=postgresql://...
MEDIA_BASE_URL=https://media.canticosccb.com.br
```

### 1. Dry-run (apenas listar arquivos, sem migrar)

```bash
npm run dry-run
```

### 2. Migração real

```bash
npm run migrate
```

> Arquivos que já existem no R2 são pulados automaticamente.
> Use `node migrate.js --force` para reenviar tudo.

### 3. Atualizar URLs no banco de dados

Depois que a migração terminar, atualize as URLs no banco:

```bash
# Dry-run primeiro (ver o que vai mudar)
node update-urls.js --dry-run

# Atualizar de verdade
npm run update-urls
```

Isso troca URLs como:
```
https://rdogsfrplohxnemvtetn.supabase.co/storage/v1/object/public/images/covers/abc.png
→ https://media.canticosccb.com.br/covers/abc.png
```

Agora o script cobre também URLs legadas em buckets como:
- `banners`
- `avatars`
- `user-avatars`
- `composer-avatars`
- `logos`
- `documents`
- `songs`
- `media`

## Estrutura de pastas no R2

```
canticos-media/
├── covers/     ← capas de álbuns e hinos
├── hinos/      ← arquivos de áudio
├── avatars/    ← fotos de perfil
└── banners/    ← imagens de banners
```

## Observação importante

O script original de migração cobria só uma parte do storage legado. A plataforma real também usou buckets e caminhos como:

- `images/albums`
- `images/documents`
- `images/collections`
- `images/categories`
- buckets separados `avatars`, `banners`, `logos`, `songs`, `media`, `user-avatars`, `composer-avatars`

Por isso a restauração total precisa ser tratada como inventário completo + backfill completo, não só como cópia de `covers` e `hinos`.
