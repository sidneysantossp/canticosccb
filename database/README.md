# 📁 Scripts do Banco de Dados

> ⚠️ **IMPORTANTE:** Este sistema usa **Firebase para autenticação**!  
> Senhas NÃO são armazenadas no MySQL. Leia `FIREBASE-SETUP.md` para configuração completa.

## 🚀 Configuração Rápida

### **Opção 1: Script Automático (Recomendado)**

```bash
# No Windows (CMD ou PowerShell)
cd database
setup.bat
```

### **Opção 2: Manual via phpMyAdmin**

1. Abra o **phpMyAdmin**: http://localhost/phpmyadmin
2. Selecione o banco `canticosccb_plataforma`
3. Vá em **SQL** e execute os scripts na ordem:
   - `schema.sql` (cria tabelas)
   - `seed.sql` (insere dados iniciais)

### **Opção 3: Linha de Comando MySQL**

```bash
# Criar schema
mysql -u canticosccb_plataforma -p canticosccb_plataforma < schema.sql

# Inserir dados
mysql -u canticosccb_plataforma -p canticosccb_plataforma < seed.sql
```

---

## 📄 Arquivos Disponíveis

| Arquivo | Descrição |
|---------|-----------|
| `schema.sql` | Cria todas as tabelas do banco |
| `seed.sql` | Insere dados iniciais (admin, categorias, etc) |
| `reset.sql` | Limpa todos os dados (mantém estrutura) |
| `drop.sql` | Remove todas as tabelas (⚠️ CUIDADO!) |
| `setup.bat` | Script automático para Windows |

---

## 📊 Estrutura do Banco

### **Tabelas Criadas:**

1. **usuarios** - Usuários do sistema
2. **compositores** - Compositores de hinos
3. **categorias** - Categorias de hinos
4. **albuns** - Álbuns/coletâneas
5. **hinos** - Hinos cadastrados
6. **generos** - Gêneros musicais

---

## 🔑 Credenciais Padrão

⚠️ **AUTENTICAÇÃO VIA FIREBASE:**
O usuário admin deve ser criado no **Firebase Console** primeiro!

### **Passos:**
1. Acesse: https://console.firebase.google.com
2. Vá em Authentication > Users > Add user
3. Email: `admin@canticosccb.com.br`
4. Defina uma senha forte
5. Copie o UID gerado
6. Atualize o registro no MySQL com o UID

**Ver:** `FIREBASE-SETUP.md` para instruções detalhadas

---

## 📋 Dados Iniciais

### **Categorias Criadas:**
- Louvor
- Gratidão
- Petição
- Consagração
- Natal
- Páscoa
- Ceia
- Batismo

### **Gêneros Criados:**
- Hino
- Coral
- Solo
- Instrumental
- Infantil

---

## 🛠️ Comandos Úteis

### **Verificar se banco existe:**
```sql
SHOW DATABASES LIKE 'canticosccb_plataforma';
```

### **Ver todas as tabelas:**
```sql
USE canticosccb_plataforma;
SHOW TABLES;
```

### **Contar registros:**
```sql
SELECT 
  (SELECT COUNT(*) FROM usuarios) AS usuarios,
  (SELECT COUNT(*) FROM compositores) AS compositores,
  (SELECT COUNT(*) FROM categorias) AS categorias,
  (SELECT COUNT(*) FROM hinos) AS hinos;
```

### **Resetar banco (limpar dados):**
```bash
mysql -u canticosccb_plataforma -p canticosccb_plataforma < reset.sql
```

### **Remover todas as tabelas:**
```bash
mysql -u canticosccb_plataforma -p canticosccb_plataforma < drop.sql
```

---

## 🔧 Solução de Problemas

### **Erro: "Access denied"**
- Verifique se o MySQL está rodando no XAMPP
- Confirme usuário e senha no `/api/config.php`

### **Erro: "Unknown database"**
- Crie o banco manualmente no phpMyAdmin:
```sql
CREATE DATABASE canticosccb_plataforma 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### **Erro: "Table already exists"**
- Execute `drop.sql` antes de `schema.sql`
- Ou use `DROP TABLE IF EXISTS` no phpMyAdmin

### **Script .bat não funciona**
- Verifique o caminho do MySQL no arquivo
- Padrão: `C:\xampp\mysql\bin\mysql.exe`
- Execute como Administrador se necessário

---

## ⚠️ Avisos Importantes

1. **Backup antes de reset:**
   - Sempre faça backup antes de executar `reset.sql` ou `drop.sql`
   - Estes scripts **APAGAM DADOS PERMANENTEMENTE**

2. **Senha do Admin:**
   - A senha padrão é `admin123`
   - **ALTERE IMEDIATAMENTE** após primeiro login

3. **Produção:**
   - NÃO use estas credenciais em produção
   - Configure senhas fortes
   - Desabilite o usuário admin padrão

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique se MySQL está rodando
2. Confirme as credenciais
3. Veja os logs de erro do MySQL
4. Execute os comandos manualmente para identificar o erro

---

**Última Atualização:** 2025-01-18
