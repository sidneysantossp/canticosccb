# Plano Emergencial — RLS, Proteção de Compositores e Moderação de Hinos

**Base factual:** auditoria com a instância Supabase real em 13 de agosto de 2026.
**Escopo imediato:** conter a exposição de dados privados, estabilizar o modelo de acesso e implantar uma operação de moderação capaz de zerar o backlog apurado de **773 hinos pendentes** sem publicar conteúdo de forma indevida.

> **Regra de execução.** Não aplique políticas em produção diretamente pelo navegador nem faça “correções rápidas” no cliente. Toda alteração deve ser uma migração SQL versionada, revisada em homologação, aplicada por uma conta administrativa no banco e acompanhada de teste com os papéis `anon`, usuário, compositor, revisor e administrador.

## 1. Resumo executivo: o que fazer primeiro

A primeira ação não é melhorar a interface de moderação. É eliminar o acesso anônimo às tabelas privadas e ao bucket de documentos. A auditoria confirmou que `users`, `composer_documents`, `notifications` e `playlists` podem ser enumeradas sem sessão. A causa está explicitamente presente nas migrações: políticas `USING (true)` e `WITH CHECK (true)` em dados de compositores, documentos e notificações, além de bucket de documentos definido como público.

A segunda ação é separar dados públicos de dados privados. A tabela principal de usuários contém e-mail, telefone, localização, plano e indicadores de papel; ela não deve ser a fonte de uma busca pública. Perfis de compositores aprovados devem sair por uma view pública mínima, enquanto a tabela operacional de compositor, os documentos e as notificações ficam restritos ao proprietário e à equipe de revisão.

A terceira ação é transformar os 773 itens pendentes em uma fila operacional. Não é seguro publicar em massa. O número do dashboard combina estados diferentes e a tela atual de pendências consulta apenas `pending`; antes de iniciar a força-tarefa, é obrigatório reconciliar quais IDs pertencem a `draft`, `pending` e outros estados, removendo duplicatas e classificando itens sem áudio, direitos ou metadados.

| Ordem | Decisão emergencial | Por quê | Resultado em 24–48 h |
|---|---|---|---|
| **1** | Revogar acesso `anon` a usuários, documentos, notificações e playlists. | Contém exposição atual sem coletar mais dados. | Consultas anônimas retornam `403` ou zero linha em tabelas privadas. |
| **2** | Tornar o bucket `documents` privado e retirar políticas `storage.objects` abertas. | Arquivos de identificação não podem ser objetos públicos. | URLs públicas deixam de funcionar; acesso exige rota autorizada/URL assinada. |
| **3** | Recriar RLS por proprietário, revisor e administrador. | Evita que o bloqueio emergencial quebre jornadas autenticadas de modo permanente. | Cada papel enxerga e altera somente seus dados permitidos. |
| **4** | Congelar publicação automática e conciliar o estoque de 773 IDs. | Evita aumentar o backlog e evita publicar material incompleto. | Uma fila única, sem duplicidade, com estado e motivo de pendência. |
| **5** | Operar triagem e revisão em lotes. | O problema é operacional, não só visual. | Meta diária, responsabilidade e SLA para redução sustentável. |

## 2. Contenção imediata de RLS

A documentação do Supabase recomenda habilitar RLS em tabelas expostas e criar políticas explícitas para os papéis `anon` e `authenticated`. Quando não há política compatível, a API com chave pública não deve retornar registros; isso é exatamente o comportamento desejado para dados privados. [1]

### 2.1. Hotfix de contenção — aplicar primeiro em homologação

O bloco abaixo é uma **contenção inicial**. Ele revoga privilégios de leitura/escrita do papel anônimo e remove privilégios genéricos concedidos a `PUBLIC` nas tabelas privadas. Não deve ser tratado como a política final, porque a aplicação autenticada ainda precisa das regras detalhadas da seção seguinte.

```sql
begin;

-- Contenção de tabelas privadas: bloqueia o uso com chave pública sem sessão.
revoke all on table public.users from anon, public;
revoke all on table public.composer_documents from anon, public;
revoke all on table public.notifications from anon, public;
revoke all on table public.playlists from anon, public;
revoke all on table public.composers from anon, public;

-- RLS deve continuar habilitado; FORCE é útil para impedir que o proprietário
-- da tabela ignore acidentalmente políticas no fluxo de aplicação.
alter table public.users enable row level security;
alter table public.users force row level security;
alter table public.composers enable row level security;
alter table public.composers force row level security;
alter table public.composer_documents enable row level security;
alter table public.composer_documents force row level security;
alter table public.notifications enable row level security;
alter table public.notifications force row level security;
alter table public.playlists enable row level security;
alter table public.playlists force row level security;

commit;
```

Esse hotfix deve ser acompanhado de uma validação imediata com uma chave anônima: `users`, `composer_documents`, `notifications` e playlists privadas não podem retornar nenhuma linha. Em seguida, teste login, perfil, favoritos, notificações e painel de compositor com contas de teste. Se uma função do aplicativo parar após o bloqueio, corrija a regra específica; **não reabra a tabela com `USING (true)`**.

### 2.2. Correção estrutural de `public.users`

A tabela `users` contém campos privados e sensíveis ao privilégio: `email`, `phone`, `birthdate`, `location`, `plan`, `status`, `is_admin`, `is_composer` e `is_blocked`. A migração atual permite leitura pública de todo usuário ativo e bloqueia apenas por `status` e `is_blocked`. Isso expõe muito mais do que um perfil público deveria conter.

O ponto mais importante é que RLS de linha não limita colunas. Uma política que permita ao usuário atualizar a própria linha pode permitir que ele envie `is_admin = true`, `plan = 'premium'` ou `is_composer = true` caso não existam privilégios de coluna, trigger ou RPC que bloqueiem os campos. Portanto, papéis e estado de conta não podem ser controlados por um `upsert` direto do navegador.

| Objetivo | Política ou controle correto |
|---|---|
| Ler a própria conta | `authenticated` lê somente quando `id = auth.uid()`. |
| Criar perfil após cadastro | Trigger em `auth.users` ou função de backend; o cliente não define papel, plano, status ou flags. |
| Alterar perfil pessoal | Permitir somente colunas neutras, como nome, avatar e preferências; usar privilégios de coluna ou RPC validado. |
| Mudar papel, plano, bloqueio ou status | Apenas função administrativa server-side, com auditoria. |
| Exibir perfil público | View separada, com colunas mínimas e sem e-mail, telefone, localização, flags ou papéis. |

> **Não use e-mail configurado no frontend como autorização.** A decisão de admin/compositor deve ser tomada no banco por papel confiável ou por `app_metadata`, nunca por `localStorage`, e-mail recebido do cliente ou `user_metadata` mutável. [1]

Um padrão seguro para a função administrativa é mantê-la em schema não exposto e declarar `search_path` fixo. O exemplo abaixo é um modelo; ele deve ser revisado pelo responsável pelo banco antes de usar em produção.

```sql
-- Executar como administrador do banco; não disponibilizar a função na API pública.
create schema if not exists private;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.is_admin = true
      and u.status = 'active'
      and coalesce(u.is_blocked, false) = false
  );
$$;

revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;
```

Depois, a tabela deve receber políticas explícitas. Para operações de perfil, aplique também privilégios de coluna ou uma RPC de atualização de perfil; o SQL abaixo mostra a regra de linha, não substitui a proteção dos campos sensíveis.

```sql
-- Antes de remover políticas, registre uma cópia de pg_policies em um ticket ou arquivo de mudança.
-- Remover, no mínimo, a política permissiva atual “Public can read active users”.
drop policy if exists "Public can read active users" on public.users;
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

create policy "users_select_self_or_admin"
on public.users for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.is_platform_admin())
);

-- Preferível: criar o perfil por trigger após signup e não conceder INSERT ao cliente.
create policy "users_insert_self"
on public.users for insert
to authenticated
with check (id = (select auth.uid()));

create policy "users_update_self_or_admin"
on public.users for update
to authenticated
using (
  id = (select auth.uid()) or (select private.is_platform_admin())
)
with check (
  id = (select auth.uid()) or (select private.is_platform_admin())
);

-- Exemplo de privilégio de coluna: ajustar a lista ao schema final.
revoke update on public.users from authenticated;
grant update (name, avatar_url, phone, birthdate, location) on public.users to authenticated;
```

A implementação deve remover o fallback atual que realiza `upsert` de usuário no cliente após login/cadastro, ou garantir que o payload de criação nunca contenha flags de privilégio. O caminho mais confiável é uma trigger `after insert` em `auth.users` que crie o perfil com valores imutáveis definidos pelo servidor.

### 2.3. Correção de `public.composers` e perfis públicos

A migração atual de compositores contém `SELECT`, `INSERT`, `UPDATE` e `DELETE` com condição `true`. Isso permite que qualquer cliente publique, altere ou remova linhas se os grants correspondentes estiverem presentes. O acesso direto à tabela deve se tornar privado; a vitrine pública deve usar uma view de colunas mínimas.

```sql
-- Remova especificamente as políticas permissivas atuais.
drop policy if exists "Composers public read" on public.composers;
drop policy if exists "Composers insert authenticated" on public.composers;
drop policy if exists "Composers update own" on public.composers;
drop policy if exists "Composers delete" on public.composers;

create policy "composers_select_owner_or_admin"
on public.composers for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_platform_admin())
);

create policy "composers_insert_owner"
on public.composers for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "composers_update_owner_or_admin"
on public.composers for update
to authenticated
using (
  user_id = (select auth.uid()) or (select private.is_platform_admin())
)
with check (
  user_id = (select auth.uid()) or (select private.is_platform_admin())
);

create policy "composers_delete_admin_only"
on public.composers for delete
to authenticated
using ((select private.is_platform_admin()));
```

Para a página pública de compositores, não libere `SELECT` na tabela base. Crie uma view que exponha somente nome artístico, biografia pública, avatar, categoria e indicadores agregados de perfis aprovados. O filtro de aprovação deve usar a coluna real da sua instância, como `status = 'approved'` e/ou `verified = true`.

```sql
create or replace view public.composer_public_profiles
with (security_barrier = true)
as
select
  id,
  artistic_name,
  avatar_url,
  bio,
  category,
  followers_count,
  slug
from public.composers
where status = 'approved'
  and verified = true;

revoke all on public.composers from anon;
grant select on public.composer_public_profiles to anon, authenticated;
```

Como views criadas com privilégios elevados podem ignorar RLS das tabelas subjacentes, revise o owner, as colunas e o filtro de cada view exposta. No PostgreSQL 15+, `security_invoker = true` pode fazer a view respeitar a RLS da consulta chamadora; em outros casos, mova a view para schema não exposto ou trate-a como uma interface pública cuidadosamente limitada. [1]

### 2.4. Correção imediata de `composer_documents` e do bucket `documents`

Esta é a correção mais sensível. A tabela atual guarda `document_number`, `document_image`, `image_path`, nome esperado, nome extraído, observações administrativas e dados de revisão. Além disso, a migração cria o bucket `documents` como público e libera todo `storage.objects` desse bucket. Essa combinação é incompatível com documentos de identificação.

**Ação de contenção de storage:** tornar o bucket privado, remover as quatro políticas abertas e interromper qualquer URL pública existente. Quando houver necessidade de leitura, um endpoint autenticado deve gerar URL assinada de curta duração apenas após validar proprietário ou revisor autorizado.

```sql
begin;

update storage.buckets
set public = false
where id = 'documents';

-- Remover as políticas abertas criadas pela migração atual.
drop policy if exists "documents_public_read" on storage.objects;
drop policy if exists "documents_auth_upload" on storage.objects;
drop policy if exists "documents_auth_update" on storage.objects;
drop policy if exists "documents_auth_delete" on storage.objects;

commit;
```

O modelo correto deve usar caminho de objeto no formato `composer/<composer_id>/<arquivo>` e uma função privada que confirme se o `composer_id` pertence a `auth.uid()` ou se o chamador é revisor/admin. A solução mais segura no curto prazo é não conceder leitura direta para usuários finais e gerar URLs assinadas por uma função server-side após a checagem de autorização. Nunca persista imagem de identidade em Base64 em `document_image`; migre o arquivo para bucket privado e guarde apenas a referência de objeto.

Para a tabela, o proprietário pode enviar uma solicitação pendente, mas não deve poder decidir o próprio `status`, preencher `reviewed_by`, definir `reviewed_at` ou alterar `admin_notes`. O revisor/admin decide esses campos por função transacional e deixa trilha de auditoria.

```sql
-- Remover políticas permissivas existentes.
drop policy if exists "composer_documents_select" on public.composer_documents;
drop policy if exists "composer_documents_insert" on public.composer_documents;
drop policy if exists "composer_documents_update" on public.composer_documents;
drop policy if exists "composer_documents_delete" on public.composer_documents;

create policy "composer_documents_select_owner_or_admin"
on public.composer_documents for select
to authenticated
using (
  exists (
    select 1 from public.composers c
    where c.id = composer_documents.composer_id
      and c.user_id = (select auth.uid())
  )
  or (select private.is_platform_admin())
);

create policy "composer_documents_insert_owner_pending"
on public.composer_documents for insert
to authenticated
with check (
  exists (
    select 1 from public.composers c
    where c.id = composer_documents.composer_id
      and c.user_id = (select auth.uid())
  )
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

-- Recomenda-se não conceder UPDATE direto ao compositor.
-- A decisão de revisão deve ocorrer em função RPC administrativa que também grava audit log.
create policy "composer_documents_delete_own_pending"
on public.composer_documents for delete
to authenticated
using (
  status = 'pending'
  and exists (
    select 1 from public.composers c
    where c.id = composer_documents.composer_id
      and c.user_id = (select auth.uid())
  )
);
```

### 2.5. Correção de `notifications` e `playlists`

A migração mais recente de `notifications` remove políticas existentes e recria quatro políticas com condição `true`. Isso explica a leitura anônima confirmada. O schema observado pela aplicação usa pelo menos `composer_id` e, em alguns fluxos, `user_id`. Antes de aplicar a política final, execute a inspeção de colunas abaixo e escolha exatamente os campos existentes; não crie uma política baseada em coluna inexistente.

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('notifications', 'playlists')
order by table_name, ordinal_position;
```

O padrão desejado para notificações é: uma notificação de usuário pertence ao `user_id`; uma notificação de compositor pertence a um `composer_id` cujo `user_id` corresponde ao usuário autenticado; o administrador pode ler e escrever somente para operação de suporte/moderação; e o usuário pode apenas marcar a própria notificação como lida. Mensagens, tipo, remetente e vínculo de compositor não devem ser livremente atualizáveis pelo cliente.

```sql
-- Exemplo: adaptar se a tabela usa outros nomes de coluna.
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
drop policy if exists "notifications_delete" on public.notifications;

create policy "notifications_select_recipient_or_admin"
on public.notifications for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.composers c
    where c.id = notifications.composer_id
      and c.user_id = (select auth.uid())
  )
  or (select private.is_platform_admin())
);

-- Não conceder INSERT genérico ao cliente. Produzir notificações por função/RPC
-- de domínio (aprovação, convite, suporte) que valide o alvo e registre o ator.
```

Para playlists, a regra precisa ser guiada por uma coluna de proprietário e uma flag de visibilidade. O proprietário pode ler e alterar as próprias playlists; `anon` e outros usuários só podem ver uma view de playlists marcadas como públicas. Favoritos, histórico e playlists privadas jamais devem entrar nessa view.

## 3. Sequência de validação obrigatória após cada migração

A correção deve ser verificável, não apenas declarada. A cada etapa, execute os testes a seguir em homologação e só depois replique em produção.

| Teste | Papel | Resultado esperado |
|---|---|---|
| Consulta de `users`, `composer_documents`, `notifications`, `playlists` | `anon` | `403`, conjunto vazio ou ausência de privilégio; nunca uma lista de IDs. |
| Perfil próprio | Usuário autenticado | Vê somente a própria linha, sem conseguir mudar papel, plano, status ou bloqueio. |
| Perfil de outro usuário | Usuário autenticado | Não recebe linha. |
| Documento próprio pendente | Compositor | Vê metadado estritamente necessário; upload usa bucket privado. |
| Documento de outro compositor | Compositor | Não recebe linha nem URL de storage. |
| Revisão de documento | Revisor/admin | Só acontece via ação auditada; status e observação são consistentes. |
| Notificação própria | Usuário/compositor | Vê e marca como lida apenas a própria notificação. |
| Perfil público de compositor | `anon` | Recebe somente colunas selecionadas na view de aprovados. |
| Realtime de notificação | Usuário/compositor | Recebe somente evento filtrado que já poderia ler por RLS. |

## 4. Estrutura operacional para zerar 773 hinos pendentes

A meta é eliminar o backlog sem criar uma onda de publicações erradas. Considerando quatro semanas úteis, a operação precisa encerrar **773 itens**: 194 na primeira semana e 193 nas três semanas seguintes. Isso equivale a uma média de 38,65 itens por dia útil; com dois revisores dedicados, a meta média é 19,32 itens por revisor/dia. A contagem deve representar itens **encerrados** em qualquer saída correta — publicados, devolvidos para complemento, rejeitados com motivo ou arquivados por duplicidade —, e não somente itens publicados.

### 4.1. Antes da força-tarefa: reconciliar o número

O painel administrativo conta como pendentes tanto `draft` quanto `pending`, enquanto a tela atual de hinos pendentes consulta somente `status = 'pending'`. Essa diferença pode fazer uma parte importante dos 773 itens não aparecer na fila que os revisores usam. O primeiro relatório da força-tarefa deve gerar uma linha por `hino_id`, sem duplicidade, com status atual, data de envio, compositor, tipo de conteúdo, existência de áudio, letra, imagem, direitos e motivo de bloqueio.

| Grupo de fila | Regra de triagem | Destino padrão | Motivo |
|---|---|---|---|
| Pronto para revisão | Áudio válido, metadados mínimos, autor identificado e direitos declarados. | Revisão editorial. | Maior chance de encerramento rápido e seguro. |
| Dados incompletos | Falta áudio, letra, capa, autor, categoria ou metadado obrigatório. | `needs_info`. | Não consumir tempo de revisão final com item incompleto. |
| Direitos pendentes | Declaração, autorização ou titularidade insuficiente. | `rights_review`. | Não publicar até haver evidência. |
| Duplicidade provável | Mesmo áudio/título/autor/arquivo ou versão similar. | Revisão de duplicidade. | Consolidar sem apagar evidência. |
| Qualidade técnica | Arquivo inválido, duração zero, mídia inacessível ou metadado quebrado. | `technical_review`. | Corrigir tecnicamente antes de julgamento editorial. |
| Denunciado/sensível | Reclamação, conteúdo institucional/canônico ou possível conflito autoral. | Revisão dupla de prioridade alta. | Evitar publicação indevida e risco reputacional. |

### 4.2. Estados únicos de moderação

A plataforma deve abandonar o uso de `draft` como sinônimo de tudo que ainda não foi publicado. O estado precisa revelar o trabalho restante e impedir que “aprovar” signifique publicar de modo ambíguo.

```text
submitted
  -> triage
  -> needs_info
  -> technical_review
  -> rights_review
  -> editorial_review
  -> approved_for_release
  -> scheduled
  -> published

Saídas alternativas: rejected | duplicate_merged | archived
```

| Estado | Dono da próxima ação | Tempo-alvo | Saída permitida |
|---|---|---:|---|
| `submitted` | Sistema/triagem | 24 h | `triage`, `needs_info`, `duplicate_merged` |
| `triage` | Revisor de catálogo | 48 h | técnico, direitos, editorial ou complemento |
| `needs_info` | Compositor/gerente | 7 dias | reenvio ou arquivamento após lembrete |
| `technical_review` | Operação de conteúdo | 2 dias | editorial, complemento ou rejeição técnica |
| `rights_review` | Revisor de direitos | 3 dias | editorial, complemento ou rejeição fundamentada |
| `editorial_review` | Editor musical | 3 dias | aprovado, complemento ou rejeição editorial |
| `approved_for_release` | Editor/admin | 1 dia | agendado ou publicado |
| `published` | Sistema | — | somente correção versionada/retirada auditada |

A ação atual de “aprovar” deve mudar o estado para `approved_for_release`, mantendo o hino invisível ao público até que as validações de publicação sejam satisfeitas. A publicação é ação separada, confirmada e auditada. O compositor pode receber notificação de aprovação, mas não deve conseguir alterar direitos, status editorial ou data de publicação por um `update` genérico no navegador.

### 4.3. Rotina diária de operação

| Bloco | Atividade | Responsável | Saída mensurável |
|---|---|---|---|
| Início do dia | Painel de fila, distribuição de lotes e bloqueios. | Líder de moderação. | Lote de até 25 itens por revisor, com prioridade e SLA. |
| Triagem | Completar dados, detectar duplicata, classificar direitos/técnica/editorial. | Operação de catálogo. | Todo item recebe estado e motivo estruturado. |
| Revisão | Ouvir, verificar dados, direitos e apresentação. | Editor/revisor. | Decisão com motivo e evidência mínima. |
| Controle de qualidade | Amostra de decisões e revisão dupla de itens sensíveis. | Líder/revisor sênior. | Taxa de reversão acompanhada; correção de padrões. |
| Encerramento | Dashboard de throughput, gargalos e lembretes. | Líder de moderação. | Itens encerrados, entradas novas, idade máxima e pendências por motivo. |

A força-tarefa deve trabalhar com limite de trabalho em progresso. Cada revisor recebe no máximo 25 itens por vez; itens em `needs_info` não ficam no lote ativo. Assim, a equipe não troca velocidade por perda de rastreabilidade. Decisões de rejeição exigem código de motivo e texto curto; decisões de direitos exigem referência à evidência recebida; todas as ações devem registrar ator, timestamp, estado anterior e estado novo.

## 5. To-do emergencial priorizado

### P0 — Hoje e próximas 48 horas: conter dados e preparar a fila

| ID | Tarefa | Responsável sugerido | Dependência | Critério de aceite |
|---|---|---|---|---|
| **SEC-001** | Registrar snapshot de políticas, grants, views expostas, buckets e funções `SECURITY DEFINER`. | DBA/admin Supabase. | Acesso SQL administrativo. | Export de `pg_policies`, `information_schema.role_table_grants`, `pg_views`, `storage.buckets` e funções anexado ao ticket. |
| **SEC-002** | Aplicar hotfix de revogação para `anon` em `users`, `composer_documents`, `notifications`, `playlists` e tabela base de compositores. | DBA/admin Supabase. | SEC-001. | Consulta com chave anônima retorna `403` ou zero para todas as tabelas privadas. |
| **SEC-003** | Tornar `documents` privado e remover as políticas abertas de `storage.objects`. | DBA/admin Supabase. | SEC-001. | Bucket `documents.public = false`; URL pública antiga não entrega o arquivo. |
| **SEC-004** | Pausar temporariamente novos uploads de documento até existir caminho privado/assinado. | Produto/engenharia. | SEC-003. | UI mostra manutenção controlada ou impede upload sem salvar Base64 em tabela. |
| **SEC-005** | Revogar/reestruturar funções expostas `SECURITY DEFINER`, especialmente registro de compositor e administração de usuários. | DBA/engenharia backend. | SEC-001. | Nenhuma função privilegiada é executável por `anon`; `search_path` é fixo. |
| **OPS-001** | Congelar publicação automática e novas ações de publicação em lote. | Líder de produto/admin. | Nenhuma. | Não existe transição automática para `published` fora do fluxo auditado. |
| **OPS-002** | Exportar a fila de hinos sem dados pessoais e reconciliar `draft`, `pending` e os 773 itens do dashboard. | Dados/admin. | Acesso de leitura admin. | Um arquivo com um registro por hino, estado atual, idade e motivo de bloqueio; total reconciliado. |
| **OPS-003** | Definir responsáveis de moderação e aprovar a taxonomia de estados/motivos. | Produto + conteúdo + direitos. | OPS-002. | Tabela de decisão aprovada e comunicada à equipe. |

### P1 — Dias 3 a 7: reconstruir acesso seguro e iniciar redução do backlog

| ID | Tarefa | Responsável sugerido | Dependência | Critério de aceite |
|---|---|---|---|---|
| **SEC-006** | Criar função privada `is_platform_admin()` e políticas de `users` por proprietário/admin. | DBA/engenharia. | SEC-002. | Usuário só lê o próprio perfil; não altera papéis, plano, status ou bloqueio. |
| **SEC-007** | Separar view pública mínima de compositores da tabela operacional privada. | DBA/engenharia. | SEC-002. | Visitante vê apenas perfis aprovados e sem PII; tabela base não é lida por `anon`. |
| **SEC-008** | Recriar políticas de `composer_documents` e implementar acesso por URL assinada. | DBA/backend. | SEC-003. | Dono/revisor autorizado acessa documento; outro usuário e `anon` não acessam metadata nem objeto. |
| **SEC-009** | Recriar políticas de notificações e substituir INSERT/UPDATE genérico por RPC/serviço de domínio. | DBA/backend. | SEC-002. | Usuário recebe e marca somente notificações próprias; eventos Realtime são filtrados. |
| **SEC-010** | Revisar views como `cifra_public_catalog` e mover consultas internas para schema não exposto quando necessário. | DBA/engenharia. | SEC-001. | Nenhuma view expõe coluna privada ou ignora RLS de forma acidental. |
| **OPS-004** | Construir fila operacional com filtros de estado, idade, conteúdo, autor, bloqueio e responsável. | Frontend/backend. | OPS-002, OPS-003. | Revisor consegue tomar lote, filtrar motivo e devolver item sem usar planilha paralela. |
| **OPS-005** | Implementar transições auditadas de moderação e motivo obrigatório em rejeição/devolução. | Backend/frontend. | OPS-003. | Toda decisão tem ator, data, estado anterior, estado novo e motivo. |
| **OPS-006** | Rodar primeira triagem de 194 itens. | Dois revisores + líder. | OPS-004 ou planilha temporária controlada. | 194 itens encerrados ou movidos para estado específico, sem publicação em massa. |

### P2 — Semanas 2 a 4: concluir estoque e estabilizar o produto

| ID | Tarefa | Responsável sugerido | Dependência | Critério de aceite |
|---|---|---|---|---|
| **OPS-007** | Executar revisão editorial/técnica em três lotes semanais de 193 itens. | Equipe de moderação. | OPS-006. | Semanas 2, 3 e 4 encerram 193 itens cada; total planejado = 773. |
| **OPS-008** | Configurar lembretes para `needs_info` e arquivamento baseado em prazo documentado. | Produto/backend. | OPS-005. | Compositor recebe prazo; item não fica parado sem proprietário. |
| **OPS-009** | Criar painel de qualidade: entrada nova, itens encerrados, idade, devoluções, duplicatas e reversões. | Dados/frontend. | OPS-005. | Dashboard substitui `+0%` por métricas com período, fonte e definição. |
| **OPS-010** | Corrigir o carregamento infinito do dashboard de compositor. | Frontend/backend. | SEC-007, SEC-009. | Nenhum spinner infinito; estados de vínculo e erro são acionáveis. |
| **OPS-011** | Corrigir a agregação de cifras para renderizar as 10 legadas e as 455 v2 publicáveis. | Frontend/backend. | SEC-010. | `/cifras` não mostra vazio quando há conteúdo publicado. |
| **QA-001** | Criar homologação, contas de teste e roteiro RLS/Realtime ponta a ponta. | DevOps/DBA/QA. | SEC-006 a SEC-010. | Mudança descartável aparece em segunda sessão, é revertida e deixa log. |

## 6. Definição de pronto e rotina de governança

O backlog só estará efetivamente zerado quando a contagem de itens em estados operacionais não terminales for zero ou estiver dentro do SLA definido, e não quando todos os itens tiverem sido “aprovados”. Um item devolvido com exigência objetiva ou arquivado por duplicidade pode ser um encerramento correto. A governança deve preferir qualidade, direitos e rastreabilidade a throughput artificial.

| Indicador | Meta de emergência | Como verificar |
|---|---:|---|
| Linhas privadas visíveis a `anon` | 0 | Teste REST com chave pública e `limit=0`. |
| Objetos públicos no bucket `documents` | 0 | `storage.buckets.public = false` e teste sem sessão. |
| Hinos com estado sem motivo/próximo dono | 0 | Relatório diário de transições. |
| Itens encerrados em 4 semanas | 773 | 194 + 193 + 193 + 193. |
| Itens novos sem triagem em 48 h | 0 | Tempo entre `submitted` e primeiro estado operacional. |
| Spinner infinito em dashboard de compositor | 0 | Teste de rota com compositor e gerente. |
| Métrica administrativa sem fonte/período | 0 | Checklist de dashboard antes do deploy. |

## Referências

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[2]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase — Postgres Changes / Realtime"

---

**Próximo passo recomendado:** aprovar a execução da etapa P0 em **homologação** e, após os testes de papel e rollback, preparar uma única migração versionada para a contenção de produção. Nenhum dos blocos SQL deste documento foi executado pela auditoria.
