// Contador agregado do funil do quiz (Cloudflare Pages Function → POST /api/contagem).
//
// Recebe só {e: evento, n: etapa, v: versão, o: origem, b: botão} e soma +1 numa linha (dia, versão, evento, etapa, origem, ambiente, botão) do D1.
// botão = id do botão que levou ao checkout (cta ou cta-2); só no evento "checkout".
// origem = utm_source da visita (normalizado; sem utm = "direto"); ambiente vem do servidor pelo hostname.
// Não lê nem grava IP, navegador, cookies, URL ou respostas do quiz: a tabela só tem totais.
// A infraestrutura da Cloudflare ainda processa os dados técnicos da conexão (como o IP) para entregar o pedido;
// isso é da hospedagem, não desta função.
//
// Binding esperado: DB (D1). Sem o binding a função responde 503 e não grava nada; o quiz não depende da resposta.

export const EVENTOS = ['visita', 'inicio', 'etapa', 'conclusao', 'oferta', 'ver_oferta', 'checkout', 'upsell', 'downsell'];
export const BOTOES = ['cta', 'cta-2'];
export const ETAPAS = 14;
const MAX_CORPO = 128; // bytes; o maior corpo válido tem ~70
const VERSAO = /^v\d{1,4}$/;
const ORIGEM = /^[a-z0-9._-]{1,30}$/;
export const DOMINIO_PRODUCAO = 'oalemdacaneta.com.br';

// "producao" só no domínio oficial; prévias, *.pages.dev e localhost contam como "teste".
export const ambienteDe = (url) => (new URL(url).hostname === DOMINIO_PRODUCAO ? 'producao' : 'teste');

// utm_source em minúsculas; vazio vira "direto" e qualquer coisa fora do padrão vira "outro" (não guarda texto livre).
export const normalizarOrigem = (o) => {
  const t = String(o || '').trim().toLowerCase();
  return !t ? 'direto' : ORIGEM.test(t) ? t : 'outro';
};

const resposta = (status, extra = {}) => new Response(null, {status, headers: {'Cache-Control': 'no-store', ...extra}});

// Dia no horário de Brasília (UTC−3, sem horário de verão desde 2019). Vem do servidor, nunca do navegador.
export const diaBrasil = (agora = Date.now()) => new Date(agora - 3 * 3600 * 1000).toISOString().slice(0, 10);

// sendBeacon e fetch com texto mandam text/plain; também aceitamos application/json. Outros tipos: 415.
const tipoAceito = (request) => /^(text\/plain|application\/json)(\s*;|$)/i.test(request.headers.get('Content-Type') || '');

// Lê o corpo parando em MAX_CORPO bytes, sem confiar no Content-Length (que pode faltar ou mentir).
const lerCorpo = async (request) => {
  if (!request.body) return '';
  const leitor = request.body.getReader();
  const partes = [];
  let total = 0;
  for (;;) {
    const {done, value} = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_CORPO) { try { await leitor.cancel(); } catch (e) {} return null; }
    partes.push(value);
  }
  const junto = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) { junto.set(p, pos); pos += p.byteLength; }
  try { return new TextDecoder('utf-8', {fatal: true}).decode(junto); } catch (e) { return undefined; }
};

// Só aceita pedido da própria página: Origin igual ao host do pedido (ou, sem Origin, Sec-Fetch-Site same-origin).
const mesmaOrigem = (request) => {
  const host = new URL(request.url).host;
  const origin = request.headers.get('Origin');
  if (origin) { try { return new URL(origin).host === host; } catch (e) { return false; } }
  return request.headers.get('Sec-Fetch-Site') === 'same-origin';
};

// Valida o corpo e devolve {evento, etapa, versao, origem, botao} ou null. Qualquer campo a mais, tipo errado ou valor fora da lista = null.
export const validar = (texto) => {
  let d;
  try { d = JSON.parse(texto); } catch (e) { return null; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const chaves = Object.keys(d);
  if (chaves.some((k) => !['e', 'n', 'v', 'o', 'b'].includes(k))) return null;
  if (typeof d.e !== 'string' || !EVENTOS.includes(d.e)) return null;
  if (typeof d.v !== 'string' || !VERSAO.test(d.v)) return null;
  if ('o' in d && typeof d.o !== 'string') return null;
  const origem = normalizarOrigem(d.o);
  if ('b' in d && (d.e !== 'checkout' || !BOTOES.includes(d.b))) return null; // botão só no checkout
  const botao = d.b || '';
  if (d.e === 'etapa') {
    if (!Number.isInteger(d.n) || d.n < 1 || d.n > ETAPAS) return null;
    return {evento: d.e, etapa: d.n, versao: d.v, origem, botao};
  }
  if ('n' in d) return null; // só "etapa" tem número
  return {evento: d.e, etapa: 0, versao: d.v, origem, botao};
};

const contar = async ({request, env}) => {
  if (!mesmaOrigem(request)) return resposta(403);
  if (!tipoAceito(request)) return resposta(415);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_CORPO) return resposta(413);
  const texto = await lerCorpo(request);
  if (texto === null) return resposta(413);
  if (texto === undefined) return resposta(400);
  const ev = validar(texto);
  if (!ev) return resposta(400);
  if (!env || !env.DB) return resposta(503);
  try {
    await env.DB.prepare(
      'INSERT INTO contagem (dia, versao, evento, etapa, origem, ambiente, botao, total) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1) ' +
      'ON CONFLICT (dia, versao, evento, etapa, origem, ambiente, botao) DO UPDATE SET total = total + 1'
    ).bind(diaBrasil(), ev.versao, ev.evento, ev.etapa, ev.origem, ambienteDe(request.url), ev.botao).run();
  } catch (e) {
    return resposta(500); // sem detalhes do erro na resposta e sem registrar o pedido
  }
  return resposta(204);
};

// Um único handler para a rota: POST conta, qualquer outro método recebe 405.
export const onRequest = (ctx) => (ctx.request.method === 'POST' ? contar(ctx) : resposta(405, {Allow: 'POST'}));
