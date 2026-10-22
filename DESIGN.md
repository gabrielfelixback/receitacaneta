# Visual do quiz

Segue o guia de marca **além da caneta** (o mesmo do app em `gabrielfelixback/al-mdacaneta`, `src/theme/tokens.ts`). Tema claro único: quem faz o quiz está no celular, vindo do Instagram ou do Facebook.

## Tema atual: alta conversão

O quiz começou com a paleta do guia além da caneta (creme, floresta, argila, Instrument Serif). A pedido do dono, o tema virou o padrão dos funis de tráfego frio. O bloco "Tema alta conversão", no fim do CSS, sobrescreve os tokens e os componentes; para voltar ao visual da marca, basta apagar esse bloco.

| Papel | Valor | Uso |
| --- | --- | --- |
| Fundo | `#FFFFFF` | página e cartões (borda `#E5E7EB`) |
| Texto | `#111111` / `#4B5563` | títulos / apoio |
| Dor | `--vermelho #DC2626` | palavra-chave dos títulos (`<em>`), alertas, barras de risco |
| Solução | `--verde #15803D` (fundo com texto branco, 5:1) e `--verde-vivo #16A34A` (texto grande, barras) | botões, opção escolhida, caixas de resultado |
| Marca-texto | `--amarelo #FDE047` com texto preto | destaque no resultado |

- Tipografia: Archivo 900 nos títulos (a abertura em caixa alta, com o selo "ATENÇÃO:" em preto) e Inter no texto.
- Topo: logo "TESTE DA / Além da Caneta" em verde e barra de progresso grossa em todas as telas.
- Blocos de apelo, todos com conteúdo verdadeiro:
  - aviso em vermelho (`.warn`);
  - card do estudo NEJM 2021 (`.paper`);
  - "Os resultados não mentem" (`.alert`);
  - mensagem de voz (`CONFIG.audio`, gravada pelo dono);
  - "Resultado gerado com SUCESSO" com antes e depois ilustrado (`avatar({mood})`).
- Imagens: `CONFIG.imagens`; vazio usa as ilustrações em SVG (`avatar`, `torso`, `frenteArt`, `penArt`, `mirrorArt`).
