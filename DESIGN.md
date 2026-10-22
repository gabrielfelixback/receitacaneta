# Visual do quiz

Segue o guia de marca **além da caneta** (o mesmo do app em `gabrielfelixback/al-mdacaneta`, `src/theme/tokens.ts`). Tema claro único: quem faz o quiz está no celular, vindo do Instagram ou do Facebook.

## Tema atual: a marca no fundo branco

As cores, as fontes e o logo são os do guia além da caneta. Só o fundo da página é branco, e o creme (`--linho #F4F0E8`) fica para os blocos de apoio. A força vem do tamanho dos títulos, do contraste e dos blocos de destaque. O bloco "Tema: a marca além da caneta no fundo branco", no fim do CSS, concentra essas regras.

- Dor em `--danger #A4442C`: selo "ATENÇÃO" da abertura, aviso, "você disse que sente…", preço riscado e selo de desconto.
- Floresta para avançar (botões, opção escolhida) e para os blocos fortes:
  - "Os resultados não mentem";
  - abertura do resultado;
  - "Com o plano completo, você vai:".
- Argila para comprar (`.btn.buy`) e para o itálico da palavra-chave.
- Oferta:
  - soma do valor de cada entregável (`CONFIG.entregaveis[i][3]`), com o total riscado (`CONFIG.precoDe`);
  - selo "X% OFF" e economia em reais.
- Rodapé fixo: "De R$ 249" riscado, preço, selo "-89%" pulsando e botão com brilho e balanço (desligado com redução de movimento).
