# Playbook completo: do zero ao funil no ar

A história inteira do "Além da Caneta", da primeira linha de código ao contador funcionando em produção, organizada para **repetir com outro produto**. Cada fase traz:
- **o que foi pedido** (o tipo de prompt que você manda);
- **o que foi feito**;
- **as decisões que importam**;
- **como replicar**.

No fim estão o checklist, os erros que já aconteceram e um **prompt mestre** para começar um produto novo.

Linha do tempo real: 22/10 → 24/10/2026, cerca de 40 commits e 10 pull requests.

---

## Visão geral da arquitetura final

```
GitHub (repositório)                       Cloudflare
├── quiz/            ← o site publicado    Pages: build output = quiz, branch main = produção,
│   ├── index.html   (quiz + oferta)              outras branches = prévia
│   ├── privacidade.html                   D1: <produto>-contagem (produção)
│   ├── upsell/  downsell/                     <produto>-contagem-previa (prévia)
│   └── img/ video/ audio/                 WAF: limite de pedidos em /api/contagem
├── functions/api/contagem.js  ← contador (Pages Function)
├── contador/   (esquema.sql, consultas.sql, README)
├── testes/     (quiz no jsdom + contador)  Kiwify: checkout, order bumps, upsell/downsell 1 clique
├── backend/    (Supabase, desligado)       Meta: Pixel no site e na Kiwify
├── anuncios/criativos-meta.md
├── CLAUDE.md  DESIGN.md  README.md
```

---

## FASE 0 — Preparação (antes do primeiro prompt)

Tenha em mãos:
- **Produto:** nome, promessa, para quem é, materiais (nomes, capas), preço, garantia.
- **Referência:** um funil de quiz concorrente que você queira imitar no formato (prints de cada tela, se o site bloquear o acesso).
- **Identidade:** logo, cores, fontes (ou o projeto de marca).
- **Contas:**
  - GitHub, com um repositório vazio;
  - Cloudflare, com o domínio comprado e os DNS na Cloudflare;
  - Kiwify, com o produto criado;
  - Meta Business, com o Pixel criado.

**Hospedagem (uma vez):** em Cloudflare › Workers & Pages › Create › Pages › conectar o repositório do GitHub:
- Production branch: `main`;
- Build command: vazio;
- Build output directory: `quiz`;
- Root directory: vazio.

Depois, em **Custom domains**, adicione o domínio. Cada push na `main` publica o site, e cada outra branch gera uma prévia `*.pages.dev`.

---

## FASE 1 — Primeira versão: quiz + backend (22/10, manhã)

**Pedido:** "Crie um quiz para vender [produto] para [público], com tráfego do Meta. Deixe a pessoa consciente do problema e da solução e só no fim mostre a oferta."

**Feito:**
- `quiz/index.html` num arquivo só (HTML, CSS e JS, sem build), com `CONFIG` (conteúdo e preços) e `STEPS` (a ordem das telas).
- Backend no Supabase para guardar o funil.
- Testes no jsdom (`testes/testar-quiz.js`) percorrendo todas as telas.

**Decisão que mudou depois:** o backend do Supabase guardava as respostas por sessão. Mais tarde ele foi **desligado** (`CONFIG.backendUrl` vazio) e trocado por um contador somado, sem dados pessoais (Fase 19). **Num projeto novo, pule o Supabase** e vá direto para o contador.

**Replicar:** peça o quiz com `CONFIG` e `STEPS` separados, para trocar conteúdo sem mexer na lógica, e com os testes do jsdom desde o começo.

---

## FASE 2 — Identidade visual (22/10)

**Pedido:** "Use a identidade da marca [nome]: logo, cores e fontes. Ilustrações em SVG. Fundo branco, sem mudar a identidade."

**Feito:**
- `DESIGN.md` com cores, fontes e o símbolo (a cápsula), além das regras: ícones SVG de traço, nada de emoji como ícone.
- Fundo branco, uma cor de destaque (terracota) e títulos em serifa com palavra-chave em itálico.
- Testes visuais com prints em largura de celular (390 px).

**Replicar:** mande o manual da marca ou prints e peça um `DESIGN.md` antes de qualquer CSS.

---

## FASE 3 — Formato da referência e venda implícita (22/10)

**Pedidos:**
- "Siga o formato desta referência [link ou prints], com a mesma linha e outra identidade."
- "Venda implícita: até a última página, nada pode parecer venda. Nada de 'plano', 'receitas', produto ou preço."
- "Menos perguntas, rápido e de alta conversão. Inclua as páginas intermediárias ('você está no caminho certo')."

**Feito:**
- Telas no formato da referência, com telas de "quebra" entre as perguntas.
- O primeiro clique já na capa.
- Nenhuma menção ao produto antes do resultado.

**Replicar:** mande a referência e a regra da venda implícita logo no primeiro pedido, e registre no `CLAUDE.md`.

---

## FASE 4 — Abertura emocional, dor e criativos (22/10)

**Pedidos:**
- "A primeira página precisa ser impactante e emocional, na autoestima."
- "Uma página com todos os tipos de barriga."
- "Use as skills de copy, design e anúncios."
- "Quero nesse nível de apelação."

**Feito:**
- **Abertura:** "o que você sente quando se olha no espelho" (vergonha, raiva, não me reconheço, nem me olho).
- **Dor escolhida:** tipos de barriga (pochete, pneuzinho, alta, flácida), usados nos textos seguintes.
- **Desejo:** "como você quer que a barriga fique".
- **O espelho no resultado:** devolve o que a pessoa disse sentir.
- **Criativos do Meta:** `anuncios/criativos-meta.md`, com ângulos casados com a abertura do quiz.

**Replicar:** dor emocional na tela 1, dor concreta escolhida (usada depois nos textos), desejo, e os criativos já escritos junto com o quiz.

---

## FASE 5 — Tema de alta conversão e microajustes de título (22/10, tarde)

**Pedidos (vários, curtos):**
- "Fundo branco, fonte melhor."
- "O card de plano exclusivo está feio."
- "Mostre o preço como desconto (de R$ 249 por R$ 27,90)."
- "Deixe os benefícios explícitos."
- "Anime o rodapé fixo com o preço."
- "Coloque 'O TESTE' acima da logo e o número da página."
- "Destaque 'a barriga não sai?' em negrito, com fundo vermelho."

**Feito:**
- Títulos pesados e destaques em vermelho.
- Número da página no topo, sem o total.
- Oferta com valor riscado e rodapé fixo animado.

**Replicar:** faça uma rodada de ajustes tela a tela, com prints. Peça uma mudança por item e confira na prévia.

---

## FASE 6 — Backend revisado (22/10)

**Pedido:** "Revise o backend e veja se está pronto para o deploy."

**Feito:** corrigida uma condição de corrida, funil por tela e por versão, e README de deploy. Esse backend acabou não sendo usado (ver Fase 1).

---

## FASE 7 — Fotos, vídeo e áudio reais (22–23/10)

**Pedidos:**
- "Coloque estas fotos nas idades, nos tipos de barriga, na barriga desejada e na caneta."
- "Coloque este vídeo na primeira página."
- "Este áudio na página 11."

**Feito:**
- Fotos em `quiz/img/`, comprimidas em WebP de 600–900 px. Ficam em `CONFIG.imagens`; vazio = ilustração.
- Vídeo da abertura em MP4 540p (faststart), com capa e o botão "Toque para ouvir".
- Áudio em MP3 mono 64 kbps, com player estilo WhatsApp e play pulsando.
- Uma foto do objetivo no lugar do "antes e depois" ilustrado.

**Replicar:** mande as mídias na conversa e peça a compressão. Mídia pesada derruba a conversão no 4G.

---

## FASE 8 — Compromisso e movimento (22/10)

**Pedido:** "Mude o compromisso para 21 dias e coloque mais movimento na última página."

**Feito:**
- Microcompromisso: "Se existisse um jeito de [desejo], você tentaria por 21 dias?", com "Sim" em destaque.
- Entrada animada dos blocos e o preço caindo até o valor final.

---

## FASE 9 — Prova social com dado real (23/10)

**Pedidos:**
- "Card de prova na página da idade."
- "Estes são os dados reais da pesquisa com as alunas."

**Feito:**
- Uma ferramenta (`ferramentas/prova_da_base.py`) que gera os percentuais a partir de uma planilha real. Ela recusa planilha marcada como simulação.
- Os percentuais por faixa ficaram fixos no código (`PROVA_IDADE`), informados pelo dono.

**Decisão:** nunca inventar número de prova social. Planilha simulada não entra. O campo fica vazio até haver dado real.

---

## FASE 10 — Política de privacidade (LGPD) (23/10)

**Pedidos:**
- "Crie a página de política de privacidade."
- "Não quero CNPJ nem CPF no texto."

**Feito:**
- `quiz/privacidade.html`, com o mesmo visual do site.
- Aviso de consentimento na primeira tela (dados de saúde) e link no rodapé do resultado.
- Os dados do responsável num bloco `EMPRESA`, só com nome e e-mail. CNPJ e CPF não são obrigatórios na política.
- Revisada na Fase 19 para descrever **só o que está ativo**.

**Replicar:** peça a política logo que souber o que o site coleta, e revise toda vez que a coleta mudar.

---

## FASE 11 — Kiwify: checkout, upsell, downsell e order bump (23/10)

**Pedidos:**
- "Teremos down sell, upsell e order bump. Faço por aqui?"
- "Aqui está o link da Kiwify."
- "Aqui estão os códigos HTML do upsell e do downsell."

**Feito:**
- `CONFIG.checkoutUrl` com o link do checkout. O quiz repassa as UTMs e o `fbclid` sozinho.
- Páginas `quiz/upsell/` e `quiz/downsell/` no visual da marca, com os códigos de 1 clique da Kiwify colados sem mudar ids nem o script; só o visual dos botões mudou.
- A recusa do upsell leva a `/downsell/`. Na Kiwify, o destino depois da compra é `/upsell/`.
- **Order bumps** ficam dentro do checkout da Kiwify. Não são páginas e **não aparecem na oferta**.

**Replicar:** gere um código de upsell para cada página no gerador da Kiwify. Teste com uma compra real e reembolso, usando um e-mail diferente a cada vez.

---

## FASE 12 — Grande rodada da v14 (23/10, noite)

**Pedidos (uma mensagem com vários itens):**
- **Preço:** parcelamento no lugar do valor total.
- **Áudio:** áudio na página de vendas, acima da foto; o áudio da nutricionista na página 11, com o play pulsando.
- **Foto do objetivo:** tirar a legenda "imagem ilustrativa".
- **Imprensa:** o print da matéria da VEJA na página da pesquisa, com a fonte em texto e **sem link**, para não tirar a pessoa da página.
- **Ordem:** levar o "caminho certo" para depois da pergunta do prato, com os novos criativos por faixa de idade.
- **Aba:** ícone e o nome "Teste • Além da Caneta".

**Feito:** tudo isso, com uma versão nova (`VERSAO = 'v14'`) e os testes ajustados à nova ordem.

**Replicar:** faça as rodadas grandes numa mensagem só, com os itens numerados. Peça a nova versão e os testes atualizados.

---

## FASE 13 — Oferta que vende (23/10, noite)

**Pedidos, em três rodadas:**
1. "O quadro de plano pronto em terracota; o botão de compra aparece cedo demais ou tarde demais; capas passando em fila."
2. "As descrições não estão convencendo."
3. "Na caixa de compra, mais ênfase: caixas, algo mais marcado."

**Feito:**
- **Quadro "O seu plano exclusivo está pronto"** na cor de destaque.
- **Barra fixa de compra** aparecendo a partir da foto do objetivo.
- **Capas reais de cada material.** Os 4 livros principais aparecem no topo; os materiais extras passam em **fila animada contínua**.
- **Cada material com três textos:** o nome, **a situação em que ela vai usar** ("Para os dias em que só desce coisa gelada") e **o que muda pra ela**. O selo **"Para o seu perfil"** aparece quando o material bate com as respostas.
- **"Você vai…"** reescrito em resultados, sem prometer números.
- **Caixa de compra:**
  - cada livro numa caixa com capa e check;
  - "+6 materiais" num bloco escuro, com as capas em leque;
  - valor riscado e "% OFF";
  - **6x sem juros** em destaque, com o valor à vista embaixo.

**Replicar:** a parte que mais pesa na conversão é "o que ela recebe" escrito como **situação + ganho + personalização**, com as capas reais.

---

## FASE 14 — Pixel do Meta (24/10)

**Pedido:** "Adicione meu Pixel no site [código]."

**Feito:**
- `CONFIG.pixelId` no quiz e o código padrão no upsell e no downsell.
- O Pixel **só liga no domínio oficial** (`CONFIG.dominio`), para a prévia e os testes não sujarem os dados.
- **Eventos com nomes neutros:** `PageView`, `QuizInicio`, `QuizEtapa {etapa}`, `QuizCompleto`, `ViewContent` e `InitiateCheckout`. **Nenhuma resposta vai para o Meta.**

**Atenção (pendente neste projeto):** a Kiwify, com o Pixel no produto, já manda `InitiateCheckout` e `Purchase`. Num projeto novo, **não mande `InitiateCheckout` pelo quiz**; use um evento personalizado (`QuizCheckout`).

---

## FASE 15 — GA4? Avaliação e decisão (24/10)

**Pedidos:**
- "Quero rastrear as 14 etapas com Pixel e GA4."
- "Avalie as políticas do Google para saúde antes de instalar."

**Decisão: não usar GA4.** As regras do Google proíbem que o Analytics receba dados que revelem informação sensível de saúde, e o GA4 sempre identifica o navegador com um cookie. Num site sobre canetas emagrecedoras, até eventos genéricos de etapa ficam arriscados.

**Alternativa escolhida:** um contador próprio, somado, sem cookies e sem identificadores (Fases 16 a 21). Para visitas e origem do tráfego, existe o Cloudflare Web Analytics, que também não usa cookies.

---

## FASE 16 — Contador próprio do funil (24/10)

**Pedido:** "Implemente o contador somado: visita, início, etapas 1–14, conclusão, oferta, checkout, upsell e downsell. Sem respostas, sem IP, sem cookies."

**Feito:**
- **`functions/api/contagem.js`**: rota `POST /api/contagem`. Fica na **raiz** do repositório, nunca dentro de `quiz/`.
  - **Aceita só:** `{"e": evento, "n": etapa, "v": versão}` (lista fechada, etapa 1–N, versão `vN`).
  - **Recusa:**
    - outro método: 405;
    - outra origem: 403;
    - tipo de conteúdo errado: 415;
    - corpo acima de 128 bytes: 413;
    - qualquer campo a mais: 400.
  - **Grava:** soma +1 por dia (horário de Brasília), versão, evento e etapa.
  - **Sem banco:** 503; **com falha do banco:** 500. Nenhum log.
- **`contador/esquema.sql`**: a tabela `contagem` com regras (CHECK) para os eventos e as etapas.
- **`contador/consultas.sql`**: funil, abandono por etapa, por dia, por versão e validação.
- **No quiz:** a função `conta()` manda cada evento **uma vez por aba** (`sessionStorage`), por `sendBeacon`, sem esperar resposta. Ela nunca trava a navegação.
- **Política de privacidade:** reescrita só com o que está ativo.
- **Testes:**
  - a função, com um banco falso;
  - o quiz completo, conferindo cada evento uma vez, sem respostas e com o Pixel intacto;
  - um teste de **contrato**: tudo o que o quiz manda é aceito pela função.

---

## FASE 17 — Configuração da Cloudflare, passo a passo (24/10)

Feito por você no painel, com a orientação do Claude, uma etapa por vez:

1. **Banco de teste:** Storage & databases › D1 › Create › `quiz-contagem-previa`.
2. **Tabela:** aba **Console** › cole o esquema **numa linha só** (a caixa é de uma linha) › Execute. Confira com:
   ```sql
   SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'contagem';
   ```
   Criar o banco **não** cria a tabela.
3. **Binding de prévia:** projeto › **Settings**. O seletor **Production / Preview** fica **no alto, à direita**. Escolha **Preview** › Bindings › Add › D1 › variável **`DB`** → `quiz-contagem-previa`.
4. **Publicar a prévia de novo:** o binding só vale para publicações feitas **depois** dele. Faça um novo push na branch ou use Deployments › Retry deployment.
5. **Validar a prévia:** no Console do navegador, mande 21 eventos válidos (versão `v0`, esperado **204**) e 8 inválidos (esperado 400/405/413/415). Confira no D1 de teste: 21 linhas com total 1.
6. **Banco de produção:** crie `quiz-contagem` e a tabela da mesma forma.
7. **Binding de produção:** seletor em **Production** › `DB` → `quiz-contagem`.
   - **Confira os dois ambientes.** Neste projeto, o banco de teste tinha ido parar na produção; foi pego antes da publicação e corrigido pelo lápis (editar), sem usar a lixeira.

---

## FASE 18 — Publicação e confirmação (24/10)

1. **Pull request:** com a descrição e o checklist. Rascunho até a produção estar configurada.
2. **Autorização:** "tabela criada, autorizo mesclar e publicar".
3. **Mescla:** a Cloudflare publicou a `main` automaticamente.
4. **Confirmação real:** você abriu o site numa janela anônima, respondeu o quiz e rodou no D1 de produção:
   ```sql
   SELECT evento, etapa, total FROM contagem WHERE versao = 'v19';
   ```
   Apareceram as visitas, o início, as 14 etapas e a oferta.

**Incidente:** um teste manual deu **400**. A causa era o formato: `{"evento": …, "versao": …}` em vez de `{"e": …, "v": …}`. Não era defeito. Viraram testes de regressão e uma seção "Formato do corpo" na documentação.

---

## FASE 19 — Proteção (WAF) e limpeza (24/10)

1. **Limpeza da prévia:** no D1 de prévia, `DELETE FROM contagem WHERE versao = 'v0';`.
2. **Regra de limite de pedidos:** domínio › **Security** › **Security rules** › Create rule › **Rate limiting rules**:
   - **Nome:** `contador`;
   - **URI Path** *equals* `/api/contagem`;
   - **Características:** IP;
   - **Limite:** 30 pedidos em 10 segundos;
   - **Ação:** Block, por 10 segundos.
3. **Teste:** 35 pedidos inválidos seguidos devem dar 30× **400** e depois **429**. Foi o que aconteceu.

---

## FASE 20 — Validação final (24/10)

Quiz completo num navegador real (Chromium), com o código publicado:
- zero erros de JavaScript e de mídia;
- preço "6x R$ 4,65";
- Pixel disparando os eventos;
- checkout indo para a Kiwify com as UTMs;
- botões de 1 clique no upsell e no downsell;
- 21 eventos do contador, todos com 204, cada um gravado **uma vez**;
- `npm test` passando, com 143 verificações.

---

## FASE 21 — Acompanhamento (do dia a dia)

No D1 de **produção** (`quiz-contagem`), aba **Console**, com uma consulta por vez (as consultas de linha única estão em `contador/consultas.sql`):
- **funil:** quantos chegaram em cada passo e a % sobre o início;
- **abandono:** `pct_que_saiu_aqui` por etapa. Os números mais altos são onde mexer;
- **por dia:** visitas, inícios, conclusões e cliques no checkout.

Para ler os números:
- são **ocorrências, não pessoas únicas**;
- `checkout` é o clique para ir à Kiwify, não a compra;
- a cada mudança no quiz, suba a `VERSAO` e compare só linhas da mesma versão.

---

## Pendências conhecidas deste projeto (resolver nos próximos)

| Item | Importância |
| --- | --- |
| Confirmar na Kiwify o 6x sem juros que a página mostra | alta |
| Testar o upsell e o downsell de 1 clique com compra real e reembolso | alta |
| `InitiateCheckout` em dobro (quiz + Kiwify) | média |
| Aviso de cookies e revisão jurídica da política | média |
| Redirecionar `receitacaneta.pages.dev` para o domínio oficial (fica fora do WAF) | média |
| `QuizEtapa` repetido no Meta ao voltar e avançar | baixa |

---

## Erros que já aconteceram (para não repetir)

| Erro | Como evitar |
| --- | --- |
| Número de prova social sem dado real | campo vazio até ter a pesquisa; planilha de simulação não entra |
| Tabela do D1 não existia | rode o esquema em **cada** banco e confira com o `sqlite_master` |
| Publicação feita antes do binding | depois de configurar os bindings, publique de novo |
| Banco de teste ligado à produção | conferir Preview e Production no seletor, no alto à direita, antes de mesclar |
| 400 no teste manual | o corpo usa chaves curtas `{e, n, v}` |
| Console do D1 recusando o comando | cole o SQL em uma linha só |
| `InitiateCheckout` em dobro | com o Pixel na Kiwify, o quiz manda evento personalizado |
| Endereço `*.pages.dev` fora do WAF | redirecionar para o domínio oficial |
| Material de order bump ou upsell aparecendo na oferta | mostrar na oferta só o que vem no produto principal |

---

## Checklist de lançamento

- [ ] `CLAUDE.md` com as regras de conteúdo e o tom
- [ ] `DESIGN.md` com a identidade
- [ ] Quiz com venda implícita, testado em 390 px; nada inventado
- [ ] Fotos, vídeo e áudio comprimidos
- [ ] Oferta: capas reais, situação + ganho por material, selo de perfil, caixa de compra, parcelamento **que existe na Kiwify**
- [ ] `checkoutUrl` certo; UTMs chegam ao checkout
- [ ] Upsell e downsell com o código do gerador; destinos na Kiwify; compra de teste com reembolso
- [ ] Política de privacidade com o que está ativo
- [ ] Pixel no site sem duplicar o `InitiateCheckout` da Kiwify; Pixel também configurado na Kiwify
- [ ] D1 de teste e de produção com a tabela; bindings Preview e Production **separados e conferidos**
- [ ] Prévia validada (204, 400 e gravação no D1 de teste)
- [ ] Publicação autorizada; produção conferida no D1
- [ ] Regra do WAF ativa e testada (429)
- [ ] `npm test` passando

---

## Prompt mestre para um produto novo

Copie, preencha os colchetes e mande numa sessão nova do Claude Code, com o repositório novo conectado. Anexe a referência, a marca, as mídias e as capas.

```
Quero criar, do zero, um funil de quiz para vender um infoproduto, seguindo exatamente
o processo do projeto "Além da Caneta" (repositório gabrielfelixback/receitacaneta,
arquivo PLAYBOOK.md). Leia o PLAYBOOK.md inteiro antes de começar e siga as fases na ordem.

PRODUTO
- Nome/marca: [ ]
- Público, dor emocional e dor concreta: [ ]
- Desejo (como a pessoa quer ficar): [ ]
- Solução que o produto entrega: [ ]
- Materiais do produto principal (nome, situação em que ela usa, o que muda) + capas: [ ]
- Order bumps (não exibir na oferta): [ ]
- Upsell e downsell (nome, preço, conteúdo, capa): [ ]
- Preço: R$ [ ] | preço "de": R$ [ ] | parcelas sem juros na Kiwify: [ ] | garantia: [ ] dias
- Link do checkout Kiwify: [ ]
- ID do Pixel do Meta: [ ] | domínio: [ ]
- Responsável e e-mail (política de privacidade): [ ]
- Dados REAIS de prova social (deixe vazio se não houver): [ ]
- Regras do nicho (o que nunca prometer ou dizer): [ ]
- Referência de funil (link/prints) e identidade visual (logo, cores, fontes): [ ]
- Número de perguntas/etapas desejado: [ ]

COMO TRABALHAR
1. Fase 1–4: proponha a ordem das telas e os textos (venda implícita: nada de produto
   ou preço antes da última página) e espere minha aprovação. Crie CLAUDE.md e DESIGN.md.
2. Construa quiz/index.html com CONFIG e STEPS, testes no jsdom e prévia em 390 px.
   Não use o backend Supabase.
3. Mídias: comprima (WebP, MP4 540p, MP3 64k) e ligue em CONFIG.
4. Oferta conforme a Fase 13; upsell/downsell e política conforme as Fases 10 e 11.
5. Pixel conforme a Fase 14, sem duplicar o InitiateCheckout da Kiwify.
   Se o produto for de saúde, não use GA4.
6. Contador: copie functions/api/contagem.js, contador/ e testes/testar-contador.js,
   ajuste o número de etapas e use os bancos <produto>-contagem e <produto>-contagem-previa.
7. Me guie no painel da Cloudflare uma etapa por vez (Fase 17), valide na prévia,
   e só publique com minha autorização explícita (Fase 18). Depois, WAF (Fase 19).
8. Trabalhe em branch, rode npm test, abra PR com checklist. Não invente resultados
   de testes nem dados de prova social. Português do Brasil, linguagem simples.
```
