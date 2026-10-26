-- Contador agregado do funil do quiz (binding DB do Cloudflare Pages).
-- Uma linha por dia × versão × evento × etapa × origem × ambiente, com o total de ocorrências.
-- origem = utm_source da visita (sem utm = 'direto'; fora do padrão = 'outro'). ambiente = 'producao' só em oalemdacaneta.com.br.
-- Não há coluna para IP, navegador, cookie, identificador, URL ou resposta: só contagens.
-- Banco novo: rodar uma vez. Banco que já tem a tabela antiga: use contador/migracao-origem.sql.

CREATE TABLE IF NOT EXISTS contagem (
  dia      TEXT    NOT NULL CHECK (dia GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),  -- AAAA-MM-DD, horário de Brasília
  versao   TEXT    NOT NULL CHECK (length(versao) BETWEEN 2 AND 5),                    -- versão do quiz ou da página (ex.: v20)
  evento   TEXT    NOT NULL CHECK (evento IN ('visita', 'inicio', 'etapa', 'conclusao', 'oferta', 'checkout', 'upsell', 'downsell')),
  etapa    INTEGER NOT NULL DEFAULT 0 CHECK (
             (evento = 'etapa' AND etapa BETWEEN 1 AND 14) OR (evento <> 'etapa' AND etapa = 0)),
  origem   TEXT    NOT NULL DEFAULT 'direto' CHECK (length(origem) BETWEEN 1 AND 30 AND origem NOT GLOB '*[^a-z0-9._-]*'),
  ambiente TEXT    NOT NULL DEFAULT 'teste' CHECK (ambiente IN ('producao', 'teste')),
  total    INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  PRIMARY KEY (dia, versao, evento, etapa, origem, ambiente)
) WITHOUT ROWID;
