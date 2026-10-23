# Backend do quiz (Supabase)

Guarda as respostas anônimas do quiz e mostra onde as pessoas saem do funil. O quiz funciona sem o backend; com ele, você passa a ver o funil, os perfis e as campanhas que levam ao checkout.

## O que tem aqui

```
backend/
  .env.example                      segredos da função (copie para .env)
  supabase/
    config.toml                     config do Supabase CLI (função quiz pública)
    migrations/0001_quiz.sql        tabelas, função de registro, views do funil, limpeza
    functions/
      _shared/validar.ts            validação do que o quiz manda (código puro, testado)
      _shared/cors.ts               lista de domínios permitidos
      quiz/index.ts                 endpoint público POST /quiz
  testes/validar.test.ts            npm run test:backend
```

- **`quiz_sessoes`**: uma linha por pessoa que abriu o quiz, com:
  - respostas (códigos curtos), peso e altura;
  - perfil e UTMs;
  - hora em que concluiu e hora em que clicou no checkout.
- **`quiz_eventos`**: linha do tempo (`inicio`, `etapa`, `concluido`, `checkout`), com o nome da tela (`passo`) e a versão do quiz (`versao`).
- **Views**:
  - `quiz_funil`: pessoas por tela e % do início, separado por versão;
  - `quiz_resumo_diario`;
  - `quiz_por_perfil`;
  - `quiz_por_campanha`.

## Privacidade e segurança

- **Sem dados pessoais:** não guardamos nome, e-mail, telefone, IP nem `fbclid`.
  - O IP vira `sha256(sal + IP)`, usado só para limitar sessões novas (300 por IP por hora; o limite é alto porque no 4G muita gente sai pelo mesmo IP).
  - O `fbclid` vai para o checkout, mas não fica no banco junto das respostas.
  - Cada sessão aceita até 80 eventos.
- **Dado de saúde (LGPD):** peso, altura e sintomas contam como dado de saúde, mesmo sem nome.
  - Não exporte para planilhas abertas e não mande para o Pixel do Meta.
  - As sessões com mais de 180 dias são apagadas por `quiz_limpar_antigos()`.
  - A política de privacidade fica em `quiz/privacidade.html` (ligada em `CONFIG.privacidadeUrl`). Se mudar o que o backend guarda ou o prazo de 180 dias, atualize a página também.
- **Acesso ao banco:** RLS ligada e sem policy. Só o `service_role` (a Edge Function) grava. `anon` e `authenticated` não têm acesso às tabelas, às views nem às funções. Você lê os números pelo SQL Editor.
- **Validação na função:**
  - sessão em UUID e tipo de evento numa lista fixa;
  - etapa de 0 a 40;
  - respostas só como códigos `a-z0-9_`;
  - peso de 30 a 300 kg e altura de 120 a 230 cm;
  - perfil numa lista fixa;
  - corpo de até 8 KB.

  UTMs desconhecidas são descartadas.

## Subir (uma vez)

Pré-requisitos: um projeto no Supabase e o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado. Rode tudo **de dentro da pasta `backend/`**:

```bash
cd backend

# 1) Ligar a pasta ao seu projeto (o ref está na URL do painel: supabase.com/dashboard/project/SEU_REF)
supabase login
supabase link --project-ref SEU_REF

# 2) Banco: cria tabelas, função e views
supabase db push

# 3) Segredos da função
cp .env.example .env
#    ALLOWED_ORIGINS = o domínio onde o quiz vai ficar (com https://, sem barra no fim).
#                      Coloque as duas formas se usar: https://seudominio.com.br,https://www.seudominio.com.br
#    QUIZ_IP_SALT    = openssl rand -hex 32
supabase secrets set --env-file .env

# 4) Função pública
supabase functions deploy quiz --no-verify-jwt

# 5) Limpeza diária (no painel: Database > Extensions > ative pg_cron; depois no SQL Editor)
# select cron.schedule('quiz-limpeza', '0 4 * * *', 'select quiz_limpar_antigos()');
```

Depois coloque a URL da função em `CONFIG.backendUrl` no `quiz/index.html`:
`https://SEU_REF.supabase.co/functions/v1/quiz`.

## Conferir se está funcionando

1. Mande um evento de teste (troque o domínio pelo que está em `ALLOWED_ORIGINS`):

```bash
curl -i -X POST https://SEU_REF.supabase.co/functions/v1/quiz \
  -H 'Origin: https://seudominio.com.br' -H 'Content-Type: text/plain' \
  --data '{"sessao":"00000000-0000-4000-8000-000000000001","tipo":"inicio","etapa":0,"versao":"teste"}'
```

   A resposta precisa ser `200` com `{"ok":true}`. Se vier 403, o domínio não bate com `ALLOWED_ORIGINS`. Se vier 500, veja o log da função no painel (Edge Functions > quiz > Logs).

2. Abra o quiz publicado, responda até o fim e rode `select * from quiz_funil;` no SQL Editor. A sua sessão aparece com a versão atual (ex.: `v10`).

3. Apague os testes:

```sql
delete from quiz_sessoes where versao = 'teste';
```

## Endpoint

`POST /functions/v1/quiz`, corpo JSON enviado como `text/plain` (assim o navegador não faz preflight):

```json
{ "sessao": "uuid", "tipo": "etapa", "etapa": 3, "passo": "barriga", "respostas": { "barriga": "pochete" }, "utm": { "utm_campaign": "x" }, "versao": "v10" }
```

Resposta: `{ "ok": true }`, ou `{ "ok": false, "erro": "..." }` com 400 (inválido), 403 (domínio fora da lista), 413 (corpo grande) ou 429 (limite).

## Ver os números

No SQL Editor do Supabase:

```sql
select * from quiz_funil;            -- em qual tela as pessoas saem (por versão do quiz)
select * from quiz_resumo_diario;    -- sessões, conclusões e cliques no checkout por dia
select * from quiz_por_perfil;       -- qual perfil vai mais ao checkout
select * from quiz_por_campanha;     -- qual campanha e criativo (utm_content) trazem quem conclui
```

Cada mudança no quiz troca a `VERSAO` no `index.html` (hoje `v10`). Compare o funil só entre linhas da mesma versão.

Para usar `quiz_por_campanha`, coloque nos anúncios do Meta os parâmetros `utm_campaign={{campaign.name}}&utm_content={{ad.name}}`.
