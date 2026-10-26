-- Consultas do funil (Cloudflare › D1 › quiz-contagem › Console).
-- Os números são OCORRÊNCIAS, não pessoas únicas: a mesma pessoa em outro navegador, aba
-- ou dia conta de novo. Dentro da mesma aba, cada evento conta uma vez só.
-- Troque as datas e a versão nas cláusulas WHERE. Para ver só o tráfego real, some AND ambiente = 'producao'.

-- 0) Funil de produção separado por origem (utm_source). Troque as datas se quiser outro período.
--    Uma linha por passo; uma coluna de total por origem não cabe no SQL, então cada origem é uma linha
--    com o total e o % sobre o início daquela mesma origem.
WITH f AS (
  SELECT origem, evento, etapa, SUM(total) AS total  -- o checkout soma os dois botões; o resumo 0b separa
  FROM contagem
  WHERE ambiente = 'producao' AND dia BETWEEN '2026-10-01' AND '2026-12-31'
  GROUP BY origem, evento, etapa
)
SELECT
  f.origem,
  CASE f.evento WHEN 'etapa' THEN 'etapa ' || printf('%02d', f.etapa) ELSE f.evento END AS passo,
  f.total,
  ROUND(100.0 * f.total / NULLIF((SELECT b.total FROM f b WHERE b.origem = f.origem AND b.evento = 'inicio'), 0), 1) AS pct_do_inicio
FROM f
ORDER BY f.origem, CASE f.evento
  WHEN 'visita' THEN 0 WHEN 'inicio' THEN 1 WHEN 'etapa' THEN 2 WHEN 'conclusao' THEN 3
  WHEN 'oferta' THEN 4 WHEN 'ver_oferta' THEN 4.5 WHEN 'checkout' THEN 5 WHEN 'upsell' THEN 6 WHEN 'downsell' THEN 7 END, f.etapa;

-- 0b) Resumo de produção por origem, uma linha por origem.
SELECT
  origem,
  SUM(CASE WHEN evento = 'visita'    THEN total ELSE 0 END) AS visitas,
  SUM(CASE WHEN evento = 'inicio'    THEN total ELSE 0 END) AS inicios,
  SUM(CASE WHEN evento = 'conclusao' THEN total ELSE 0 END) AS conclusoes,
  SUM(CASE WHEN evento = 'oferta'    THEN total ELSE 0 END) AS ofertas,
  SUM(CASE WHEN evento = 'ver_oferta' THEN total ELSE 0 END) AS cliques_barra,
  SUM(CASE WHEN evento = 'checkout' AND botao = 'cta'   THEN total ELSE 0 END) AS checkout_cta,
  SUM(CASE WHEN evento = 'checkout' AND botao = 'cta-2' THEN total ELSE 0 END) AS checkout_cta2,
  SUM(CASE WHEN evento = 'checkout'  THEN total ELSE 0 END) AS cliques_checkout,
  ROUND(100.0 * SUM(CASE WHEN evento = 'checkout' THEN total ELSE 0 END)
        / NULLIF(SUM(CASE WHEN evento = 'inicio' THEN total ELSE 0 END), 0), 1) AS pct_inicio_ate_checkout
FROM contagem
WHERE ambiente = 'producao' AND dia BETWEEN '2026-10-01' AND '2026-12-31'
GROUP BY origem
ORDER BY inicios DESC;

-- 1) Funil de uma versão num período: total de cada passo e % sobre o início.
WITH f AS (
  SELECT evento, etapa, SUM(total) AS total
  FROM contagem
  WHERE versao = 'v21' AND dia BETWEEN '2026-10-01' AND '2026-12-31'
  GROUP BY evento, etapa
),
base AS (SELECT total FROM f WHERE evento = 'inicio')
SELECT
  CASE evento WHEN 'etapa' THEN 'etapa ' || printf('%02d', etapa) ELSE evento END AS passo,
  total,
  ROUND(100.0 * total / NULLIF((SELECT total FROM base), 0), 1) AS pct_do_inicio
FROM f
ORDER BY CASE evento
  WHEN 'visita' THEN 0 WHEN 'inicio' THEN 1 WHEN 'etapa' THEN 2 WHEN 'conclusao' THEN 3
  WHEN 'oferta' THEN 4 WHEN 'ver_oferta' THEN 4.5 WHEN 'checkout' THEN 5 WHEN 'upsell' THEN 6 WHEN 'downsell' THEN 7 END, etapa;

-- 2) Abandono etapa a etapa: quantas chegaram, quantas chegaram à seguinte e % que saiu ali.
WITH e AS (
  SELECT etapa, SUM(total) AS chegaram
  FROM contagem
  WHERE versao = 'v21' AND evento = 'etapa' AND dia BETWEEN '2026-10-01' AND '2026-12-31'
  GROUP BY etapa
)
SELECT
  etapa,
  chegaram,
  LEAD(chegaram) OVER (ORDER BY etapa) AS chegaram_na_proxima,
  ROUND(100.0 * (chegaram - LEAD(chegaram) OVER (ORDER BY etapa)) / NULLIF(chegaram, 0), 1) AS pct_saiu_aqui
FROM e
ORDER BY etapa;

-- 3) Por dia: início, conclusão, oferta e clique no checkout.
SELECT
  dia,
  SUM(CASE WHEN evento = 'visita'    THEN total ELSE 0 END) AS visitas,
  SUM(CASE WHEN evento = 'inicio'    THEN total ELSE 0 END) AS inicios,
  SUM(CASE WHEN evento = 'conclusao' THEN total ELSE 0 END) AS conclusoes,
  SUM(CASE WHEN evento = 'oferta'    THEN total ELSE 0 END) AS ofertas,
  SUM(CASE WHEN evento = 'checkout'  THEN total ELSE 0 END) AS cliques_checkout,
  SUM(CASE WHEN evento = 'upsell'    THEN total ELSE 0 END) AS upsell,
  SUM(CASE WHEN evento = 'downsell'  THEN total ELSE 0 END) AS downsell
FROM contagem
WHERE dia BETWEEN '2026-10-01' AND '2026-12-31'
GROUP BY dia
ORDER BY dia;

-- 4) Comparar versões do quiz (só faz sentido entre linhas da mesma versão).
SELECT
  versao,
  SUM(CASE WHEN evento = 'inicio'    THEN total ELSE 0 END) AS inicios,
  SUM(CASE WHEN evento = 'conclusao' THEN total ELSE 0 END) AS conclusoes,
  SUM(CASE WHEN evento = 'checkout'  THEN total ELSE 0 END) AS cliques_checkout,
  ROUND(100.0 * SUM(CASE WHEN evento = 'checkout' THEN total ELSE 0 END)
        / NULLIF(SUM(CASE WHEN evento = 'inicio' THEN total ELSE 0 END), 0), 1) AS pct_inicio_ate_checkout
FROM contagem
WHERE evento IN ('inicio', 'conclusao', 'checkout')
GROUP BY versao
ORDER BY versao;

-- Atenção: "checkout" é o clique para ir à Kiwify, não a compra. A compra é medida pela Kiwify.
-- "upsell" e "downsell" são visitas a essas páginas (quem chegou depois de comprar ou de recusar o upsell).

-- 5) Validação da prévia (rodar SÓ no banco quiz-contagem-previa).
--    Os testes manuais usam a versão v0; o quiz usa a VERSAO do index.html; upsell/downsell usam v1.
SELECT versao, evento, etapa, total FROM contagem ORDER BY versao, evento, etapa;

--    Etapas de 1 a 14 que faltam ou não somam 1 numa versão (troque 'v0' por 'v19' para conferir o quiz).
WITH RECURSIVE n(etapa) AS (SELECT 1 UNION ALL SELECT etapa + 1 FROM n WHERE etapa < 14)
SELECT n.etapa, COALESCE(c.total, 0) AS total
FROM n LEFT JOIN contagem c ON c.evento = 'etapa' AND c.etapa = n.etapa AND c.versao = 'v0'
WHERE COALESCE(c.total, 0) <> 1;

--    Limpar os testes manuais depois de conferir (SÓ na prévia; nunca no banco de produção).
-- DELETE FROM contagem WHERE versao = 'v0';
