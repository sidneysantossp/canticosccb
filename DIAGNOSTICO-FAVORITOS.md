# Diagnóstico - Problema de Carregamento de Favoritos

## 🚨 PROBLEMA IDENTIFICADO

A página de favoritos não está carregando os hinos favoritados devido a **problemas na configuração da tabela `favoritos` no Supabase**:

### Causas Prováveis:

1. **Tabela `favoritos` não existe no Supabase** - O código referencia esta tabela mas ela pode não ter sido criada
2. **Políticas RLS faltando ou incorretas** - A tabela precisa de políticas que permitam SELECT/INSERT para usuários autenticados
3. **Join com tabela `hinos` falhando** - A consulta usa JOIN mas a estrutura pode estar diferente
4. **Problema com `usuario_id` vs `auth_id`** - O sistema pode estar usando IDs diferentes

---

## ✅ SOLUÇÃO - EXECUTE O SCRIPT SQL

### Passo 1: Execute o Script de Correção

1. Acesse: https://rdogsfrplohxnemvtetn.supabase.co
2. Faça login com suas credenciais
3. Vá em: **SQL Editor** (ícone no menu lateral)
4. Copie e cole o conteúdo do arquivo `database/migrations/fix_favorites_supabase.sql`
5. Clique em **Run**

O script irá:
- ✅ Criar a tabela `favoritos` se não existir
- ✅ Criar/atualizar a tabela `hinos` com estrutura correta
- ✅ Configurar políticas RLS para segurança
- ✅ Criar índices para performance
- ✅ Permitir leitura pública de hinos (ativos)
- ✅ Restringir favoritos ao próprio usuário

---

## 🔧 MELHORIAS APLICADAS NO CÓDIGO

### 1. Debug Avançado no `favoritesStore.ts`
**Problema:** Sem logs detalhados para identificar o erro
**Solução:** 
- Logs completos em cada etapa
- Mensagens de erro específicas
- Mapeamento seguro de dados

### 2. Debug na Página `LikedSongsPage.tsx`
**Problema:** Sem informações sobre o estado do usuário
**Solução:**
- Logs detalhados do usuário e UID
- Verificação se usuário está logado
- Display de erro com botão de retry

### 3. Tratamento de Erros
**Problema:** Erros não eram exibidos para o usuário
**Solução:**
- Estado `error` exposto no store
- Interface amigável com mensagem de erro
- Botão para tentar novamente

---

## 🧪 VERIFICAÇÃO MANUAL

Após executar o script SQL, verifique no console do navegador:

### Logs Esperados:
```
🎵 LikedSongsPage - useEffect disparado
👤 User atual: {id: 123, email: "...", nome: "..."}
🆔 UID extraído: 123
📥 Carregando favoritos para usuário: 123
🔄 loadFavorites chamado com userId: 123
🔍 Buscando favoritos no Supabase para usuário: 123
📊 Resultado da consulta: {data: [...], error: null}
📝 Itens retornados: 5
✅ Favoritos carregados com sucesso: 5
```

### Logs de Erro Comuns:
```
❌ Erro na consulta SQL: {code: "PGRST116", hint: "...", message: "Could not find the relation 'hinos' in the schema"}
```
**Solução:** Execute o script SQL completo

```
❌ Erro na consulta SQL: {code: "42501", message: "new row violates row-level security policy"}
```
**Solução:** Verificar políticas RLS no script

---

## 📋 CHECKLIST FINAL

- [ ] Executar script `fix_favorites_supabase.sql` no Supabase
- [ ] Verificar se usuário está logado (console logs)
- [ ] Testar adicionar favoritos em outras páginas
- [ ] Verificar se favoritos aparecem na página
- [ ] Testar remover favoritos
- [ ] Verificar performance com muitos favoritos

---

## 🔄 PRÓXIMOS PASSOS

Se após executar o script ainda houver problemas:

1. **Verificar estrutura das tabelas** no Supabase
2. **Testar consulta manualmente** no SQL Editor
3. **Verificar políticas RLS** com `SELECT * FROM pg_policies`
4. **Checar se usuário tem `auth_id`** na tabela `usuarios`

O problema deve ser resolvido após a execução do script SQL e as melhorias de debug ajudarão a identificar qualquer issue restante.
