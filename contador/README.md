# Contador do funil

Mede o abandono do quiz com **contagens agregadas**: quantas vezes cada passo aconteceu, por dia e por versão. Não usa GA4 nem o backend Supabase.

## O que é contado

| Evento | Quando | Onde |
| --- | --- | --- |
| `visita` | o quiz abriu | `quiz/index.html` |
| `inicio` | primeiro clique na primeira pergunta | `quiz/index.html` |
| `etapa` (1 a 14) | chegou na etapa (alcance, não resposta) | `quiz/index.html` |
| `conclusao` | terminou o carregamento depois da etapa 14 | `quiz/index.html` |
| `oferta` | o resultado com a oferta apareceu | `quiz/index.html` |
| `checkout` | clicou para ir à Kiwify (qualquer um dos 3 botões) | `quiz/index.html` |
| `upsell` | a página de upsell abriu | `quiz/upsell/index.html` |
| `downsell` | a página de downsell abriu | `quiz/downsell/index.html` |

A etapa 1 é a primeira pergunta, que já aparece na abertura; por isso `etapa 1` ≈ `visita`. O `inicio` (primeiro clique) é a base mais confiável para medir abandono, porque robôs raramente clicam.

**Os números são ocorrências, não pessoas únicas.** Dentro da mesma aba cada evento conta uma vez (voltar e avançar não conta de novo). A mesma pessoa em outra aba, outro navegador ou outro dia conta outra vez. `checkout` é o clique para ir à Kiwify, não a compra: a compra é medida pela Kiwify.

## Privacidade: o que fica guardado e o que não fica

- **Vai do navegador para o contador:** `{"e": "etapa", "n": 7, "v": "v19"}` (evento, etapa quando houver, versão). Nada mais.
- **Fica guardado no D1:** só a tabela `contagem` com `dia`, `versao`, `evento`, `etapa` e `total`. O dia é calculado no servidor, no horário de Brasília.
- **Não é lido nem guardado pela aplicação:** respostas do quiz, idade, peso, altura, sintomas, medicamentos, perfil, IP, navegador, cookies, identificador de pessoa, origem da visita, UTMs ou URL.
- **O que a infraestrutura da Cloudflare processa:** como em qualquer site, a Cloudflare recebe os dados técnicos da conexão (IP, tipo de navegador etc.) para entregar as páginas e proteger o site, segundo a política dela. A função do contador não lê nem grava esses dados, mas eles existem na camada de hospedagem. Uma regra de limite de pedidos no WAF (passo 6 abaixo) usa o IP dentro da Cloudflare, sem passar para a nossa tabela.
- **No navegador:** para não repetir a contagem, a aba anota em `sessionStorage` (`contagem:etapa:7` etc.) o que já foi contado. Não é cookie, não é enviado e some ao fechar a aba.

## Segurança

`functions/api/contagem.js`:
- só aceita `POST` (outros métodos: 405);
- só aceita pedido da própria página: `Origin` igual ao host, ou `Sec-Fetch-Site: same-origin` (outros: 403);
- corpo de até 128 bytes (maior: 413);
- JSON com exatamente `e`, `v` e, só para `etapa`, `n`; evento de uma lista fechada; `n` inteiro de 1 a 14; versão no formato `v` + número. Qualquer outra coisa: 400 e nada gravado;
- sem o binding `DB`: 503; erro do banco: 500 sem detalhes. O quiz não espera a resposta, então nada disso trava a navegação;
- não registra o pedido em log.

Proteção contra envio abusivo: a validação impede gravar qualquer coisa fora da lista, mas alguém ainda pode inflar os totais mandando pedidos válidos. Para reduzir isso, crie a regra de limite de pedidos do passo 6. Se os números parecerem estranhos (por exemplo, `etapa 14` maior que `etapa 13`), compare com `inicio` e com as vendas da Kiwify.

## Configurar na Cloudflare (uma vez)

Configurações do Pages confirmadas: Root directory vazio, Build output directory `quiz`, Build command vazio, Production branch `main`. Com isso, a pasta `functions/` na raiz do repositório vira a rota `/api/contagem`, e `quiz/` continua sendo o site publicado.

1. **Banco de produção.** Painel da Cloudflare › Workers e Pages › D1 SQL Database › Create › nome `quiz-contagem`.
2. **Banco de prévia.** Mesmo caminho › nome `quiz-contagem-previa`. Assim os testes nas prévias não se misturam com os números reais.
3. **Esquema nos dois.** Abra cada banco › Console › cole o conteúdo de `contador/esquema.sql` › Execute. Pode rodar de novo sem apagar nada.
   Pela linha de comando (opcional): `npx wrangler d1 execute quiz-contagem --remote --file contador/esquema.sql` e o mesmo com `quiz-contagem-previa`.
4. **Bindings no Pages.** Projeto do Pages › Settings › Bindings › Add › D1 database:
   - **Production:** variável `DB` → banco `quiz-contagem`;
   - **Preview:** variável `DB` → banco `quiz-contagem-previa`.
5. **Nova publicação.** O binding só vale para publicações feitas depois dele. Depois de salvar, faça uma nova publicação (um novo push na branch, ou Deployments › ⋯ › Retry deployment na última publicação).
6. **(Recomendado) Limite de pedidos.** Security › WAF › Rate limiting rules › Create: se *URI Path* igual a `/api/contagem`, com a mesma característica de IP, mais de 30 pedidos em 10 segundos → Block. Uma pessoa real manda no máximo 19 pedidos na sessão inteira.

Não existe `wrangler.toml` no repositório de propósito: os bindings ficam no painel. Se um dia criar esse arquivo, ele passa a mandar nos bindings no lugar do painel.

## Validar (prévia antes de produção)

A simulação local e os testes automáticos não provam que a publicação real funciona. Valide na prévia:

1. Abra o pull request (ou faça push da branch) e espere a prévia `https://<branch>.<projeto>.pages.dev`.
2. Na prévia, confira:
   - `https://…pages.dev/functions/api/contagem.js` **não pode mostrar o código da função**. O normal é a Cloudflare devolver a página do quiz, que é o que ela faz para qualquer endereço que não existe, ou um 404;
   - abrir `https://…pages.dev/api/contagem` no navegador (GET) → **405**.
3. Percorra o quiz inteiro na prévia, numa aba anônima, até clicar em comprar. Abra também `/upsell/` e `/downsell/`.
4. No D1 `quiz-contagem-previa` › Console: `SELECT evento, etapa, total FROM contagem ORDER BY evento, etapa;`
   Esperado: `visita 1`, `inicio 1`, `etapa 1…14` com 1 cada, `conclusao 1`, `oferta 1`, `checkout 1`, `upsell 1`, `downsell 1`.
5. Confira que a mesma aba, voltando e avançando, **não** aumentou nenhum total. Uma aba anônima nova soma +1 em cada um.
6. Confira que o quiz, as fotos, o vídeo, o áudio, o botão da Kiwify e o Pixel (Pixel Helper, no domínio oficial) continuam normais.
7. Só então, com a sua autorização, mescle na `main`. Repita o passo 3 uma vez no domínio oficial e confira no `quiz-contagem`.

## Ver os números

`contador/consultas.sql` tem consultas prontas para o Console do D1: funil de uma versão com % sobre o início, abandono etapa a etapa, totais por dia e comparação entre versões. Troque as datas e a versão nas cláusulas `WHERE`. Compare só linhas da mesma `versao` (a `VERSAO` do `quiz/index.html` muda a cada alteração do quiz; upsell e downsell usam `v1`).

## Testes

- `npm run test:contador`: a função com um D1 falso (eventos válidos e inválidos, etapas fora de 1–14, campos a mais, método, origem, tamanho, banco ausente e com falha).
- `npm run test:quiz`: o quiz no jsdom manda cada evento uma vez (mesmo voltando), só com `e`, `n` e `v`, sem respostas; com o contador fora do ar o quiz vai até o fim; o Pixel continua com `init`, `PageView` e `InitiateCheckout`.
