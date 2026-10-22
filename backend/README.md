# Backend do quiz (Supabase)

Guarda as respostas anônimas do quiz e mostra onde as pessoas saem do funil. O quiz funciona sem o backend; com ele, você passa a ver o funil, os perfis e as campanhas que levam ao checkout.

## O que tem aqui

```
backend/
  .env.example
  supabase/
    migrations/0001_quiz.sql        tabelas, função de registro, views do funil, limpeza
    functions/
      _shared/validar.ts            validação do que o quiz manda (código puro, testado)
      _shared/cors.ts               lista de domínios permitidos
      quiz/index.ts                 endpoint público POST /quiz
  testes/validar.test.ts            npm run test:backend
```

- **`quiz_sessoes`**: uma linha por pessoa que abriu o quiz, com respostas (códigos curtos), peso, altura, perfil, UTMs, hora em que concluiu e hora em que clicou no checkout.
- **`quiz_eventos`**: linha do tempo (`inicio`, `etapa`, `concluido`, `checkout`).
- **Views**: `quiz_funil` (pessoas por etapa e % do início), `quiz_resumo_diario`, `quiz_por_perfil` e `quiz_por_campanha`.

## Privacidade e segurança

- Não guardamos nome, e-mail, telefone nem IP. O IP vira `sha256(sal + IP)`, usado só para limitar sessões novas (40 por IP por hora). Cada sessão aceita até 80 eventos.
- As respostas incluem peso, altura e sintomas, que são dados de saúde para a LGPD. Mesmo anônimos, trate como sensíveis: não exporte para planilhas abertas e não mande para o Pixel do Meta. As sessões com mais de 180 dias são apagadas por `quiz_limpar_antigos()`.
- RLS ligada e forçada, sem policy: só o `service_role` (a Edge Function) lê e escreve. `anon` e `authenticated` não têm acesso nem às tabelas nem às views.
- A função valida tudo: sessão em UUID, tipo de evento, etapa de 0 a 40, respostas só como códigos `a-z0-9_`, peso de 30 a 300 kg, altura de 120 a 230 cm, perfil numa lista fixa, corpo de até 8 KB. UTMs desconhecidas são descartadas.

## Subir

```bash
# 1) Banco
supabase link --project-ref SEU_PROJETO
supabase db push

# 2) Segredos (domínio do quiz e sal do hash)
cp backend/.env.example backend/.env    # preencha
supabase secrets set --env-file backend/.env

# 3) Função pública (o quiz não tem login)
supabase functions deploy quiz --no-verify-jwt

# 4) Limpeza diária (opcional, precisa da extensão pg_cron)
# select cron.schedule('quiz-limpeza', '0 4 * * *', 'select quiz_limpar_antigos()');
```

Depois coloque a URL da função em `CONFIG.backendUrl` no `quiz/index.html`:
`https://SEU_PROJETO.supabase.co/functions/v1/quiz`.

## Endpoint

`POST /functions/v1/quiz`, corpo JSON enviado como `text/plain` (assim o navegador não faz preflight):

```json
{ "sessao": "uuid", "tipo": "etapa", "etapa": 3, "respostas": { "idade": "i45" }, "utm": { "utm_campaign": "x" }, "versao": "v1" }
```

Resposta: `{ "ok": true }`, ou `{ "ok": false, "erro": "..." }` com 400 (inválido), 403 (domínio fora da lista), 413 (corpo grande) ou 429 (limite).

## Ver os números

No SQL Editor do Supabase:

```sql
select * from quiz_funil;            -- em qual etapa as pessoas saem
select * from quiz_resumo_diario;    -- sessões, conclusões e cliques no checkout por dia
select * from quiz_por_perfil;       -- qual perfil compra mais
select * from quiz_por_campanha;     -- qual campanha e criativo trazem quem conclui
```
