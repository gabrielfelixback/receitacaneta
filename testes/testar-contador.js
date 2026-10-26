// Testa a função do contador (functions/api/contagem.js) sem Cloudflare: um D1 falso guarda o que seria gravado.
// Confere eventos válidos e inválidos, etapas fora de 1–14, campos a mais, método, origem, tamanho e falha do banco.
// Uso: node testes/testar-contador.js
const path = require('path');
const {pathToFileURL} = require('url');

const out = [];
let fail = false;
const check = (ok, msg) => { if (!ok) fail = true; out.push(`${ok ? 'ok ' : 'ERRO'} ${msg}`); };

// D1 falso: registra cada gravação; pode ser configurado para falhar.
const bancoFalso = (falha) => {
  const gravado = [];
  return {
    gravado,
    prepare(sql) {
      return {bind: (...args) => ({run: async () => { if (falha) throw new Error('D1 fora do ar: detalhe interno'); gravado.push({sql, args}); return {success: true}; }})};
    }
  };
};
const URL_FN = 'https://oalemdacaneta.com.br/api/contagem';
const pedido = (body, {method = 'POST', origin = 'https://oalemdacaneta.com.br', headers = {}} = {}) => {
  const h = new Headers(headers);
  if (origin) h.set('Origin', origin);
  if (!h.has('Content-Type')) h.set('Content-Type', 'text/plain;charset=UTF-8'); // o que o sendBeacon manda
  if (typeof body === 'string' && !h.has('Content-Length')) h.set('Content-Length', String(Buffer.byteLength(body)));
  return new Request(URL_FN, {method, headers: h, body: method === 'GET' || method === 'HEAD' ? undefined : body});
};

(async () => {
  const fn = await import(pathToFileURL(path.join(__dirname, '..', 'functions', 'api', 'contagem.js')).href);
  const chama = async (req, db = bancoFalso()) => ({res: await fn.onRequest({request: req, env: {DB: db}}), db});

  // Eventos válidos: todos os 8 tipos e as 14 etapas gravam uma linha com (dia, versão, evento, etapa).
  for (const e of ['visita', 'inicio', 'conclusao', 'oferta', 'ver_oferta', 'checkout', 'upsell', 'downsell']) {
    const {res, db} = await chama(pedido(JSON.stringify({e, v: 'v19'})));
    const a = (db.gravado[0] || {}).args || [];
    check(res.status === 204 && db.gravado.length === 1 && a[1] === 'v19' && a[2] === e && a[3] === 0, `"${e}" válido: 204 e grava etapa 0`);
  }
  let etapasOk = true;
  for (let n = 1; n <= 14; n++) {
    const {res, db} = await chama(pedido(JSON.stringify({e: 'etapa', n, v: 'v19'})));
    if (res.status !== 204 || (db.gravado[0] || {}).args[3] !== n) etapasOk = false;
  }
  check(etapasOk, 'etapas 1 a 14 válidas: 204 e gravam o número certo');

  // O que é gravado: só dia, versão, evento, etapa, origem e ambiente; o dia vem do servidor (horário de Brasília).
  {
    const {db} = await chama(pedido(JSON.stringify({e: 'inicio', v: 'v19'})));
    const g = db.gravado[0];
    check(g.args.length === 7 && /^\d{4}-\d{2}-\d{2}$/.test(g.args[0]) && g.args[6] === '', `grava só 7 valores (dia, versão, evento, etapa, origem, ambiente, botão): ${JSON.stringify(g.args)}`);
    check(/ON CONFLICT \(dia, versao, evento, etapa, origem, ambiente, botao\)/.test(g.sql), 'a chave da soma inclui origem, ambiente e botão');
    check(/ON CONFLICT .* DO UPDATE SET total = total \+ 1/.test(g.sql), 'soma +1 na linha existente (agregado)');
    check(fn.diaBrasil(Date.UTC(2026, 9, 25, 2, 30)) === '2026-10-24', 'dia em horário de Brasília: 02:30 UTC de 25/10 conta em 24/10');
  }

  // Inválidos: 400 e nada gravado.
  const invalidos = [
    // Regressão: nomes longos dos campos (testados à mão em produção, 24/10) não são o formato do contador.
    ['nomes longos {evento, versao}', {evento: 'visita', versao: 'v19'}],
    ['nomes longos com etapa', {evento: 'visita', versao: 'v19', etapa: 0}],
    ['mistura de nomes', {e: 'visita', versao: 'v19'}],
    ['evento fora da lista', {e: 'compra', v: 'v19'}],
    ['evento Purchase', {e: 'Purchase', v: 'v19'}],
    ['etapa 0', {e: 'etapa', n: 0, v: 'v19'}],
    ['etapa 15', {e: 'etapa', n: 15, v: 'v19'}],
    ['etapa negativa', {e: 'etapa', n: -1, v: 'v19'}],
    ['etapa decimal', {e: 'etapa', n: 2.5, v: 'v19'}],
    ['etapa como texto', {e: 'etapa', n: '3', v: 'v19'}],
    ['etapa sem número', {e: 'etapa', v: 'v19'}],
    ['número em evento que não é etapa', {e: 'inicio', n: 1, v: 'v19'}],
    ['sem versão', {e: 'inicio'}],
    ['versão fora do formato', {e: 'inicio', v: 'beta'}],
    ['versão longa', {e: 'inicio', v: 'v12345'}],
    ['campo a mais (resposta)', {e: 'etapa', n: 3, v: 'v19', idade: 'i40'}],
    ['campo a mais (peso)', {e: 'inicio', v: 'v19', peso: 82}],
    ['evento como número', {e: 1, v: 'v19'}],
    ['lista em vez de objeto', ['inicio', 'v19']],
    ['nulo', null]
  ];
  for (const [nome, corpo] of invalidos) {
    const {res, db} = await chama(pedido(JSON.stringify(corpo)));
    check(res.status === 400 && db.gravado.length === 0, `inválido (${nome}): 400 e nada gravado`);
  }
  {
    const {res, db} = await chama(pedido('isto não é json'));
    check(res.status === 400 && !db.gravado.length, 'corpo que não é JSON: 400');
  }
  {
    const {res, db} = await chama(pedido(''));
    check(res.status === 400 && !db.gravado.length, 'corpo vazio: 400');
  }

  // Tamanho: corpo grande é recusado, mesmo mentindo no Content-Length.
  {
    const grande = JSON.stringify({e: 'inicio', v: 'v19', x: 'a'.repeat(500)});
    const {res, db} = await chama(pedido(grande));
    check(res.status === 413 && !db.gravado.length, 'corpo maior que 128 bytes: 413');
    const {res: res2, db: db2} = await chama(pedido(grande, {headers: {'Content-Length': '20'}}));
    check([400, 413].includes(res2.status) && !db2.gravado.length, `corpo grande com Content-Length falso: recusado (${res2.status})`);
  }

  // Corpo sem Content-Length (enviado aos pedaços): ainda é cortado em 128 bytes.
  {
    const enc = new TextEncoder();
    const pedacos = (texto) => new ReadableStream({start(c) { for (let i = 0; i < texto.length; i += 40) c.enqueue(enc.encode(texto.slice(i, i + 40))); c.close(); }});
    const semTamanho = (texto) => new Request(URL_FN, {method: 'POST', headers: {Origin: 'https://oalemdacaneta.com.br', 'Content-Type': 'text/plain'}, body: pedacos(texto), duplex: 'half'});
    const {res, db} = await chama(semTamanho(JSON.stringify({e: 'inicio', v: 'v19', x: 'a'.repeat(5000)})));
    check(res.status === 413 && !db.gravado.length, 'corpo grande enviado aos pedaços, sem Content-Length: 413');
    const {res: r2, db: d2} = await chama(semTamanho(JSON.stringify({e: 'etapa', n: 4, v: 'v19'})));
    check(r2.status === 204 && d2.gravado.length === 1, 'corpo válido enviado aos pedaços: 204');
  }

  // Tipo de conteúdo: só texto ou JSON.
  {
    const corpo = JSON.stringify({e: 'inicio', v: 'v19'});
    const {res, db} = await chama(pedido(corpo, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}));
    check(res.status === 415 && !db.gravado.length, 'Content-Type de formulário: 415');
    const {res: r2} = await chama(pedido(corpo, {headers: {'Content-Type': 'application/json'}}));
    check(r2.status === 204, 'Content-Type application/json: aceito');
    const {res: r3, db: d3} = await chama(new Request(URL_FN, {method: 'POST', headers: {Origin: 'https://oalemdacaneta.com.br'}, body: new Uint8Array([123, 255, 254, 125])}));
    check(r3.status === 415 && !d3.gravado.length, 'bytes sem Content-Type: 415');
    const {res: r4, db: d4} = await chama(new Request(URL_FN, {method: 'POST', headers: {Origin: 'https://oalemdacaneta.com.br', 'Content-Type': 'text/plain'}, body: new Uint8Array([123, 255, 254, 125])}));
    check(r4.status === 400 && !d4.gravado.length, 'texto com bytes inválidos (não UTF-8): 400');
  }

  // Método: só POST.
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']) {
    const {res, db} = await chama(pedido(['GET', 'HEAD'].includes(method) ? '' : '{}', {method}));
    check(res.status === 405 && res.headers.get('Allow') === 'POST' && !db.gravado.length, `${method}: 405 com Allow: POST`);
  }

  // Origem: só a própria página.
  {
    const corpo = JSON.stringify({e: 'inicio', v: 'v19'});
    const {res, db} = await chama(pedido(corpo, {origin: 'https://site-de-fora.com'}));
    check(res.status === 403 && !db.gravado.length, 'outra origem: 403');
    const {res: r2} = await chama(pedido(corpo, {origin: null}));
    check(r2.status === 403, 'sem Origin e sem Sec-Fetch-Site: 403');
    const {res: r3, db: d3} = await chama(pedido(corpo, {origin: null, headers: {'Sec-Fetch-Site': 'same-origin'}}));
    check(r3.status === 204 && d3.gravado.length === 1, 'sem Origin, mas Sec-Fetch-Site same-origin: aceito');
    const {res: r4} = await chama(pedido(corpo, {origin: 'null'}));
    check(r4.status === 403, 'Origin "null": 403');
  }

  // Origem (utm_source normalizado) e ambiente (pelo hostname, no servidor).
  {
    const grava = async (body, url) => { const db = bancoFalso(); const r = new Request(url || URL_FN, {method: 'POST', headers: {'Content-Type': 'text/plain', Origin: new URL(url || URL_FN).origin}, body: JSON.stringify(body)}); const res = await fn.onRequest({request: r, env: {DB: db}}); return {res, a: db.gravado[0] && db.gravado[0].args}; };
    let x = await grava({e: 'inicio', v: 'v20', o: 'facebook'});
    check(x.res.status === 204 && x.a[4] === 'facebook' && x.a[5] === 'producao', 'origem "facebook" em oalemdacaneta.com.br: grava facebook / producao');
    x = await grava({e: 'inicio', v: 'v20'});
    check(x.a[4] === 'direto', 'sem origem: grava "direto"');
    x = await grava({e: 'inicio', v: 'v20', o: '  Instagram '});
    check(x.a[4] === 'instagram', 'origem em maiúsculas e com espaço: normalizada');
    x = await grava({e: 'inicio', v: 'v20', o: 'joao@email.com'});
    check(x.a[4] === 'outro', 'origem fora do padrão (ex.: e-mail): grava "outro", nunca o texto');
    x = await grava({e: 'inicio', v: 'v20', o: 'a'.repeat(40)});
    check(x.a[4] === 'outro', 'origem longa: "outro"');
    x = await grava({e: 'inicio', v: 'v20', o: 5});
    check(x.res.status === 400 && !x.a, 'origem que não é texto: 400');
    x = await grava({e: 'checkout', v: 'v21', o: 'fb', b: 'cta-2'});
    check(x.res.status === 204 && x.a[2] === 'checkout' && x.a[6] === 'cta-2', 'checkout com botão cta-2: grava o botão');
    x = await grava({e: 'ver_oferta', v: 'v21', o: 'fb'});
    check(x.res.status === 204 && x.a[2] === 'ver_oferta' && x.a[6] === '', 'ver_oferta (barra fixa): 204, sem botão');
    for (const [nome, body] of [['botão fora da lista', {e: 'checkout', v: 'v21', b: 'stickyCta'}], ['botão em evento que não é checkout', {e: 'oferta', v: 'v21', b: 'cta'}], ['botão que não é texto', {e: 'checkout', v: 'v21', b: 1}]]) {
      x = await grava(body);
      check(x.res.status === 400 && !x.a, `${nome}: 400`);
    }
    x = await grava({e: 'inicio', v: 'v20', o: 'fb'}, 'https://receitacaneta.pages.dev/api/contagem');
    check(x.a[5] === 'teste', '*.pages.dev: ambiente "teste"');
    x = await grava({e: 'inicio', v: 'v20', o: 'fb'}, 'https://www.oalemdacaneta.com.br/api/contagem');
    check(x.a[5] === 'teste', 'outro hostname (www): "teste"');
  }

  // Banco: sem binding → 503; falha do D1 → 500 sem vazar o erro.
  {
    const corpo = JSON.stringify({e: 'inicio', v: 'v19'});
    const res = await fn.onRequest({request: pedido(corpo), env: {}});
    check(res.status === 503, 'sem o binding DB: 503 (nada gravado)');
    const {res: r2} = await chama(pedido(corpo), bancoFalso(true));
    const texto = await r2.text();
    check(r2.status === 500 && !texto.includes('D1') && !texto.includes('detalhe'), 'falha do D1: 500 sem detalhes do erro');
  }

  // Respostas não ficam em cache e não têm corpo.
  {
    const {res} = await chama(pedido(JSON.stringify({e: 'visita', v: 'v19'})));
    check(res.headers.get('Cache-Control') === 'no-store' && (await res.text()) === '', 'resposta sem corpo e com Cache-Control: no-store');
  }

  console.log(out.join('\n'));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
