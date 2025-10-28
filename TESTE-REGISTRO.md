# Teste do Sistema de Registro

## ✅ CORREÇÕES APLICADAS:

1. **auth-client.ts** - Agora usa proxy do Vite (`/api`)
2. **register.php** - Backend funcionando corretamente
3. **.htaccess** - CORS configurado

---

## 🔧 PASSOS PARA TESTAR:

### 1. **Reiniciar o Servidor Vite**

⚠️ **IMPORTANTE:** O proxy só funciona após reiniciar!

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 2. **Verificar se o XAMPP está rodando**

- Apache deve estar **ativo**
- MySQL deve estar **ativo**

### 3. **Testar o registro**

Acesse: `http://localhost:5176/register`

**Dados de teste:**
- Nome: Sidney Santos
- Email: sid.websp@gmail.com  
- Senha: KmSal472$8!
- Confirmar senha: KmSal472$8!
- ✓ Aceitar termos

### 4. **Verificar Console do Navegador**

Abra DevTools (F12) e verifique:

✅ **Sucesso:** Deve redirecionar para `/onboarding`

❌ **Erro:** Anote a mensagem no console

---

## 🐛 DIAGNÓSTICO DE ERROS:

### Erro: "Failed to fetch"
**Causa:** Proxy não carregou ou XAMPP não está rodando
**Solução:** Reinicie o Vite e verifique XAMPP

### Erro: "Este email já está cadastrado"
**Causa:** Email já existe no banco
**Solução:** Use outro email ou delete do banco

### Erro: "CORS blocked"
**Causa:** Vite não reiniciado após mudanças
**Solução:** Pare e inicie o servidor novamente

### Erro: "500 Internal Server Error"
**Causa:** Banco de dados não conecta
**Solução:** 
1. Verifique se MySQL está rodando
2. Verifique credenciais em `/api/config.php`
3. Verifique se o banco `canticosccb_plataforma` existe

---

## 📋 CHECKLIST:

- [ ] XAMPP rodando (Apache + MySQL)
- [ ] Vite reiniciado após mudanças
- [ ] Acessar http://localhost:5176/register
- [ ] Preencher formulário completo
- [ ] Aceitar termos
- [ ] Clicar em "Criar conta"
- [ ] Verificar se redireciona para `/onboarding`

---

## 🎯 SE CONTINUAR COM ERRO:

Execute este teste manual da API:

```bash
# No PowerShell, execute:
Invoke-WebRequest -Uri "http://localhost/1canticosccb/api/auth/register.php" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nome":"Teste","email":"teste@email.com","senha":"123456"}'
```

**Resposta esperada:** JSON com `success: true`

Se der erro aqui, o problema é no backend (PHP/MySQL).
Se funcionar, o problema é no proxy do Vite.

---

## ✅ PRÓXIMOS TESTES:

Após o registro funcionar, teste:

1. **Login** - http://localhost:5176/login
2. **Cadastro de Compositor** - http://localhost:5176/composer/onboarding
3. **Sistema de Gerenciamento**:
   - Cadastrar compositor COM gerente
   - Verificar convite no banco
   - Login como gerente
   - Usar modal "Gerenciar Compositores"
   - Ver tarja amarela
