# Visual do quiz

Segue o guia de marca **além da caneta** (o mesmo do app em `gabrielfelixback/al-mdacaneta`, `src/theme/tokens.ts`). Tema claro único: quem faz o quiz está no celular, vindo do Instagram ou do Facebook.

## Cores (60/30/10)

| Papel | Token | Valor | Uso |
| --- | --- | --- | --- |
| Base | `--creme` | `#F4F0E8` | fundo da página |
| Base | `--branco` / `--linho` | `#FFFDF9` / `#E4DDCF` | cartões e folhas / blocos de apoio |
| Apoio | `--floresta` | `#17332B` | texto, botão de avançar, blocos escuros (abertura, resultado) |
| Apoio | `--musgo` / `--salvia` | `#4A5E52` / `#B7C4B1` | texto secundário (6,1:1) / seleção |
| Acento | `--argila` | `#B8744F` | linha do progresso, traços, barras |
| Acento | `--argila-ink` | `#9A5A39` | palavra em itálico sobre o creme (4,7:1) |
| Acento | `--argila-cta` | `#A65E3A` | **só** o botão de compra (texto branco 4,8:1) |
| Acento | `--argila-on-dark` | `#D9A07E` | itálico e números sobre o Floresta (6:1) |

O botão Floresta avança no quiz e o botão Argila compra: cada cor tem uma função só.

## Tipografia

- Instrument Serif nos títulos. Itálico (`<em>`) só na palavra-chave da frase, em argila.
- Instrument Sans no resto: texto, botões e números das barras (`tabular-nums`).

## Elementos da marca

- Símbolo: a cápsula com a linha curva em argila (`capsuleSvg`). Aparece no logo, nas capas dos materiais e no carregamento, onde a linha se desenha conforme a porcentagem.
- Progresso: linha argila com a cápsula correndo na ponta e o contador `3/8` (só perguntas).
- Ícones: traço único de 1,8 em grade de 24 (`ICON`). Nada de emoji no lugar de ícone.
- Imagens: só SVG desenhado no código, sem foto. Assim carrega na hora e não inventa pessoa nem resultado.
