# Página institucional

Página de conteúdo sobre o Além da Caneta, no mesmo visual da página de vendas que o dono desenhou (fundo creme, caneta animada, faixas, cartões). Mostra:
- a dor de quem usa a caneta e por que ela acontece;
- os estudos e a matéria da VEJA;
- **o teste:** um celular com a primeira pergunta do quiz, os 4 passos do teste e os 5 perfis do resultado;
- o Método 3P, a virada de chave e as trocas de receita;
- os 10 materiais, com capa, situação de uso e o que muda;
- para quem é, com o aviso de que a caneta segue como o médico passou;
- as perguntas frequentes.

**Não vende:** não tem preço, checkout nem Kiwify. Todos os botões levam ao teste em `https://oalemdacaneta.com.br/`, repassando as UTMs de quem chegou.

Fica num **subdomínio próprio** (ex.: `sobre.oalemdacaneta.com.br`), como um projeto separado no Cloudflare Pages. O quiz e o contador não são afetados.

## Preencher com conteúdo real

No fim do `index.html`, o bloco `CONTEUDO` tem três partes:
- **`historia`:** `titulo` e `paragrafos` com a história da marca. Enquanto estiver vazio, a seção "Quem somos" e o item do menu não aparecem.
- **`depoimentos`:** `{texto, nome, foto}`, **só com a autorização de cada aluna**. A foto (print) é opcional e vai em `institucional/img/`. Enquanto estiver vazio, a seção não aparece.
- **`materiais`:** os mesmos nomes e capas do produto, sem preço.

Regras do projeto (`CLAUDE.md`): nada de prometer quilos ou prazo, nada sobre dose de medicamento, e nada de depoimento, número ou especialista que não seja real.

## Publicar num subdomínio (uma vez)

1. Cloudflare › **Workers & Pages** › **Create** › **Pages** › **Connect to Git** › o mesmo repositório `receitacaneta`.
2. Configure:
   - **Project name:** `alem-da-caneta-sobre` (ou outro);
   - **Production branch:** `main`;
   - **Root directory:** `institucional`;
   - **Build command:** vazio;
   - **Build output directory:** `/` (a própria pasta).

   Com o Root directory em `institucional`, a pasta `functions/` do contador **não** entra neste projeto.
3. **Save and Deploy.**
4. No projeto novo, abra **Custom domains** › **Set up a domain** › `sobre.oalemdacaneta.com.br`. A Cloudflare cria o DNS sozinha, porque o domínio já está na conta.
5. Abra o endereço e confira: a página carrega, as capas aparecem e os botões levam ao teste.

Cada push na `main` publica o quiz (projeto `receitacaneta`) e esta página (projeto novo). Mudanças só na pasta `institucional/` não alteram o quiz.

## Testar

`npm run test:institucional` confere que a página:
- não tem preço, checkout nem Kiwify;
- tem os botões levando ao teste com as UTMs;
- mostra os 10 materiais com as capas;
- esconde a história e os depoimentos enquanto estão vazios.
