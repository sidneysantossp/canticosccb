# Relatório Técnico de Análise Pré-Lançamento: Plataforma 1CanticosCCB

## 1. Análise de Consistência e Qualidade do Código

### Arquitetura e Padrões
- **Frontend Moderno:** A aplicação utiliza uma stack robusta com React 18, Vite, TypeScript e TailwindCSS. A estrutura de pastas é organizada (`src/pages`, `src/components`, `src/lib`), facilitando a manutenção.
- **Gerenciamento de Estado:** Uso consistente de Context API e Zustand para gerenciamento de estado global (Auth, Player, Notificações).

### Problemas Críticos Identificados
- **Inconsistência na Camada de Dados:** Existem duas abordagens conflitantes para comunicação com o Supabase:
  1. **Cliente Oficial (`supabase-auth.ts`):** Gerencia sessão e segurança corretamente.
  2. **Cliente REST Manual (`supabaseRest.ts`):** Implementa chamadas `fetch` manuais usando a `ANON_KEY` diretamente nos headers, **ignorando o token de sessão do usuário logado**. Isso compromete a segurança Row Level Security (RLS) do banco de dados, pois todas as requisições partem como "anônimo".
- **Tratamento de Erros:** O padrão "silencioso" em módulos como `composerStatsApi.ts` (retornar objetos vazios em caso de erro) impede que falhas de infraestrutura sejam detectadas pelo usuário ou logs de monitoramento.

## 2. Auditoria de Migração PHP → Supabase

### Status da Migração
- **Limpeza de Backend:** Arquivos `.php` residuais (`test-send-direct.php`, etc.) foram identificados e movidos para a pasta `_legacy` para evitar execução acidental.
- **Stubs Perigosos:** O arquivo `src/lib/supabase.ts` (diferente de `supabase-auth.ts`) contém mocks que lançam erros (`Supabase not configured`). Qualquer importação acidental deste arquivo quebrará a funcionalidade.
- **Conclusão:** A migração do código backend parece completa, mas a integração no frontend ainda possui "pontas soltas" (stubs e mocks).

## 3. Análise dos Dashboards

### Dashboard do Usuário (`/profile`)
- **Status:** **Funcional**.
- Utiliza APIs agregadoras (`profileDashboardApi.ts`) e reflete dados reais.
- Fluxos de upload de avatar e gestão de playlists estão implementados.

### Dashboard do Compositor (`/composer`)
- **Status:** **Parcialmente Funcional / Vulnerável**.
- Depende de `composerStatsApi.ts`, que utiliza a camada insegura `supabaseRest.ts`.
- As métricas podem não refletir a realidade devido à falta de contexto de autenticação nas chamadas RPC.

### Dashboard de Administração (`/admin`)
- **Status:** **Não Funcional (Mockado)**.
- O arquivo `src/lib/admin/adminStatsApi.ts` é inteiramente constituído de stubs que retornam dados zerados (`totalUsers: 0`, etc.).
- **Ação Necessária:** O painel administrativo é atualmente apenas uma interface visual sem conexão real com o banco de dados.

## 4. Testes e Validações

- **Cobertura de Testes:** Inexistente. Não foram encontrados testes unitários (`.test.ts`, `.spec.ts`) ou de integração configurados no projeto.
- **Testes Manuais:** Existem scripts dispersos (`test-*.html`) na raiz, o que não é uma prática sustentável para um produto em produção.

## 5. Recomendações Prioritárias

### Críticas (Bloqueantes para Lançamento)
1. **Desativar/Corrigir `supabaseRest.ts`:** Refatorar `composerStatsApi.ts` para usar o cliente oficial `supabase` (de `supabase-auth.ts`), garantindo que o token do usuário seja enviado nas requisições.
2. **Conectar Dashboard Admin:** Implementar a lógica real em `adminStatsApi.ts` ou remover o acesso ao dashboard para evitar falsa sensação de funcionamento.
3. **Remover Stubs:** Excluir `src/lib/supabase.ts` e corrigir quaisquer importações pendentes para evitar erros de runtime "Supabase not configured".

### Alta Prioridade (Melhorias)
4. **Segurança de Sessão:** Revisar a dependência excessiva de `localStorage` no `AuthContextMock`. Implementar renovação de token via listener do Supabase de forma mais estrita.
5. **Observabilidade:** Adicionar logs de erro reais (Sentry ou similar) em vez de apenas `console.error` nos blocos `catch`.

---
**Conclusão:** A plataforma possui uma base frontend excelente, mas a camada de integração de dados (especialmente Admin e Compositor) precisa de refatoração urgente para garantir segurança e veracidade dos dados antes da abertura ao público.
