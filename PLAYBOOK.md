# Playbook: funil de quiz para um infoproduto

Passo a passo para repetir com outro produto o que foi feito no "Além da Caneta": quiz de venda implícita, página de oferta, checkout na Kiwify, upsell e downsell, Pixel do Meta, contador próprio do funil na Cloudflare e política de privacidade. No fim há um **prompt pronto** para começar um projeto novo com o Claude.

Ordem recomendada: estratégia → quiz → oferta → checkout → privacidade → medição → testes → publicação → acompanhamento. Não pule a estratégia: ela define todo o texto.

---

## 0. O que você precisa ter antes

| Conta / item | Para quê |
| --- | --- |
| GitHub (repositório novo) | guardar o código; cada mudança vira um pull request |
| Cloudflare (Pages + D1 + domínio) | hospedar o site, guardar as contagens, proteger com WAF |
| Domínio próprio apontado para a Cloudflare | Pixel e WAF só funcionam no domínio oficial |
| Kiwify (produto, checkout, upsell/downsell, order bumps) | vender |
| Meta Business (Pixel) | medir anúncios |
| Material do produto: capas, nomes dos módulos, preço, garantia, dados reais de prova social | texto da oferta |
| E-mail de contato e nome do responsável (LGPD) | política de privacidade |

---

## 1. Estratégia do funil (antes de escrever qualquer código)

1. **Avatar e dor principal:** quem compra, o que sente, o que já tentou. Ex.: mulher que usa caneta emagrecedora, come pouco, perde músculo, "a barriga não sai".
2. **Venda implícita:** o quiz **não pode parecer venda** até a última página. Antes dela: nada de "plano", "receitas", produto ou preço. Primeiro a consciência do problema, depois a da solução, e só no fim a oferta.
3. **Ordem psicológica das telas** (a que usamos):
   1. gancho emocional (autoestima, espelho) com o primeiro clique já na capa;
   2. idade, com cartões com foto;
   3. situação (há quanto tempo usa o produto ou a condição);
   4. dor principal escolhida (tipos de barriga), usada nos textos seguintes;
   5. desejo ("como você quer que fique");
   6. por que não resolve: estudo e matéria de imprensa como fonte, sem link clicável;
   7. sintomas (múltipla escolha);
   8. hábito, que define o perfil;
   9. "você está no caminho certo": % da faixa de idade, **só com dado real**;
   10. medidas (ex.: peso e altura com IMC ao vivo);
   11. espelho personalizado: devolve o que a pessoa disse + áudio do especialista;
   12. solução (troca concreta);
   13. tempo disponível;
   14. microcompromisso ("você tentaria por 21 dias?");
   15. carregamento;
   16. resultado com a oferta.
4. **Regras de conteúdo que não se negociam:**
   - não prometer resultado numérico nem prazo;
   - não inventar especialista, depoimento, número de alunos nem porcentagem; os campos ficam vazios até haver dado real;
   - estudos citados com autor e ano;
   - aviso de material educativo e "não substitui o profissional";
   - em saúde: nada sobre dose, troca ou suspensão de medicamento.
5. **Tom:** emocional e direto, linguagem simples, português do Brasil.

> Registre tudo isso num `CLAUDE.md` na raiz do repositório: o Claude lê esse arquivo em toda sessão e segue as regras.

---

## 2. O quiz (`quiz/index.html`)

Um arquivo só, com HTML, CSS e JavaScript, sem etapa de build. A pasta `quiz/` é o que vai para o ar.

- **`CONFIG`** (topo do arquivo): quase tudo que muda de um produto para outro está aqui:
  - `marca`, `produto`, `preco`, `parcelas`, `precoDe`;
  - `checkoutUrl`, `pixelId`, `dominio`, `contadorUrl`, `privacidadeUrl`, `garantiaDias`;
  - prova social, fotos (`imagens`), `audio` e `audioVenda`, `materia` (print da imprensa);
  - `entregaveis`, `materiais`, `ganhos`, `bonus`.
- **`STEPS`**: a ordem das telas. Cada opção tem `v` (o código da resposta) e `ic` (o ícone, em SVG; não use emoji).
- **Identidade visual:** descreva cores, fontes e símbolo num `DESIGN.md` antes de mexer no CSS. Fundo branco, uma cor de destaque (no nosso caso, terracota) para o botão e o "plano pronto".
- **Mídias:** comprimir antes de colocar:
  - fotos em WebP com 600–900 px;
  - vídeo em MP4 540p com faststart;
  - áudio em MP3 mono 64 kbps.
- **Aba do navegador:** título curto ("Teste • Marca") e ícone (favicon) com o símbolo da marca.
- **Prévia:** testar sempre em largura de celular (~390 px).

## 3. A página de oferta (última tela do quiz)

1. "O seu plano exclusivo está pronto", num bloco de cor de destaque.
2. Comparativo "Como está hoje / Com o plano certo".
3. Áudio curto e foto do objetivo.
4. Perfil, objetivo e pontuação do teste. É "pontuação", **não** diagnóstico, e precisa ter legenda.
5. Dia 1 de exemplo, personalizado pelas respostas.
6. **O que ela recebe:** capas reais dos materiais. Cada item com o nome, **a situação em que ela vai usar** e **o que muda pra ela**, e o selo "Para o seu perfil" quando bate com as respostas. Os materiais extras passam em fila animada.
7. Lista "Com o plano completo, você vai…" em resultados, sem prometer números.
8. **Caixa de compra:**
   - cada material numa caixa com capa e check;
   - valor total riscado;
   - "% OFF hoje";
   - **parcelado em destaque** (ex.: 6x de R$ 4,65), com o valor à vista embaixo;
   - garantia e formas de pagamento.
9. **Barra fixa de compra**, que aparece a partir da foto do objetivo.
10. Perguntas frequentes e o aviso de material educativo, com o link da política.

> Confira na Kiwify se o parcelamento mostrado existe de verdade no checkout, com o mesmo número de parcelas e sem juros.

## 4. Checkout, upsell, downsell e order bump (Kiwify)

1. **Checkout:** cole o link do produto em `CONFIG.checkoutUrl`. O quiz repassa sozinho as UTMs e o `fbclid`.
2. **Order bumps:** são configurados **dentro do checkout da Kiwify**. Não são páginas.
3. **Upsell** (`quiz/upsell/index.html`) e **downsell** (`quiz/downsell/index.html`):
   - gere o código no gerador de upsell da Kiwify, um para cada página;
   - cole no lugar marcado sem mudar ids nem o script; mude só o visual dos botões;
   - no upsell, a recusa leva ao endereço do downsell (`https://seudominio/downsell/`);
   - na Kiwify, o destino depois da compra é `https://seudominio/upsell/`.
4. **Não exiba na oferta** materiais que são order bump ou upsell, para não parecer que já vêm no produto.
5. **Teste com uma compra real e reembolso**, com um e-mail diferente a cada vez, para validar o 1 clique.

## 5. Privacidade (LGPD): `quiz/privacidade.html`

- **Descreva só o que está ativo:**
  - as respostas ficam no navegador e não são guardadas;
  - a contagem é somada e sem cookies;
  - o Pixel do Meta recebe só eventos neutros, nunca respostas;
  - Cloudflare (hospedagem) e Kiwify (pagamento).
- **Dados de saúde:** consentimento específico, com uma linha no início do quiz e o link da política.
- **Dados do responsável:** nome e e-mail. CNPJ e CPF não são obrigatórios na política.
- **Revisão:** de preferência por um advogado. Avalie um aviso de cookies.

## 6. Medição

### 6.1 Pixel do Meta
- O ID fica em `CONFIG.pixelId`. O Pixel só carrega no domínio oficial (`CONFIG.dominio`), para a prévia e os testes não sujarem os dados.
- Eventos com nomes neutros: `QuizInicio`, `QuizEtapa {etapa}`, `QuizCompleto`, `ViewContent`. **Nenhuma resposta vai para o Meta.**
- Upsell e downsell: só o `PageView`.
- **Cuidado:** se o Pixel também estiver na Kiwify, ela já manda `InitiateCheckout` e `Purchase`. Não duplique o `InitiateCheckout` no quiz; use um evento personalizado (ex.: `QuizCheckout`).

### 6.2 Google Analytics: não usar em produto de saúde
As regras do Google proíbem que o Analytics receba dados que revelem informação sensível. Num site de saúde, o simples avanço no quiz, ligado ao cookie do GA4, já é sensível. Use o contador próprio (6.3). Para visitas e origem do tráfego, use o **Cloudflare Web Analytics**, que não usa cookies.

### 6.3 Contador próprio do funil (Cloudflare Pages + D1)
Arquivos para copiar como estão:
- `functions/api/contagem.js`;
- `contador/esquema.sql`, `contador/consultas.sql` e `contador/README.md`;
- `testes/testar-contador.js`.

- **Contrato:** o navegador manda só `{"e": evento, "n": etapa, "v": versão}`.
  - Eventos: `visita`, `inicio`, `etapa` (1 a N), `conclusao`, `oferta`, `checkout`, `upsell`, `downsell`.
  - A tabela guarda só `dia`, `versao`, `evento`, `etapa` e `total`. Nenhum dado pessoal.
- **No quiz:** a função `conta()`, uma vez por aba (`sessionStorage`), por `sendBeacon`, sem esperar resposta. Ela é chamada na abertura, no 1º clique, em cada etapa (ao chegar), no fim do carregamento, na oferta e no clique de compra.
- **Se o quiz tiver outro número de etapas:** mude `ETAPAS` na função, o `CHECK` do esquema (`BETWEEN 1 AND N`) e os testes.
- **A cada mudança no quiz:** suba a `VERSAO` no `index.html` (`v19` → `v20`). Assim dá para comparar versões.

**Configuração na Cloudflare (Pages):**
- Root directory **vazio**, Build output **`quiz`**, Build command **vazio**, Production branch **`main`**.
- A pasta `functions/` fica na **raiz** do repositório, nunca dentro de `quiz/`.

**Passo a passo no painel** (feito uma vez):
1. **Storage & databases › D1 › Create:** `produto-contagem-previa` (teste) e `produto-contagem` (produção).
2. **Em cada banco, aba Console:** cole o esquema **numa linha só** (a caixa do Console é de uma linha) e execute. Confira com:
   `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'contagem';`
3. **Workers & Pages › projeto › Settings:** o seletor de ambiente fica **no alto, à direita** (Production/Preview).
   - **Preview:** Bindings › Add › D1 › variável `DB` → banco de teste.
   - **Production:** Bindings › Add › D1 › variável `DB` → banco de produção.
   - **Confira os dois.** Foi aqui que erramos: o banco de teste estava ligado à produção.
4. **Publique de novo depois de configurar os bindings:** um novo push, ou Retry deployment. O binding só vale para publicações feitas depois dele.
5. **WAF** (domínio › Security › Security rules › Create rule › Rate limiting):
   - URI Path *equals* `/api/contagem`;
   - IP;
   - 30 pedidos em 10 segundos;
   - Block por 10 segundos.

**Validação:**
- **Prévia:** pelo Console do navegador, mande 21 eventos válidos (versão `v0`, esperado 204) e 8 inválidos (esperado 400/405/413/415). Confira no D1 de teste e apague com `DELETE FROM contagem WHERE versao = 'v0';`.
- **Produção:** abra o site numa janela anônima, responda algumas etapas e rode `SELECT evento, etapa, total FROM contagem WHERE versao = 'vN';` no banco de produção.
- **WAF:** 35 pedidos inválidos seguidos devem dar 400 até o 30º e **429** depois.

**Ver o funil:** Console do D1 de produção, com as consultas de `contador/consultas.sql` (funil com % sobre o início, abandono etapa a etapa, por dia). São **ocorrências, não pessoas**. `checkout` é o clique, não a compra.

---

## 7. Fluxo de trabalho no GitHub (como trabalhamos)

1. Toda mudança é feita numa branch, com `npm test` rodando antes do commit.
2. Pull request com a descrição e um checklist: o que foi testado e o que falta testar.
3. A Cloudflare publica uma **prévia** de cada branch. Teste nela.
4. Só depois da **autorização explícita** o pull request é mesclado na `main`, o que publica em produção.
5. Depois de publicar, faça a conferência rápida em produção.

## 8. Checklist de lançamento

- [ ] `CLAUDE.md` com as regras de conteúdo do produto
- [ ] Quiz completo, testado em 390 px, sem promessas e sem dados inventados
- [ ] Fotos, vídeo e áudio comprimidos
- [ ] Oferta com capas reais, preço, parcelamento que **existe na Kiwify** e garantia
- [ ] `checkoutUrl` certo; UTMs chegam ao checkout
- [ ] Upsell e downsell com o código do gerador; destinos configurados na Kiwify; compra de teste com reembolso
- [ ] Política de privacidade com o que está ativo, nome e e-mail do responsável
- [ ] Pixel no quiz, no upsell e no downsell; sem `InitiateCheckout` duplicado com a Kiwify
- [ ] D1 de teste e de produção, com bindings **separados e conferidos**
- [ ] Prévia validada (204, 400 e gravação no D1 de teste)
- [ ] Publicação autorizada; produção conferida no D1
- [ ] Regra do WAF ativa e testada (429)
- [ ] `npm test` passando

## 9. Erros que já aconteceram (para não repetir)

| Erro | Como evitar |
| --- | --- |
| Tabela não existia (`This query returned no data`) | criar o banco não cria a tabela: rode o esquema em **cada** banco |
| Publicação feita antes do binding | depois de mexer em bindings, publique de novo |
| Binding de teste ligado à produção | conferir os dois ambientes pelo seletor no alto, à direita, antes de mesclar |
| 400 no teste manual | o corpo usa chaves curtas `{e, n, v}`, não `evento`/`versao` |
| Console do D1 recusando o comando | colar o SQL em uma linha só |
| Seletor Preview/Production "sumido" | fica no alto, à direita, em Settings; ou troque `production` por `preview` no endereço |
| `InitiateCheckout` em dobro | quando a Kiwify tem o Pixel, o quiz não manda esse evento padrão |
| Endereço `*.pages.dev` fora do WAF | redirecionar `projeto.pages.dev` para o domínio oficial |

---

## 10. Prompt pronto para um produto novo

Copie, preencha os colchetes e envie numa sessão nova do Claude Code com o repositório novo.

```
Quero replicar o funil do projeto "Além da Caneta" (repositório gabrielfelixback/receitacaneta,
arquivo PLAYBOOK.md) para um novo produto. Leia o PLAYBOOK.md inteiro antes de começar e siga
a mesma arquitetura, as mesmas regras e o mesmo fluxo de trabalho.

Produto:
- Nome/marca: [ ]
- Público e dor principal: [ ]
- Solução que o produto entrega: [ ]
- Preço: R$ [ ] | preço "de": R$ [ ] | parcelas sem juros na Kiwify: [ ]
- Garantia: [ ] dias
- Materiais do produto principal (nome, para que situação serve, o que muda): [ ]
- Order bumps (não exibir na oferta): [ ]
- Upsell e downsell (nome, preço, conteúdo): [ ]
- Link do checkout Kiwify: [ ]
- ID do Pixel do Meta: [ ]
- Domínio: [ ]
- Responsável e e-mail para a política de privacidade: [ ]
- Dados reais de prova social (só se existirem): [ ]
- Regras de conteúdo específicas do nicho (o que nunca prometer/dizer): [ ]
- Identidade visual (cores, fontes, símbolo) ou referências: [ ]
- Número de etapas do quiz: [ ]

Como trabalhar:
1. Comece pela estratégia: proponha a ordem das telas e os textos antes de programar.
2. Crie CLAUDE.md e DESIGN.md com as regras e a identidade.
3. Construa quiz/, a oferta, upsell/downsell e a política seguindo o PLAYBOOK.
4. Copie o contador (functions/api/contagem.js, contador/, testes/testar-contador.js),
   ajustando o número de etapas e os nomes dos bancos (<produto>-contagem e <produto>-contagem-previa).
5. Não use GA4 se o produto for de saúde. Pixel só com eventos neutros e sem duplicar o
   InitiateCheckout da Kiwify.
6. Trabalhe numa branch, rode npm test, abra PR e só mescle com minha autorização explícita.
7. Me guie no painel da Cloudflare passo a passo (D1, bindings Preview/Production separados,
   republicar, WAF) e valide na prévia antes da produção.
8. Não invente resultados de testes nem dados de prova social.
```
