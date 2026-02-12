# Templates de Email - Supabase Auth

Templates customizados para os emails de autenticação do Supabase.

## Como aplicar

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá em **Authentication → Email Templates**
3. Para cada template abaixo, copie o conteúdo HTML e cole no campo correspondente:

| Arquivo | Template no Supabase | Subject sugerido |
|---------|---------------------|------------------|
| `confirm-signup.html` | Confirm signup | Confirme seu email - Cânticos CCB |
| `reset-password.html` | Reset password | Redefinir sua senha - Cânticos CCB |
| `magic-link.html` | Magic link | Seu link de acesso - Cânticos CCB |
| `change-email.html` | Change email address | Confirmar novo email - Cânticos CCB |

## Variáveis do Supabase

Os templates usam a variável `{{ .ConfirmationURL }}` que é substituída automaticamente pelo Supabase com o link de confirmação correto.

## Configurações necessárias

No Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://canticosccb.vercel.app`
- **Redirect URLs**: `https://canticosccb.vercel.app/**`

No Vercel → **Settings → Environment Variables**:
- `VITE_APP_URL` = `https://canticosccb.vercel.app`
