# Receita Caneta · quiz

Quiz de 15 telas (9 perguntas) que leva quem usa caneta emagrecedora a entender por que a pochete não sai e termina num plano de receitas personalizado com a oferta.

## Fluxo

| # | Tela | Para quê |
| --- | --- | --- |
| 1 | Abertura com a idade em cartões | Gancho ("usando a caneta e a pochete ainda não saiu?") e primeira interação já na capa |
| 2 | Quebra da idade | "Você está no lugar certo": texto por faixa + % real da sua base (`CONFIG.provaIdade`) ou dado de pesquisa |
| 3 | Há quanto tempo usa a caneta | Situação |
| 4 | Como está a pochete | Dor principal |
| 4b | Como quer que a barriga fique | Desejo: cartões com silhueta, volta no resultado e no compromisso |
| 5 | Por que a pochete não sai | Consciência do problema (músculo × gordura, STEP 1) |
| 6 | O que acontece desde a caneta | Dores: sem fome, doce, gelado, hambúrguer, cansaço, academia, enjoo |
| 7 | O que mais entra no prato | Define o perfil |
| 8 | Peso e altura | Mostra o IMC na hora e calcula a proteína do dia |
| 9 | Espelho | Devolve as dores marcadas com a causa + régua do IMC (OMS) + proteína que precisa × dia típico |
| 10 | Solução | "Cada garfada conta": troca de receita pelo hábito marcado |
| 11 | Tempo para preparar | Personaliza o Dia 1 |
| 12 | Microcompromisso | "Você testa por 7 dias?" |
| 13 | Carregamento | Monta o plano e registra a conclusão |
| 14 | Resultado | Perfil, pontuação, meta de proteína, Dia 1, entregáveis, oferta, FAQ |

## Ordem para colocar no ar

1. **Backend**: siga `backend/README.md` (migração, segredos, deploy da função `quiz`).
2. **Front**: preencha o `CONFIG` em `quiz/index.html` (`backendUrl`, `checkoutUrl`, `pixelId`, `provaIdade`, autor, depoimentos) e suba a pasta `quiz/` em Netlify, Vercel, Cloudflare Pages ou na sua hospedagem.
3. Rode `npm test` antes de cada publicação.

## Pendências

- Números reais para `CONFIG.provaIdade` e depoimentos autorizados.
- Nome, registro e foto de quem montou as receitas (`CONFIG.autor`).
- O produto em si: as receitas prometidas em `CONFIG.entregaveis` e no Dia 1 do resultado.
- Criativos de anúncio que conversem com a abertura.
