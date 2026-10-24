-- Contador agregado do funil do quiz (binding DB do Cloudflare Pages).
-- Uma linha por dia × versão do quiz × evento × etapa, com o total de ocorrências.
-- Não há coluna para IP, navegador, cookie, identificador, URL ou resposta: só contagens.
-- Rodar uma vez em cada banco (produção e prévia). Pode rodar de novo sem apagar nada.

CREATE TABLE IF NOT EXISTS contagem (
  dia     TEXT    NOT NULL CHECK (dia GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),  -- AAAA-MM-DD, horário de Brasília
  versao  TEXT    NOT NULL CHECK (length(versao) BETWEEN 2 AND 5),                    -- versão do quiz ou da página (ex.: v19)
  evento  TEXT    NOT NULL CHECK (evento IN ('visita', 'inicio', 'etapa', 'conclusao', 'oferta', 'checkout', 'upsell', 'downsell')),
  etapa   INTEGER NOT NULL DEFAULT 0 CHECK (
            (evento = 'etapa' AND etapa BETWEEN 1 AND 14) OR (evento <> 'etapa' AND etapa = 0)),
  total   INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  PRIMARY KEY (dia, versao, evento, etapa)
) WITHOUT ROWID;
