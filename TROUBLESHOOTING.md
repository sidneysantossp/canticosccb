# Troubleshooting - Problemas Comuns

## Erro 405 em URLs .php (google-login.php, etc)

### Causa
Este erro ocorre quando o navegador ou o Vercel está usando cache de uma versão antiga da aplicação que ainda usava PHP.

### Solução

#### 1. Limpar Cache do Navegador
**Chrome/Edge:**
1. Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecione "Todo o período"
3. Marque:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
4. Clique em "Limpar dados"

**Ou use modo anônimo:**
- `Ctrl + Shift + N` (Windows) ou `Cmd + Shift + N` (Mac)

#### 2. Limpar Cache do Vercel
Se o erro persistir no Vercel:

1. Acesse https://vercel.com/sidneysantossp/canticosccb
2. Vá em **Settings** → **General**
3. Role até **Build & Development Settings**
4. Clique em **Clear Build Cache**
5. Faça um novo deploy:
   - Vá em **Deployments**
   - Clique nos 3 pontos do último deploy
   - Clique em **Redeploy**

#### 3. Forçar Atualização no Navegador
- `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)

#### 4. Verificar Service Worker
Abra o DevTools (F12) e vá em:
1. **Application** → **Service Workers**
2. Clique em **Unregister** se houver algum service worker registrado
3. Recarregue a página

## Erro de CORS no Google OAuth

### Causa
URLs não configuradas corretamente no Google Cloud Console ou Supabase.

### Solução
Veja o arquivo `GOOGLE_OAUTH_SETUP.md` para configuração completa.

## Login com Google não funciona

### Verificar:
1. ✅ Google Provider está ativado no Supabase Dashboard
2. ✅ Client ID e Client Secret estão corretos
3. ✅ Redirect URLs estão configuradas no Supabase
4. ✅ Authorized redirect URIs estão no Google Cloud Console
5. ✅ Cache do navegador foi limpo

## Página preta após login

### Causa
Erro de JavaScript ou componente não carregado.

### Solução
1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Procure por erros em vermelho
4. Compartilhe o erro para análise

## Build falha no Vercel

### Verificar:
1. ✅ Todas as dependências estão no `package.json`
2. ✅ Não há erros de TypeScript
3. ✅ Variáveis de ambiente estão configuradas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Comandos úteis:
```bash
# Testar build localmente
npm run build

# Verificar erros de TypeScript
npm run type-check
```

## Slides piscando

### Solução aplicada:
- Substituído framer-motion por CSS transitions
- Usado `useMemo` para evitar re-renders
- Commit: `fb458f3`

## Dados não carregam do Supabase

### Verificar:
1. ✅ Variáveis de ambiente estão corretas
2. ✅ Tabelas existem no Supabase
3. ✅ RLS (Row Level Security) está configurado corretamente
4. ✅ Anon key tem permissões necessárias

### Debug:
Abra o DevTools (F12) → **Network** e procure por requisições para `supabase.co`
