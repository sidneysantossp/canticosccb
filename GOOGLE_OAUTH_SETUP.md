# Configuração do Google OAuth no Supabase

Para que o login com Google funcione corretamente, você precisa configurar o Google OAuth Provider no Supabase Dashboard.

## Passos para Configuração

### 1. Acessar o Supabase Dashboard
1. Acesse https://app.supabase.com
2. Selecione seu projeto: **rdogsfrplohxnemvtetn**
3. No menu lateral, vá em **Authentication** → **Providers**

### 2. Configurar Google Provider
1. Encontre **Google** na lista de providers
2. Clique para expandir as configurações
3. Ative o toggle **"Enable Sign in with Google"**

### 3. Obter Credenciais do Google Cloud Console
1. Acesse https://console.cloud.google.com
2. Selecione ou crie um projeto
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: Canticos CCB
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `https://canticosccb.vercel.app`
     - `https://canticosccb.com.br`
     - `https://rdogsfrplohxnemvtetn.supabase.co`
   - **Authorized redirect URIs**:
     - `https://rdogsfrplohxnemvtetn.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback`
     - `https://canticosccb.vercel.app/auth/callback`

6. Clique em **Create** e copie:
   - **Client ID**
   - **Client Secret**

### 4. Adicionar Credenciais no Supabase
1. Volte ao Supabase Dashboard → Authentication → Providers → Google
2. Cole o **Client ID** no campo correspondente
3. Cole o **Client Secret** no campo correspondente
4. Em **Redirect URL**, use: `https://rdogsfrplohxnemvtetn.supabase.co/auth/v1/callback`
5. Clique em **Save**

### 5. Configurar URLs Permitidas no Supabase
1. No Supabase Dashboard, vá em **Authentication** → **URL Configuration**
2. Em **Redirect URLs**, adicione:
   - `http://localhost:5173/auth/callback`
   - `https://canticosccb.vercel.app/auth/callback`
   - `https://canticosccb.com.br/auth/callback`
3. Clique em **Save**

## Fluxo de Autenticação

1. Usuário clica em "Continuar com Google"
2. Supabase redireciona para o Google OAuth
3. Usuário autoriza a aplicação
4. Google redireciona para `https://rdogsfrplohxnemvtetn.supabase.co/auth/v1/callback`
5. Supabase processa e redireciona para `/auth/callback` da aplicação
6. A aplicação processa o callback e cria/busca o usuário
7. Usuário é redirecionado para `/onboarding` ou dashboard

## Testando

Após configurar, teste o login com Google em:
- Desenvolvimento: http://localhost:5173/login
- Staging (Vercel): https://canticosccb.vercel.app/login
- Produção: https://canticosccb.com.br/login

## Troubleshooting

### Erro de CORS
- Verifique se as URLs estão configuradas corretamente no Google Cloud Console
- Certifique-se de que o domínio do Supabase está nas **Authorized JavaScript origins**

### Erro 405 (Method Not Allowed)
- Verifique se o Google Provider está ativado no Supabase
- Confirme que o Client ID e Client Secret estão corretos

### Redirecionamento não funciona
- Verifique as **Redirect URLs** no Supabase Dashboard
- Confirme que a rota `/auth/callback` existe na aplicação
