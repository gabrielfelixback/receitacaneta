# Receita Caneta

Funil de quiz para vender um infoproduto low ticket de **receitas para quem usa caneta emagrecedora** (Mounjaro, Ozempic, Wegovy, Saxenda). Tráfego do Meta (Facebook e Instagram). O quiz deixa a pessoa consciente do problema (pouca proteína com a fome baixa → perde músculo, cansaço, a barriga não sai) e da solução (receitas pequenas, geladas, doces e de lanche que fecham a proteína) e só no fim mostra a oferta.

Tom: emocional e direto, de funil low ticket para tráfego frio (dor da autoestima, espelho, tipos de barriga). O espelho devolve o que a pessoa disse sentir. Fotos ficam em `CONFIG.imagens` (vazio = ilustração). Criativos de anúncio em `anuncios/criativos-meta.md`.

O quiz é uma venda implícita: não pode parecer venda até a última página. Antes dela, nada de "plano", "receitas", produto ou preço; só consciência do problema e depois da solução. O resultado é o "plano personalizado" e o preço aparece como acesso ao plano completo.

O dono do projeto fala português. Responda e escreva os textos do quiz em português do Brasil, com linguagem simples.

## Estrutura

- `backend/`: Supabase. Migração com tabelas, função de registro e views do funil; Edge Function pública `quiz`; validação em `functions/_shared/validar.ts`. Detalhes em `backend/README.md`.
- `quiz/index.html`: o quiz inteiro em um arquivo (HTML, CSS e JS, sem build). É o que vai para a hospedagem.
- `DESIGN.md`: o visual (identidade além da caneta: cores, fontes, símbolo da cápsula, ícones). Leia antes de mexer no CSS.
- `testes/testar-quiz.js`: percorre as 16 telas no jsdom em 3 cenários, confere resultado, eventos do backend (validados com o mesmo `validar.ts`) e checkout.

## Como o `quiz/index.html` está organizado

- `CONFIG`: marca, preço, checkout, URL do backend, Pixel, garantia, prova social, `provaIdade` (quebra da idade), autor, depoimentos e entregáveis. Quase toda mudança de conteúdo começa aqui.
- `STEPS`: a ordem das telas. Ordem psicológica: gancho emocional na autoestima (`sentimento`: o que sente no espelho; primeiro clique) → idade (cartões com imagem) → quebra da idade (prova da base em `provaIdade`, ou dado de pesquisa) → tempo de caneta → tipo de barriga que mais incomoda (`barriga`: pochete, pneuzinho, alta, flácida; o texto do quiz usa a escolhida) → como quer que a barriga fique (`sonho`, desejo) → por que não sai (consciência do problema) → sintomas → o que mais come (define o perfil) → peso e altura (IMC ao vivo) → espelho personalizado com a proteína → solução (troca de receita) → tempo para cozinhar → microcompromisso → carregamento → resultado.
- Tipos de tela: `hook`, `intro`, `age`, `buttons`, `cards` (opções com imagem, `img`), `multi`, `insight`, `weight`, `mirror`, `solution`, `loading`, `result`. Em `opts`, `ic` é o ícone (objeto `ICON`, SVG de traço; não use emoji) e `v` é o código enviado ao backend: não renomeie sem atualizar `PERFIS`, `TROCA`, `ESPELHO`, `PROT_TIPICA` e `backend/.../validar.ts` (lista `PERFIS`).
- O perfil vem da pergunta `come`: `economia`, `gelado`, `doce`, `lanche`, `prato_pequeno`.

## Regras de conteúdo (não negociáveis)

- Nada de dose, troca ou suspensão de medicamento. Manter o aviso de que a caneta segue como o médico passou.
- Não prometer quilos nem prazo. Não inventar médico, nutricionista, registro, depoimento, número de alunos ou porcentagem de prova social: esses campos (`provaSocial`, `provaQuebra`, `provaIdade`, autor, depoimentos) ficam vazios no `CONFIG` até o dono preencher com dados reais. Sem número real, a tela da idade mostra o dado de pesquisa citado.
- Dados citados: perda de 3–8% de massa muscular por década após os 30 (Volpi 2004); ~40% do peso perdido como massa magra no STEP 1 (Wilding 2021); proteína de 1,2 a 1,6 g/kg/dia (com IMC ≥ 30, sobre o peso ajustado: peso no IMC 25 + 25% do excedente, igual ao app); faixas de IMC da OMS, sempre com a ressalva de que o IMC não separa músculo de gordura.
- As barras do resultado são "pontuação do teste", não diagnóstico. Manter a legenda e o aviso final de material educativo.
- Pixel do Meta: eventos com nomes neutros (`QuizInicio`, `QuizEtapa`, `QuizCompleto`) e nenhuma resposta enviada ao Meta.

## Testar

```bash
npm install
npm test        # validação do backend + quiz no jsdom
```

Abra `quiz/index.html` no navegador e teste em largura de celular (~390 px).
