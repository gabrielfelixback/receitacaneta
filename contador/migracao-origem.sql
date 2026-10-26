-- Migração: acrescenta origem, ambiente e botão (e o evento ver_oferta) à tabela contagem, sem perder as contagens antigas.
-- O SQLite não troca a chave primária de uma tabela, então criamos a nova, copiamos e trocamos o nome.
-- Rode uma linha por vez no Console do D1, logo depois que o deploy com o código novo terminar.
-- As linhas antigas não têm origem: ficam como 'antigo'. O ambiente delas depende do banco:
--   quiz-contagem (produção) → 'producao'   |   quiz-contagem-previa → 'teste' (troque na linha 2).

CREATE TABLE contagem_nova (dia TEXT NOT NULL CHECK (dia GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'), versao TEXT NOT NULL CHECK (length(versao) BETWEEN 2 AND 5), evento TEXT NOT NULL CHECK (evento IN ('visita', 'inicio', 'etapa', 'conclusao', 'oferta', 'ver_oferta', 'checkout', 'upsell', 'downsell')), etapa INTEGER NOT NULL DEFAULT 0 CHECK ((evento = 'etapa' AND etapa BETWEEN 1 AND 14) OR (evento <> 'etapa' AND etapa = 0)), origem TEXT NOT NULL DEFAULT 'direto' CHECK (length(origem) BETWEEN 1 AND 30 AND origem NOT GLOB '*[^a-z0-9._-]*'), ambiente TEXT NOT NULL DEFAULT 'teste' CHECK (ambiente IN ('producao', 'teste')), botao TEXT NOT NULL DEFAULT '' CHECK (botao IN ('', 'cta', 'cta-2') AND (botao = '' OR evento = 'checkout')), total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0), PRIMARY KEY (dia, versao, evento, etapa, origem, ambiente, botao)) WITHOUT ROWID;
INSERT INTO contagem_nova (dia, versao, evento, etapa, origem, ambiente, botao, total) SELECT dia, versao, evento, etapa, 'antigo', 'producao', '', total FROM contagem;
DROP TABLE contagem;
ALTER TABLE contagem_nova RENAME TO contagem;
SELECT ambiente, origem, SUM(total) AS total FROM contagem GROUP BY ambiente, origem;
