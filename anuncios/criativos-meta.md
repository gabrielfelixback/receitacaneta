# Criativos para o Meta (casados com a abertura do quiz)

A primeira tela do quiz fala de **espelho, vergonha e barriga que não vai embora**. O anúncio promete a mesma conversa, para a pessoa sentir que caiu no lugar certo. O público é frio, mas já sabe que tem o problema: o anúncio bate na dor e abre a curiosidade sobre o motivo. A explicação fica para o quiz. Nenhum anúncio fala de receita, produto ou preço: o clique é para "descobrir o motivo".

Os números entre parênteses são caracteres. No Meta, o texto principal mostra cerca de 125 antes do "ver mais", o título até 40 e a descrição até 30.

## Ângulos

### 1. Espelho (o mesmo da abertura)
- **Texto principal:** Você toma o Mounjaro certinho, quase não come… e ainda foge do espelho? Não é falta de esforço. Tem um motivo, e ele está no seu prato. (140)
- **Título:** Por que a barriga não sai? (26)
- **Descrição:** Teste grátis de 1 minuto (24)
- **Imagem:** mulher de lado no espelho, segurando a barriga com cara de frustração. Texto na imagem: "Faço tudo certo. Por que ela não sai?"

### 2. Raiva de si mesma
- **Texto principal:** Você paga caro na caneta, passa o dia sem comer e a barriga continua lá. A culpa não é sua: o seu corpo pode estar queimando músculo no lugar de gordura. (155)
- **Título:** A culpa não é sua (17)
- **Descrição:** Descubra o motivo em 1 min (26)
- **Imagem:** caneta na pia do banheiro, mulher ao fundo, desfocada, de cabeça baixa.

### 3. Tipos de barriga (casa com a página 5)
- **Texto principal:** Pochete, pneuzinho, barriga alta ou flácida? Cada uma tem um motivo para não sair, mesmo com Ozempic ou Mounjaro. Descubra qual é a sua no teste. (151)
- **Título:** Qual é o seu tipo de barriga? (29)
- **Descrição:** Resultado na hora (17)
- **Imagem:** grade 2×2 com as quatro barrigas, no mesmo formato da página 5 do quiz.

### 4. Roupa que não fecha
- **Texto principal:** A calça que não fecha, o biquíni que você nem experimenta… Você emagreceu com a caneta e a barriga de baixo continua. O motivo está no que vai no seu prato. (156)
- **Título:** A calça ainda não fecha? (24)
- **Descrição:** Teste grátis · 1 minuto (23)
- **Imagem:** mulher tentando fechar a calça jeans deitada na cama.

### 5. Idade
- **Texto principal:** Depois dos 40, emagrecer com caneta pede outro prato. Você perde músculo com mais facilidade, e é aí que a barriga fica. Faça o teste e veja o que está travando. (162)
- **Título:** Passou dos 40 e a barriga ficou? (32)
- **Descrição:** Teste grátis de 1 minuto (24)
- **Imagem:** mulher 40+ de perfil no espelho, mão na barriga.

## Como testar

- **Variável:** o ângulo. Mesma página, mesmo público e uma imagem por ângulo no começo.
- **Métrica que decide:** custo por quiz iniciado (evento `QuizInicio`) e, depois, custo por compra. CTR alto com pouco `QuizInicio` quer dizer que o anúncio promete uma coisa e a abertura entrega outra.
- **Hipótese que pode perder:** o ângulo 1 (espelho) tem custo por `QuizInicio` pelo menos 20% menor que o ângulo 5 (idade), porque casa palavra por palavra com a primeira tela.
- **Quando julgar:** dê pelo menos uns 1.000 impressões por criativo antes de cortar.
