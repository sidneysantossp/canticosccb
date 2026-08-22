# Plano de migração: Supabase Cloud para VPS com aaPanel

## Objetivo

Migrar o backend do projeto Cânticos CCB do Supabase Cloud para uma instância Supabase self-hosted na VPS, sem trocar a hospedagem atual do frontend na Vercel e sem mover as mídias já armazenadas no Cloudflare R2.

Motivo: a instância atual no plano Free está com `Compute` e `Disk IO` em 100%, causando timeouts no Auth e Data API. Isso impede login administrativo e faz o site exibir catálogos de contingência, sem dados dinâmicos como banners.

## Arquitetura final

| Camada | Destino após a migração | Observação |
| --- | --- | --- |
| Frontend React, SSR e assinador de upload | Vercel | Permanece no projeto atual. |
| PostgreSQL, Auth, REST API, Realtime e Studio | VPS com Docker + Supabase self-hosted | Novo endpoint em `api.canticosccb.com.br`. |
| Mídias de áudio, imagens, vídeos e documentos | Cloudflare R2 | Permanece no bucket atual. |
| Domínio público | `www.canticosccb.com.br` | Não muda. |
| Função `youtube-import` | VPS ou função Vercel equivalente | Precisa ser configurada antes do corte. |

## Escopo e impactos

### Será preservado

- Tabelas, dados, views, funções, triggers, extensões e políticas RLS.
- Usuários de `auth.users`, perfis administrativos e permissões do banco.
- URLs de mídia já apontadas para o R2.
- Aplicação Vercel, domínio público e configuração de banners no banco.

### Exige reconfiguração manual

- Chaves JWT, chave anônima e `service_role` do novo Supabase.
- Configuração de Auth, SMTP, URLs de redirecionamento e Google OAuth.
- Funções Edge, especialmente `youtube-import` em `supabase/functions/youtube-import/index.ts`.
- Objetos em Supabase Storage, caso existam; o backup do banco só leva os metadados, não os arquivos.
- Variáveis da Vercel que apontam para o Supabase.

### Impacto para usuários

- Sessões existentes deixam de ser válidas; todos precisarão entrar novamente.
- Haverá uma janela de manutenção estimada de 30 a 60 minutos no corte final.
- Não haverá perda de mídia se o R2 for mantido e as URLs atuais forem preservadas.

## Pré-requisitos da VPS

### Capacidade mínima

- Ubuntu 22.04 ou 24.04 LTS.
- Mínimo: 2 vCPU, 4 GB RAM e 80 GB SSD.
- Recomendado para o volume atual: 4 vCPU, 8 GB RAM e 120 GB SSD.
- IP público fixo e acesso SSH com usuário administrativo.

### Serviços necessários

- aaPanel atualizado.
- Docker e Docker Compose instalados pelo Docker Manager do aaPanel ou por terminal.
- Nginx do aaPanel para proxy reverso e certificado TLS.
- Domínio/subdomínio dedicado: `api.canticosccb.com.br` apontando para o IP da VPS.
- SMTP transacional já usado pelo projeto, ou uma nova conta SMTP.

### Firewall da VPS

Liberar apenas:

- `22/tcp`: SSH, preferencialmente restrito ao IP administrativo.
- `80/tcp` e `443/tcp`: Nginx/HTTPS público.

Não expor diretamente as portas Docker do banco, Kong, Studio, Auth ou Storage. O Studio deve ficar restrito por VPN, IP allowlist ou autenticação adicional.

## Inventário obrigatório antes de iniciar

Preencher e guardar em cofre de senhas, nunca em Git:

- Acesso à VPS e ao aaPanel.
- Acesso de administrador ao Supabase atual.
- Senha da conexão Postgres atual ou connection string do pooler.
- Acesso à Vercel.
- Acesso ao Cloudflare/R2 e ao DNS do domínio.
- Credenciais SMTP.
- Credenciais Google OAuth, caso o login Google permaneça ativo.
- Lista de buckets do Supabase Storage, se houver uso além do R2.

Antes de qualquer alteração, exportar as configurações do Supabase atual:

- Database > Extensions.
- Authentication > Providers, URL Configuration e SMTP.
- Storage > Buckets e políticas.
- Edge Functions.
- SQL Editor: funções, cron jobs e secrets usados pelo banco.

## Fase 1 — Preparar a VPS

1. Criar um snapshot/backup da VPS antes da instalação.
2. Criar o registro DNS `api.canticosccb.com.br` para o IP da VPS, com TTL de 300 segundos durante a migração.
3. Instalar Docker e Docker Compose.
4. Criar diretório persistente, por exemplo `/opt/canticos-supabase`.
5. Baixar a configuração oficial self-hosted do Supabase e criar o arquivo `.env` a partir do exemplo oficial.
6. Gerar segredos novos e fortes para:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `ANON_KEY`
   - `SERVICE_ROLE_KEY`
   - senha do Studio
   - chaves de criptografia/Vault exigidas pela distribuição self-hosted
7. Configurar no `.env`:
   - URL pública da API: `https://api.canticosccb.com.br`
   - URL do site: `https://www.canticosccb.com.br`
   - lista de redirects autorizados para produção, preview e localhost
   - SMTP
   - provedor Google OAuth, se aplicável
8. Subir todos os containers e verificar saúde de PostgreSQL, Auth, REST API, Realtime, Storage e Studio.
9. Configurar proxy reverso no aaPanel: `https://api.canticosccb.com.br` para o gateway/API interno do Supabase.
10. Emitir certificado Let's Encrypt no aaPanel e forçar HTTPS.

Critério de saída: `https://api.canticosccb.com.br/rest/v1/` deve responder `401` sem chave e a página Studio deve abrir somente para administradores autorizados.

## Fase 2 — Backup e exportação do Supabase atual

Esta fase só começa quando a instância atual responder ao banco. O estado atual de saturação pode exigir aguardar a recuperação temporária da API ou usar a conexão direta Postgres.

1. Colocar o site em modo de manutenção editorial: não criar banners, hinos, cifras, usuários ou uploads durante a cópia final.
2. Criar três exports lógicos separados usando a CLI oficial:

```bash
supabase db dump --db-url "CONNECTION_STRING_ATUAL" -f roles.sql --role-only
supabase db dump --db-url "CONNECTION_STRING_ATUAL" -f schema.sql
supabase db dump --db-url "CONNECTION_STRING_ATUAL" -f data.sql --use-copy --data-only
```

3. Guardar os arquivos criptografados fora da VPS, junto com data e checksum.
4. Exportar separadamente objetos de Supabase Storage, se existirem. O R2 não deve ser copiado, pois continuará sendo usado.
5. Registrar contagem de linhas das tabelas críticas: `users`, `hinos`, `albums`, `banners`, `cifras`, `cifra_versions`, `site_config`, `categorias`, `playlists` e tabelas de relação.
6. Registrar contagem de `auth.users`, admins e compositores ativos.

## Fase 3 — Restaurar e configurar o novo Supabase

1. Fazer backup vazio da nova instância antes do restore.
2. Copiar `roles.sql`, `schema.sql` e `data.sql` para uma área protegida da VPS.
3. Restaurar em transação única:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "CONNECTION_STRING_NOVA_VPS"
```

4. Reativar e conferir extensões utilizadas pelo banco.
5. Validar funções, triggers, views públicas e políticas RLS; atenção especial a `cifra_public_catalog`, permissões de `banners`, `site_config`, `users` e perfis de compositor.
6. Recriar buckets/políticas do Supabase Storage somente se forem realmente usados; confirmar que documentos e mídias do projeto continuam no R2.
7. Configurar SMTP e testar recuperação de senha.
8. Configurar Google OAuth com callback `https://api.canticosccb.com.br/auth/v1/callback` e atualizar os redirect URIs no Google Cloud Console.
9. Reimplantar ou adaptar a função `youtube-import`; ela hoje depende de `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

Critério de saída: as contagens críticas devem coincidir com a origem e um usuário administrador de teste deve conseguir autenticar no novo endpoint.

## Fase 4 — Ajustar Vercel e aplicação

Atualizar as variáveis em **Production**, **Preview** e **Development** conforme necessário:

| Variável | Novo valor |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://api.canticosccb.com.br` |
| `VITE_SUPABASE_ANON_KEY` | nova `ANON_KEY` da VPS |
| `SUPABASE_URL` | `https://api.canticosccb.com.br` para funções server-side, quando usada |
| `SUPABASE_SERVICE_ROLE_KEY` | nova chave da VPS, somente server-side |
| `VITE_APP_URL` | permanece `https://www.canticosccb.com.br` |
| `R2_*` e `R2_PUBLIC_URL` | permanecem como estão |

Pontos do projeto que dependem dessas variáveis:

- `src/lib/supabase-auth.ts`: login e sessão.
- `src/lib/supabaseRest.ts`: leituras e escritas REST.
- `functions/api/ssr.ts`: páginas SEO renderizadas no servidor.
- `functions/api/r2-upload-sign.ts`: autentica usuário antes de assinar upload R2.
- `src/lib/youtubeImport.ts`: chama a Edge Function.
- `scripts/generate-sitemap.js` e `scripts/generate-robots.js`: consultam o banco durante o build.

Depois de atualizar as variáveis, disparar um novo deploy de produção e conferir que o build utiliza o novo endpoint.

## Fase 5 — Corte para produção

1. Anunciar manutenção breve e bloquear alterações editoriais.
2. Fazer um último dump incremental/lógico da origem.
3. Restaurar o último dump na VPS se houve alterações desde a cópia de teste.
4. Executar as validações de banco e Auth.
5. Alterar as variáveis da Vercel para a VPS.
6. Fazer deploy Production na Vercel.
7. Testar imediatamente:
   - login de administrador;
   - listagem do admin;
   - criação/edição de banner;
   - carregamento dos full banners na home;
   - leitura de hinos, álbuns e cifras;
   - upload R2;
   - recuperação de senha e login Google;
   - sitemap, robots e SSR de uma página pública.
8. Reabrir edição administrativa somente após todos os testes passarem.

## Rollback

Se um teste crítico falhar durante o corte:

1. Reverter `VITE_SUPABASE_URL`, chave anônima e `SUPABASE_SERVICE_ROLE_KEY` na Vercel para os valores do Supabase Cloud.
2. Fazer redeploy da Vercel.
3. Manter a VPS intacta para correção; não apagar dados nem volumes.
4. Registrar as alterações feitas após o último dump para replicá-las antes de uma nova tentativa.

Observação: o rollback volta ao Supabase Cloud, mas a instância atual já apresenta saturação. Por isso, o corte só deve ocorrer depois de a VPS ser validada integralmente em ambiente de teste.

## Operação contínua da VPS

- Backup diário lógico do banco para armazenamento externo.
- Backup semanal completo do volume Postgres e teste mensal de restauração.
- Monitorar CPU, RAM, disco, Disk IO, conexões Postgres, erros da API e espaço dos volumes Docker.
- Configurar rotação de logs dos containers.
- Manter sistema operacional, Docker e Supabase atualizados em janela de manutenção.
- Criar alerta de disponibilidade para `https://api.canticosccb.com.br/rest/v1/` (resposta `401` sem chave indica API disponível) e para o login do site.
- Nunca usar `service_role` no frontend nem publicar arquivos `.env` no Git.

## Ordem de execução recomendada

1. Receber acesso à VPS/aaPanel e confirmar capacidade.
2. Montar Supabase self-hosted em subdomínio temporário de teste.
3. Exportar origem e restaurar na VPS.
4. Validar banco, Auth, R2 e funções.
5. Atualizar Vercel somente no corte aprovado.
6. Monitorar a primeira semana e manter o Supabase Cloud apenas como referência/rollback até estabilização.

## Referências oficiais

- [Self-hosting Supabase](https://supabase.com/docs/guides/self-hosting)
- [Restaurar Supabase Cloud em instância self-hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Backups de banco](https://supabase.com/docs/guides/platform/backups)
- [Migração entre projetos Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase)
