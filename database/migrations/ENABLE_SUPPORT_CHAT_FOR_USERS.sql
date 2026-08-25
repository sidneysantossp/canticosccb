-- Chat de suporte: permite que cada usuário autenticado abra o próprio chamado.
-- A leitura integral e as respostas continuam restritas a administradores.

alter table public.notifications enable row level security;

drop policy if exists notifications_insert_support_chat_by_requester on public.notifications;

create policy notifications_insert_support_chat_by_requester
on public.notifications
for insert
to authenticated
with check (
  type = 'support_chat'
  and user_id = (select auth.uid())
  and coalesce(metadata ->> 'chat_kind', '') = 'support'
  and coalesce(metadata ->> 'sender_role', '') = 'user'
  and coalesce(metadata ->> 'requester_id', '') = (select auth.uid())::text
);

-- Diagnóstico rápido após aplicar:
-- select count(*) from public.notifications where type = 'support_chat';
