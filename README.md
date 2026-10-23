# Receita Caneta · quiz

Quiz de 16 telas (10 perguntas) que leva quem usa caneta emagrecedora a entender por que a barriga não sai e só na última página mostra o plano de receitas personalizado com a oferta.

## Fluxo

| # | Tela | Para quê |
| --- | --- | --- |
| 0 | Gancho: o que sente no espelho | Dor da autoestima e primeiro clique já na capa |
| 1 | Idade em cartões | Situação, com imagem por faixa |
| 2 | Quebra da idade | "Você está no lugar certo": texto por faixa + % real da sua base (`CONFIG.provaIdade`) ou dado de pesquisa |
| 3 | Há quanto tempo usa a caneta | Situação |
| 4 | Tipo de barriga que mais incomoda | Dor principal (pochete, pneuzinho, alta, flácida) |
| 4b | Como quer que a barriga fique | Desejo: cartões com silhueta, volta no resultado e no compromisso |
| 5 | Por que essa barriga não sai | Consciência do problema (músculo × gordura, STEP 1) |
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
2. **Front**: coloque as fotos em `quiz/img/` e ligue em `CONFIG.imagens` (as da idade já estão lá), preencha o `CONFIG` em `quiz/index.html` (`backendUrl`, `checkoutUrl`, `pixelId`, `provaIdade`, autor, depoimentos) e suba a pasta `quiz/` em Netlify, Vercel, Cloudflare Pages ou na sua hospedagem.
3. Rode `npm test` antes de cada publicação.

## Pendências

- Números reais para `CONFIG.provaIdade` e depoimentos autorizados.
- Nome, registro e foto de quem montou as receitas (`CONFIG.autor`).
- O produto em si: as receitas prometidas em `CONFIG.entregaveis` e no Dia 1 do resultado.
- Criativos de anúncio que conversem com a abertura.

## Vídeo na primeira página

O espaço da imagem da abertura aceita vídeo. Hoje está com o vídeo de apresentação (`quiz/video/gancho.mp4`, 51 s).

- **Vídeo falado (`som: true`):** começa sozinho e sem som (a legenda gravada conta a história). O botão "Toque para ouvir" volta ao início com som. Uma barra mostra o progresso, e tocar no vídeo pausa ou continua. No fim ele volta a rodar mudo, com "Ouvir de novo". O toque no som gera o evento `QuizVideoSom` no Pixel.
- **Vídeo curto sem fala (`som: false`):** toca em loop, mudo, como um GIF.

1. Grave ou edite um vídeo de 5 a 10 segundos, na horizontal (16:9) ou quadrado. Ele fica cortado em 16:9, então mantenha o principal no centro. Sem som: no celular, vídeo automático sempre começa mudo.
2. Comprima para a página continuar rápida (o ideal é ficar abaixo de 1,5 MB):

```bash
# MP4 (toca em todo lugar, inclusive iPhone e no navegador do Instagram)
ffmpeg -i original.mov -t 10 -an -vf "scale=960:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart quiz/video/gancho.mp4
# WebM (opcional, fica menor no Android/Chrome)
ffmpeg -i original.mov -t 10 -an -vf "scale=960:-2" -c:v libvpx-vp9 -crf 38 -b:v 0 quiz/video/gancho.webm
# Capa (primeiro quadro, aparece enquanto o vídeo carrega)
ffmpeg -i quiz/video/gancho.mp4 -frames:v 1 -vf "scale=960:-2" -c:v libwebp -quality 75 quiz/video/gancho-capa.webp
```

3. No `CONFIG` do `quiz/index.html`:

```js
ganchoVideo: {mp4: 'video/gancho.mp4', webm: 'video/gancho.webm', capa: 'video/gancho-capa.webp'},
```

4. Suba a pasta `quiz/` inteira (com `video/` e `img/`).

Sem vídeo, aparece a foto de `imagens.gancho`; sem foto, a ilustração do espelho.

## Prova da base (página "caminho certo")

Hoje os percentuais por faixa estão em `PROVA_IDADE`, no `quiz/index.html`, com os números informados pelo dono. A ferramenta abaixo serve para quando houver uma planilha nova.

Quando tiver a pesquisa real com as compradoras, gere o `CONFIG.provaIdade` com:

```bash
pip install openpyxl
python3 ferramentas/prova_da_base.py caminho/da/planilha.xlsx
```

A planilha segue o modelo de `base_avaliacoes_quiz` (aba **Participantes** com Faixa etária, Usa caneta?, Percepção da barriga, Semanas com cardápio). A ferramenta:
- conta só quem usa caneta;
- usa o % que respondeu "Sim";
- deixa de fora as faixas com menos de 30 respostas;
- imprime a linha pronta para colar no `CONFIG`.

Se a planilha disser que é simulação, teste ou demonstração, ela para; `--simulacao` mostra o resultado só para teste.
