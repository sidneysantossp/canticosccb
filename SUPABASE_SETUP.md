# 🚀 Guia de Setup - Supabase Backend

Este guia mostra como configurar o backend Supabase para o projeto Cânticos CCB.

---

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Node.js 18+ instalado
- Git instalado

---

## 🔧 Passo 1: Criar Projeto no Supabase

1. **Acesse:** https://supabase.com
2. **Clique em:** "New Project"
3. **Preencha:**
   - **Nome:** canticos-ccb
   - **Database Password:** (gere uma senha forte)
   - **Region:** South America (São Paulo)
   - **Pricing Plan:** Free (para começar)
4. **Aguarde:** ~2 minutos para o projeto ser criado

---

## 🗄️ Passo 2: Configurar Database Schema

### Opção 1: Via SQL Editor (Recomendado)

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo de `supabase/schema.sql`
4. Cole no editor
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a mensagem de sucesso

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Conectar ao projeto
supabase link --project-ref your-project-ref

# Executar migrations
supabase db push
```

**Verificação:** Vá em **Table Editor** e confirme que as tabelas foram criadas:
- ✅ profiles
- ✅ artists
- ✅ albums
- ✅ songs
- ✅ playlists
- ✅ playlist_songs
- ✅ liked_songs
- ✅ following_artists
- ✅ play_history
- ✅ queue
- ✅ user_preferences
- ✅ subscriptions

---

## 🌱 Passo 3: Popular com Dados Iniciais (Seed)

1. Vá em **SQL Editor**
2. **New Query**
3. Copie o conteúdo de `supabase/seed.sql`
4. Cole e execute
5. Aguarde conclusão

**Verificação:**
```sql
-- Verificar artistas
SELECT * FROM public.artists;

-- Verificar músicas
SELECT COUNT(*) FROM public.songs;

-- Deve retornar 10 músicas
```

---

## 🔐 Passo 4: Configurar Autenticação

1. Vá em **Authentication** > **Providers**
2. **Habilite:**
   - ✅ Email (já vem habilitado)
   - ✅ Google (opcional)
   - ✅ Facebook (opcional)

### Configurar Email Templates

1. Vá em **Authentication** > **Email Templates**
2. Personalize os templates:
   - Confirmação de email
   - Recuperação de senha
   - Mudança de email

### Configurar Redirect URLs

1. Vá em **Authentication** > **URL Configuration**
2. Adicione:
   - `http://localhost:5173/**` (desenvolvimento)
   - `https://seu-dominio.com/**` (produção)

---

## 📦 Passo 5: Configurar Storage

1. Vá em **Storage** > **Create Bucket**
2. Crie 3 buckets:

### Bucket: avatars
- **Name:** avatars
- **Public:** ✅ Yes
- **File Size Limit:** 2MB
- **Allowed MIME Types:** image/*

### Bucket: covers
- **Name:** covers
- **Public:** ✅ Yes
- **File Size Limit:** 5MB
- **Allowed MIME Types:** image/*

### Bucket: audio
- **Name:** audio
- **Public:** ✅ Yes
- **File Size Limit:** 50MB
- **Allowed MIME Types:** audio/*

**Verificação:** Você deve ter 3 buckets criados e públicos.

---

## 🔑 Passo 6: Obter Credenciais

1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGc...`

---

## ⚙️ Passo 7: Configurar Variáveis de Ambiente

1. No projeto, copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e preencha:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

**⚠️ IMPORTANTE:** Nunca commit o arquivo `.env` no Git!

---

## 📦 Passo 8: Instalar Dependências

```bash
npm install @supabase/supabase-js
```

Ou se preferir yarn:

```bash
yarn add @supabase/supabase-js
```

---

## 🧪 Passo 9: Testar Conexão

Crie um arquivo de teste `test-supabase.ts`:

```typescript
import { supabase } from './src/lib/supabase';

async function testConnection() {
  try {
    // Testar conexão
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .limit(5);

    if (error) throw error;

    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Total de músicas encontradas:', songs.length);
    console.log('🎵 Primeira música:', songs[0]?.title);
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  }
}

testConnection();
```

Execute:
```bash
npx tsx test-supabase.ts
```

---

## 🔄 Passo 10: Habilitar Realtime (Opcional)

Para funcionalidades em tempo real:

1. Vá em **Database** > **Replication**
2. Habilite replicação para as tabelas:
   - ✅ queue
   - ✅ play_history
   - ✅ liked_songs

---

## 🛡️ Passo 11: Configurar Row Level Security (RLS)

As policies já foram criadas no schema.sql. Verificar:

1. Vá em **Authentication** > **Policies**
2. Verifique se as policies estão ativas para cada tabela
3. Teste com um usuário de teste

---

## 📊 Passo 12: Monitoramento

### Configurar Logs

1. Vá em **Logs** > **Explorer**
2. Configure alertas para:
   - Erros de autenticação
   - Queries lentas
   - Uso de storage

### Configurar Backups

1. Vá em **Database** > **Backups**
2. **Free tier:** Backups diários por 7 dias (automático)
3. **Pro tier:** Backups por 30 dias + point-in-time recovery

---

## 🚀 Comandos Úteis

```bash
# Instalar dependências
npm install @supabase/supabase-js

# Executar projeto
npm run dev

# Build para produção
npm run build

# Executar testes
npm run test
```

---

## 🔍 Verificação Final

Execute este checklist:

- [ ] Projeto Supabase criado
- [ ] Schema aplicado (13 tabelas)
- [ ] Dados seed inseridos (3 artistas, 5 álbuns, 10 músicas)
- [ ] Autenticação configurada
- [ ] 3 buckets de storage criados
- [ ] Credenciais copiadas para .env
- [ ] Dependências instaladas
- [ ] Teste de conexão passou
- [ ] RLS policies ativas
- [ ] Realtime habilitado (opcional)

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se copiou a **anon key** correta
- Certifique-se que o arquivo `.env` está na raiz do projeto

### Erro: "relation does not exist"
- Execute novamente o `schema.sql`
- Verifique se todas as tabelas foram criadas

### Erro: "Row Level Security"
- Verifique se as policies foram criadas
- Teste com um usuário autenticado

### Queries lentas
- Verifique se os indexes foram criados
- Use o Query Performance no painel do Supabase

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎯 Próximos Passos

Após completar este setup:

1. ✅ Backend configurado
2. ➡️ Integrar frontend com Supabase
3. ➡️ Substituir dados mockados
4. ➡️ Testar autenticação real
5. ➡️ Deploy no Vercel

---

**Desenvolvido com ❤️ para Cânticos CCB**
