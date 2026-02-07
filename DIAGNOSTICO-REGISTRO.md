, isso me g# Diagnóstico - Problema de Registro de Usuário

## 🚨 PROBLEMA IDENTIFICADO

O problema de registro está relacionado à **falta de configuração correta da tabela `usuarios` no Supabase**:

1. **Tabela `usuarios` sem coluna `auth_id`** - O Supabase Auth cria usuários na tabela `auth.users`, mas o sistema precisa vincular com a tabela `usuarios` usando a coluna `auth_id` (UUID).

2. **Políticas RLS faltando ou incorretas** - A tabela precisa de políticas que permitam INSERT durante o registro.

3. **Confirmação de email** - Se estiver ativada no Supabase, o usuário não consegue fazer login após o registro.

---

## ✅ SOLUÇÃO - EXECUTE O SCRIPT SQL

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://rdogsfrplohxnemvtetn.supabase.co
2. Faça login com suas credenciais
3. Vá em: **SQL Editor** (ícone no menu lateral)

### Passo 2: Execute o Script de Correção

Copie e cole o conteúdo do arquivo `database/migrations/fix_usuarios_supabase.sql` no SQL Editor e clique em **Run**.

O script irá:
- Criar a tabela `usuarios` se não existir (com estrutura correta)
- Adicionar a coluna `auth_id` se não existir
- Adicionar a coluna `plano` se não existir
- Configurar políticas RLS para permitir registro
- Criar índices para performance

### Passo 3: Desative Confirmação de Email (Opcional)

1. No Supabase, vá em: **Authentication → Providers → Email**
2. Desmarque **"Confirm email"**
3. Clique em **Save**

---

## 🔧 CORREÇÕES JÁ APLICADAS NO CÓDIGO

### 1. Função `checkEmailExists` (auth-client.ts)
**Problema:** Usava `.single()` que lança erro quando não encontra resultados
**Solução:** Alterado para `.maybeSingle()` que retorna `null` sem erro

### 2. Função `register` (supabase-auth.ts)
**Melhorias aplicadas:**
- ✅ Adicionados logs detalhados para debug
- ✅ Mensagens de erro mais específicas
- ✅ Tratamento de erro de email duplicado (código 23505)
- ✅ Salvamento automático no localStorage após registro

---

## 🔍 POSSÍVEIS CAUSAS DO PROBLEMA

### 1. **Confirmação de Email Obrigatória no Supabase**
O Supabase pode estar configurado para exigir confirmação de email antes de permitir login.

**Como verificar:**
1. Acesse: https://rdogsfrplohxnemvtetn.supabase.co
2. Vá em: Authentication → Settings → Email Auth
3. Verifique se "Enable email confirmations" está **DESATIVADO**

**Se estiver ativado:**
- O usuário precisa confirmar o email antes de fazer login
- Isso pode estar bloqueando o registro

**Solução recomendada:**
- Desative a confirmação de email para desenvolvimento
- Ou implemente fluxo de confirmação de email

### 2. **Políticas RLS (Row Level Security)**
As políticas de segurança do Supabase podem estar bloqueando a inserção na tabela `usuarios`.

**Como verificar:**
1. Acesse o Supabase Dashboard
2. Vá em: Database → Tables → usuarios
3. Clique em "Policies"
4. Verifique se existe uma política que permite INSERT para usuários anônimos

**Política necessária:**
```sql
-- Permitir INSERT na tabela usuarios para usuários autenticados
CREATE POLICY "Permitir registro de novos usuários"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_id);

-- OU para permitir durante registro (usuário ainda não autenticado)
CREATE POLICY "Permitir registro público"
ON usuarios FOR INSERT
TO anon
WITH CHECK (true);
```

### 3. **Estrutura da Tabela `usuarios`**
Verificar se a tabela tem todas as colunas necessárias.

**Colunas esperadas:**
- `id` (serial, primary key)
- `auth_id` (uuid, unique, references auth.users)
- `nome` (text)
- `email` (text, unique)
- `tipo` (text, default 'usuario')
- `ativo` (integer, default 1)
- `plano` (text, default 'free')
- `avatar_url` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## 🧪 COMO TESTAR

### Passo 1: Abrir Console do Navegador
1. Pressione `F12` para abrir DevTools
2. Vá na aba "Console"
3. Deixe aberto para ver os logs

### Passo 2: Tentar Registrar
1. Acesse: http://localhost:5173/register (ou porta do seu Vite)
2. Preencha o formulário:
   - Nome: Teste Usuario
   - Email: teste@example.com
   - Senha: senha123
   - Confirmar senha: senha123
   - ✓ Aceitar termos
3. Clique em "Criar conta"

### Passo 3: Analisar Logs
Procure por estas mensagens no console:

**✅ Sucesso esperado:**
```
🔵 Iniciando registro para: teste@example.com
✅ Usuário criado no Supabase Auth: [uuid]
✅ Perfil de usuário criado: [id]
```

**❌ Erros possíveis:**

**Erro 1: Email já cadastrado**
```
❌ Supabase Auth signup error: User already registered
```
**Solução:** Use outro email ou delete o usuário do banco

**Erro 2: Erro ao criar perfil**
```
❌ User insert error: [detalhes]
⚠️ Usuário criado no Auth mas falhou ao criar perfil
```
**Solução:** Verificar políticas RLS e estrutura da tabela

**Erro 3: Confirmação de email necessária**
```
✅ Usuário criado no Supabase Auth: [uuid]
(mas não redireciona para /onboarding)
```
**Solução:** Desativar confirmação de email no Supabase

---

## 🛠️ COMANDOS ÚTEIS

### Verificar usuários no Supabase (via SQL Editor)
```sql
-- Ver todos os usuários na tabela usuarios
SELECT id, nome, email, tipo, ativo, auth_id, created_at 
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver usuários no Auth
SELECT id, email, confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Deletar usuário de teste (se necessário)
DELETE FROM usuarios WHERE email = 'teste@example.com';
-- Nota: Não é possível deletar de auth.users via SQL client
```

### Limpar localStorage (Console do navegador)
```javascript
localStorage.clear();
location.reload();
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Supabase URL e ANON_KEY corretos no .env
- [ ] Confirmação de email DESATIVADA no Supabase
- [ ] Política RLS permite INSERT na tabela usuarios
- [ ] Tabela usuarios tem estrutura correta
- [ ] Console do navegador aberto para ver logs
- [ ] Email de teste único (não usado antes)
- [ ] Senha com pelo menos 6 caracteres
- [ ] Termos de uso aceitos

---

## 📞 PRÓXIMOS PASSOS

1. **Verifique a configuração do Supabase** (confirmação de email)
2. **Teste o registro** seguindo os passos acima
3. **Compartilhe os logs** do console se o erro persistir
4. **Verifique as políticas RLS** se houver erro ao criar perfil

---

## 🔗 Links Úteis

- Supabase Dashboard: https://rdogsfrplohxnemvtetn.supabase.co
- Documentação Supabase Auth: https://supabase.com/docs/guides/auth
- Documentação RLS: https://supabase.com/docs/guides/auth/row-level-security
