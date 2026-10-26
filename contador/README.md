# Contador do funil

Mede o abandono do quiz com **contagens agregadas**: quantas vezes cada passo aconteceu, por dia e por versão. Não usa GA4 nem o backend Supabase (que continua desligado).

## O que é contado

| Evento | Quando | Onde |
| --- | --- | --- |
| `visita` | o quiz abriu | `quiz/index.html` |
| `inicio` | primeiro clique na primeira pergunta | `quiz/index.html` |
| `etapa` (1 a 14) | chegou na etapa (alcance, não resposta) | `quiz/index.html` |
| `conclusao` | terminou o carregamento depois da etapa 14 | `quiz/index.html` |
| `oferta` | o resultado com a oferta apareceu | `quiz/index.html` |
| `ver_oferta` | clicou na barra fixa "Ver meu plano completo" (rola até a oferta, não vai à Kiwify) | `quiz/index.html` |
| `checkout` | clicou para ir à Kiwify (só os botões da oferta, `#cta` e `#cta-2`; a coluna `botao` diz qual) | `quiz/index.html` |
| `upsell` | a página de upsell abriu | `quiz/upsell/index.html` |
| `downsell` | a página de downsell abriu | `quiz/downsell/index.html` |

A etapa 1 é a primeira pergunta, que já aparece na abertura; por isso `etapa 1` ≈ `visita`. O `inicio` (primeiro clique) é a base mais confiável para medir abandono, porque robôs raramente clicam.

**Os números são ocorrências, não pessoas únicas.** Dentro da mesma aba cada evento conta uma vez: voltar, avançar e recarregar não contam de novo. A mesma pessoa em outra aba, outro navegador ou outro dia conta outra vez. `checkout` é o clique para ir à Kiwify, não a compra: a compra é medida pela Kiwify.

As versões: o quiz manda a `VERSAO` do `quiz/index.html` (hoje `v20`; até 25/10 foi `v19`); upsell e downsell mandam `v1`; testes manuais devem usar `v0` (fácil de separar e apagar).

## Privacidade: o que a aplicação grava e o que a Cloudflare processa

**A aplicação (o contador) grava no D1** apenas a tabela `contagem`: `dia` (calculado no servidor, horário de Brasília), `versao`, `evento`, `etapa`, `origem`, `ambiente`, `botao` e `total`. Nada mais.

- **`origem`**: o `utm_source` com que a pessoa chegou, em minúsculas (sem utm = `direto`; fora do padrão `a-z 0-9 . _ -` ou com mais de 30 letras = `outro`). O quiz guarda essa origem no `sessionStorage` para o upsell e o downsell. Linhas de antes da migração ficam como `antigo`.
- **`ambiente`**: calculado no servidor pelo endereço do pedido. `producao` só em `oalemdacaneta.com.br`; prévias, `*.pages.dev` e testes locais são `teste`.

**Vai do navegador para o contador:** `{"e": "etapa", "n": 7, "v": "v20", "o": "facebook"}`. Das UTMs, só o `utm_source` vai. A função não lê nem grava IP, navegador, cookies, identificador de pessoa, outras UTMs, URL ou respostas do quiz, e não escreve logs.

**No navegador:** para não repetir a contagem, a aba anota em `sessionStorage` (`contagem:etapa:7` etc.) o que já foi contado. Não é cookie, não é enviado e some ao fechar a aba.

**A infraestrutura da Cloudflare processa**, como em qualquer site hospedado nela, os dados técnicos da conexão (IP, tipo de navegador, cabeçalhos) para entregar as páginas, proteger o site e aplicar regras como o limite de pedidos. Isso acontece na camada de hospedagem, segundo a política da Cloudflare, e não vai para a tabela `contagem`.

## Migração: origem e ambiente (out 2026)

O banco que já tinha a tabela antiga precisa da `contador/migracao-origem.sql`, rodada linha por linha no Console do D1 **logo depois** que o deploy com o código novo terminar (entre o deploy e a migração, as contagens dão erro 500 e se perdem). No banco da prévia, troque `'producao'` por `'teste'` na linha do `INSERT`.

## Formato do corpo (o que a função aceita)

`POST /api/contagem`, `Content-Type: text/plain` (ou `application/json`), mesma origem, corpo JSON com **chaves curtas**:

| Chave | Valor | Obrigatória |
| --- | --- | --- |
| `e` | um dos 9 eventos: `visita`, `inicio`, `etapa`, `conclusao`, `oferta`, `ver_oferta`, `checkout`, `upsell`, `downsell` | sempre |
| `n` | inteiro de 1 a 14 | só quando `e` é `etapa`; proibida nos outros |
| `v` | versão: `v` + 1 a 4 dígitos (ex.: `v19`) | sempre |
| `o` | origem (`utm_source`); texto, normalizado pela função | não (sem ela = `direto`) |
| `b` | botão do clique: `cta` ou `cta-2` | só no `checkout` (opcional); proibida nos outros |

Exemplos aceitos (204): `{"e":"visita","v":"v19"}` e `{"e":"etapa","n":3,"v":"v19"}`.

Exemplos recusados (400): `{"evento":"visita","versao":"v19"}` (nomes longos), `{"e":"visita","v":"v19","etapa":0}` (campo a mais), `{evento:"visita"}` (não é JSON). Os nomes longos `evento`, `etapa` e `versao` são as **colunas da tabela**, não os campos do corpo.

Para um teste manual sem sujar os números reais, use a versão `v0` e apague depois: no Console do navegador, na página do site, `fetch('/api/contagem', {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: '{"e":"visita","v":"v0"}'}).then((r) => console.log(r.status))` deve mostrar `204`; no D1, `SELECT * FROM contagem WHERE versao = 'v0';` mostra a linha e `DELETE FROM contagem WHERE versao = 'v0';` a remove.

## Segurança da função (`functions/api/contagem.js`)

| Situação | Resposta | Grava? |
| --- | --- | --- |
| `POST` válido da própria página | 204, sem corpo | +1 |
| método diferente de `POST` (GET, HEAD, OPTIONS, PUT, DELETE…) | 405 com `Allow: POST` | não |
| `Origin` de outro site, `Origin: null`, ou sem `Origin` e sem `Sec-Fetch-Site: same-origin` | 403 | não |
| `Content-Type` que não é `text/plain` nem `application/json` | 415 | não |
| corpo acima de 128 bytes (pelo cabeçalho ou lido aos pedaços, sem confiar no `Content-Length`) | 413 | não |
| corpo que não é UTF-8, não é JSON, tem campo a mais, evento fora da lista, etapa fora de 1–14 ou não inteira, versão fora de `v` + 1 a 4 dígitos | 400 | não |
| binding `DB` ausente | 503 | não |
| erro do D1 | 500, sem detalhes | não |

Todas as respostas têm `Cache-Control: no-store`. O navegador manda o evento com `sendBeacon` (ou `fetch` com `keepalive`) e nunca espera a resposta: nenhuma dessas situações trava a navegação, o quiz ou o checkout.

Com a saída `quiz` e a pasta `functions/` na raiz, a Cloudflare gera rotas só para `/api/contagem` (conferido com `wrangler pages functions build`: `include: ["/api/contagem"]`). As páginas, imagens, áudio e vídeo continuam estáticos e não passam pela função.

## Configurar a Cloudflare (uma vez, por você)

Configurações do Pages confirmadas: Root directory vazio, Build output directory `quiz`, Build command vazio, Production branch `main`. Nada disso precisa mudar.

### 1. Criar o banco de produção
Painel da Cloudflare › **Storage & Databases** (ou **Workers & Pages**, dependendo da versão do painel) › **D1 SQL Database** › **Create database** › nome **`quiz-contagem`** › Create.

### 2. Criar o banco de prévia
Mesmo caminho › **Create database** › nome **`quiz-contagem-previa`** › Create.

### 3. Executar o esquema nos dois
Para cada banco: abra o banco › aba **Console** › cole todo o conteúdo de `contador/esquema.sql` › **Execute**.

Confira em cada um:
```sql
SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'contagem';
```
Deve voltar uma linha (`contagem`). O esquema usa `CREATE TABLE IF NOT EXISTS`: rodar de novo não apaga nem altera nada.

Pela linha de comando (opcional, com o Wrangler logado na sua conta):
```bash
npx wrangler d1 create quiz-contagem
npx wrangler d1 create quiz-contagem-previa
npx wrangler d1 execute quiz-contagem --remote --file contador/esquema.sql
npx wrangler d1 execute quiz-contagem-previa --remote --file contador/esquema.sql
```

### 4. Associar o binding `DB`
Projeto do Pages › **Settings** › **Bindings** › **Add** › **D1 database**. A tela tem um seletor de ambiente (**Production** / **Preview**); faça um de cada:

| Ambiente | Variable name | D1 database |
| --- | --- | --- |
| Production | `DB` | `quiz-contagem` |
| Preview | `DB` | `quiz-contagem-previa` |

O nome tem que ser exatamente `DB` (maiúsculo). Confira depois que cada ambiente aponta para o banco certo: um erro aqui mistura teste com número real.

### 5. Nova publicação
O binding só vale para publicações feitas depois dele. Depois de salvar os dois:
- **prévia:** um novo push na branch `claude/admiring-noether-v22vm7`, ou Deployments › a última publicação da branch › **⋯** › **Retry deployment**;
- **produção:** só quando o código for para a `main` (com a sua autorização).

Sem o binding, `/api/contagem` responde 503 e nada é gravado; o quiz funciona normalmente.

### 6. Limite de pedidos (recomendado; ver a seção abaixo)

## Validar a prévia real

Os testes automáticos e a simulação local (`wrangler pages dev`) **não provam** que a publicação real funciona. Faça este roteiro na URL de prévia da branch (Deployments › a publicação de `claude/admiring-noether-v22vm7` › URL `https://<algo>.<projeto>.pages.dev`). Abaixo, `PREVIA` é essa URL, sem barra no fim.

### A. Antes de começar
No D1 **`quiz-contagem-previa`** › Console (nunca no de produção):
```sql
SELECT versao, evento, etapa, total FROM contagem ORDER BY versao, evento, etapa;
```
Anote o resultado (ou, se quiser começar do zero na prévia, rode `DELETE FROM contagem;` **somente no banco de prévia**).

### B. Respostas HTTP (terminal)
```bash
PREVIA="https://SUA-PREVIA.pages.dev"
# deve dar 405
curl -s -o /dev/null -w '%{http_code}\n' "$PREVIA/api/contagem"
# deve dar 403 (outra origem)
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: https://fora.example' -H 'Content-Type: text/plain' --data '{"e":"inicio","v":"v0"}' "$PREVIA/api/contagem"
# deve dar 415 (formulário)
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "Origin: $PREVIA" -H 'Content-Type: application/x-www-form-urlencoded' --data 'e=inicio&v=v0' "$PREVIA/api/contagem"
# deve dar 400 (etapa 15)
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "Origin: $PREVIA" -H 'Content-Type: text/plain' --data '{"e":"etapa","n":15,"v":"v0"}' "$PREVIA/api/contagem"
# deve dar 400 (campo de resposta)
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "Origin: $PREVIA" -H 'Content-Type: text/plain' --data '{"e":"inicio","v":"v0","idade":"i40"}' "$PREVIA/api/contagem"
# deve dar 204 (válido, versão de teste v0) — se der 503, o binding DB da prévia não está ativo
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H "Origin: $PREVIA" -H 'Content-Type: text/plain' --data '{"e":"etapa","n":3,"v":"v0"}' "$PREVIA/api/contagem"
# não pode mostrar o código da função (o normal é a página do quiz ou 404)
curl -s "$PREVIA/functions/api/contagem.js" | head -c 80; echo
```

### C. O funil no navegador
Use **uma janela anônima nova** (sessão limpa) com o DevTools aberto na aba **Network**, filtrando por `contagem`. Abra a prévia com UTMs de teste: `PREVIA/?utm_source=teste&utm_campaign=previa`.
1. Na abertura, confira que o vídeo, as fotos e os textos carregam.
2. Responda até a etapa 6 (página "A culpa não é sua"). Clique na seta de **voltar** do topo e avance de novo: **não** pode aparecer um segundo envio de `etapa 6`.
3. Continue. Na etapa 11, toque no **play** do áudio da nutricionista: ele precisa tocar.
4. Vá até o fim: carregamento e resultado com a oferta (envios `conclusao` e `oferta`).
5. Clique em **Acessar meu plano completo**. A aba vai para `pay.kiwify.com.br/3gLGyNe` com `utm_source=teste` e `utm_campaign=previa` na URL (envio `checkout`). **Não preencha nem pague.** Use o voltar do navegador para retornar.
6. Clique de novo em comprar: **não** pode aparecer um segundo envio de `checkout`. Volte de novo sem pagar.
7. **Recarregue** a página do quiz (F5). O quiz volta ao começo e **não** pode aparecer novo envio de `visita` nem de `etapa 1`.
8. Abra `PREVIA/upsell/` e depois `PREVIA/downsell/` (envios `upsell` e `downsell`). Os botões da Kiwify aparecem; **não clique em "Sim"**.
9. Na Network, cada envio para `/api/contagem` deve ter status **204** e corpo só com `e`, `n` (nas etapas) e `v`. Se aparecer **503**, o binding `DB` da prévia não está ativo (volte ao passo 4 da configuração e publique de novo).

### D. Conferir no D1 de prévia
```sql
-- 1) o que esta sessão gravou (versões do quiz e das páginas de oferta)
SELECT versao, evento, etapa, total
FROM contagem
WHERE versao IN ('v19', 'v1')
ORDER BY versao,
  CASE evento WHEN 'visita' THEN 0 WHEN 'inicio' THEN 1 WHEN 'etapa' THEN 2 WHEN 'conclusao' THEN 3
              WHEN 'oferta' THEN 4 WHEN 'checkout' THEN 5 WHEN 'upsell' THEN 6 WHEN 'downsell' THEN 7 END,
  etapa;

-- 2) etapas que faltam ou passaram de 1 (deve voltar vazio, se a prévia começou zerada)
WITH RECURSIVE n(etapa) AS (SELECT 1 UNION ALL SELECT etapa + 1 FROM n WHERE etapa < 14)
SELECT n.etapa, COALESCE(c.total, 0) AS total
FROM n LEFT JOIN contagem c ON c.evento = 'etapa' AND c.etapa = n.etapa AND c.versao = 'v19'
WHERE COALESCE(c.total, 0) <> 1;

-- 3) a tabela só tem estas cinco colunas (dia, versao, evento, etapa, total)
PRAGMA table_info(contagem);

-- 4) os testes manuais com curl (versão v0)
SELECT versao, evento, etapa, total FROM contagem WHERE versao = 'v0';
```
Esperado com a prévia zerada, o roteiro B e **uma** passagem pelo roteiro C: `v19` com `visita 1`, `inicio 1`, `etapa 1` a `14` com 1 cada, `conclusao 1`, `oferta 1`, `checkout 1`; `v1` com `upsell 1` e `downsell 1`; `v0` com `etapa 3 = 1` (o curl de 204). Uma segunda janela anônima soma +1 em cada um, como esperado.

Depois, limpe os testes **só na prévia**: `DELETE FROM contagem WHERE versao = 'v0';`

### E. O que a prévia não valida
- **Pixel do Meta:** ele só carrega no domínio `oalemdacaneta.com.br` (de propósito, para a prévia não sujar os dados). Na prévia ele **não** aparece, e isso é o esperado. A conferência do Pixel é no domínio oficial, depois da publicação (ou hoje, na produção atual, que já tem o Pixel).
- **Compra, upsell e downsell de 1 clique:** dependem de uma compra real na Kiwify. Não fazem parte deste teste.

Se algum item de B, C ou D não bater, não publique: me mande o resultado.

## Limite de pedidos (rate limiting)

**Por que é necessário:** a validação garante que só entram eventos da lista, mas qualquer pessoa pode mandar pedidos válidos (o `Origin` é fácil de imitar fora do navegador). Sem limite, alguém poderia inflar `etapa 14`, `oferta` ou `checkout` e fazer o funil parecer melhor ou pior do que é. Não há risco de vazar dados (a tabela só tem totais), mas há risco de decisão errada com números falsos.

**Recomendação:** uma regra de **Rate limiting** no WAF da zona `oalemdacaneta.com.br`:
- Painel › o domínio `oalemdacaneta.com.br` › **Security** › **WAF** › **Rate limiting rules** › **Create rule**;
- *If incoming requests match*: **URI Path** *equals* `/api/contagem`;
- *With the same characteristics*: **IP**;
- *When rate exceeds*: **30 requests** per **10 seconds**;
- *Then take action*: **Block**, por 10 segundos (ou o mínimo que o seu plano permitir).

Uma pessoa real manda no máximo 19 pedidos na sessão inteira, espalhados por minutos; 30 em 10 segundos só acontece com automação. Confira no painel os limites do seu plano (número de regras, períodos e características disponíveis).

**Limitações:**
- regras do WAF valem para o **domínio próprio**. A URL `*.pages.dev` (prévias e o endereço `projeto.pages.dev` de produção) não passa por elas. Para fechar essa porta depois, dá para redirecionar `projeto.pages.dev` para `oalemdacaneta.com.br` (Bulk Redirects da Cloudflare);
- a regra usa o IP dentro da Cloudflare, sem passar nada para a tabela `contagem`;
- mesmo com limite, muitos IPs diferentes ainda conseguem inflar devagar. Compare sempre com `inicio` e com as vendas da Kiwify; saltos estranhos (por exemplo, `etapa 14` maior que `etapa 13`) indicam contagem artificial.

**Cotas do plano gratuito:** cada pedido para `/api/contagem` conta como uma execução de Function e uma escrita no D1. Uma sessão completa gera até 21 pedidos. Confira os limites diários atuais de Functions e de escrita do D1 no seu plano; se forem atingidos, só o contador para de gravar naquele dia: as páginas são estáticas e continuam no ar.

## Observabilidade

- A função não escreve logs (`console.log`) e não devolve detalhes de erro.
- Para investigar um problema, use as métricas do projeto (Pages › Functions: contagem de pedidos e erros) e as respostas HTTP do roteiro B. Evite ligar logs persistentes (Workers Logs / Logpush) para este endpoint: eles guardariam metadados técnicos dos pedidos, como IP e cabeçalhos, que a aplicação decidiu não guardar.
- `wrangler pages deployment tail` mostra pedidos em tempo real, inclusive metadados técnicos; use só para depurar, por pouco tempo, e não salve a saída.

## `InitiateCheckout` em dobro no Meta (não alterado nesta etapa)

Hoje o quiz manda `InitiateCheckout` ao clicar em comprar, e a Kiwify (com o Pixel configurado no produto) manda outro quando o checkout abre. Cada compra iniciada pode estar contando duas vezes.

**Como verificar:**
1. Instale a extensão **Meta Pixel Helper** no Chrome.
2. No domínio oficial (produção atual), percorra o quiz até o resultado e clique em comprar.
3. Na página do quiz, o Pixel Helper mostra `InitiateCheckout` saindo de `oalemdacaneta.com.br`.
4. Na página da Kiwify (sem pagar), o Pixel Helper mostra outro `InitiateCheckout`, saindo de `pay.kiwify.com.br`.
5. Em paralelo, no **Gerenciador de Eventos** › o Pixel › **Testar eventos**, os dois aparecem com URLs diferentes. Em **Visão geral**, compare os totais de `InitiateCheckout` com os cliques de `checkout` do contador no mesmo dia: se o Meta mostrar perto do dobro, a duplicação está confirmada.

**Recomendação para depois (separada desta entrega):**
- trocar, no quiz, o `track('InitiateCheckout', …)` por um evento personalizado (por exemplo `QuizCheckout`, com `trackCustom`), deixando o `InitiateCheckout` só com a Kiwify, que só conta quem realmente chegou ao checkout;
- **não muda a medição de compras:** o `Purchase` vem só da Kiwify e continua igual;
- antes de trocar, veja se algum conjunto de anúncios está otimizando para `InitiateCheckout` ou usa público com esse evento: o volume vai cair (porque deixa de ser duplicado), o que pode reiniciar o aprendizado. Faça a troca num momento planejado e marque a data para comparar os relatórios;
- o contador (`checkout`) continua medindo os cliques no quiz, independente do Meta.

## Ver os números

`contador/consultas.sql` tem consultas prontas para o Console do D1: funil de uma versão com % sobre o início, abandono etapa a etapa, totais por dia e comparação entre versões. Troque as datas e a versão nas cláusulas `WHERE`. Compare só linhas da mesma `versao`.

## Testes automáticos

- `npm run test:contador`: a função com um D1 falso. Eventos válidos e inválidos, etapas fora de 1–14, campos a mais, versão, métodos, origem, tipo de conteúdo, tamanho (inclusive sem `Content-Length`), texto inválido, banco ausente e com falha.
- `npm run test:quiz`: o quiz no jsdom manda cada evento uma vez (mesmo voltando), só com `e`, `n` e `v`, sem respostas; com o contador fora do ar o quiz vai até o fim; o Pixel continua com `init`, `PageView` e `InitiateCheckout`; o checkout repassa UTMs e `fbclid`.
