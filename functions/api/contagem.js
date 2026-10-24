// Contador agregado do funil do quiz (Cloudflare Pages Function → POST /api/contagem).
//
// Recebe só {e: evento, n: etapa, v: versão} e soma +1 numa linha (dia, versão, evento, etapa) do D1.
// Não lê nem grava IP, navegador, cookies, origem da visita, URL ou respostas do quiz: a tabela só tem totais.
// A infraestrutura da Cloudflare ainda processa os dados técnicos da conexão (como o IP) para entregar o pedido;
// isso é da hospedagem, não desta função.
//
// Binding esperado: DB (D1). Sem o binding a função responde 503 e não grava nada; o quiz não depende da resposta.

export const EVENTOS = ['visita', 'inicio', 'etapa', 'conclusao', 'oferta', 'checkout', 'upsell', 'downsell'];
export const ETAPAS = 14;
const MAX_CORPO = 128; // bytes; o maior corpo válido tem ~35
const VERSAO = /^v\d{1,4}$/;

const resposta = (status, extra = {}) => new Response(null, {status, headers: {'Cache-Control': 'no-store', ...extra}});

// Dia no horário de Brasília (UTC−3, sem horário de verão desde 2019). Vem do servidor, nunca do navegador.
export const diaBrasil = (agora = Date.now()) => new Date(agora - 3 * 3600 * 1000).toISOString().slice(0, 10);

// Só aceita pedido da própria página: Origin igual ao host do pedido (ou, sem Origin, Sec-Fetch-Site same-origin).
const mesmaOrigem = (request) => {
  const host = new URL(request.url).host;
  const origin = request.headers.get('Origin');
  if (origin) { try { return new URL(origin).host === host; } catch (e) { return false; } }
  return request.headers.get('Sec-Fetch-Site') === 'same-origin';
};

// Valida o corpo e devolve {evento, etapa, versao} ou null. Qualquer campo a mais, tipo errado ou valor fora da lista = null.
export const validar = (texto) => {
  let d;
  try { d = JSON.parse(texto); } catch (e) { return null; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const chaves = Object.keys(d);
  if (chaves.some((k) => !['e', 'n', 'v'].includes(k))) return null;
  if (typeof d.e !== 'string' || !EVENTOS.includes(d.e)) return null;
  if (typeof d.v !== 'string' || !VERSAO.test(d.v)) return null;
  if (d.e === 'etapa') {
    if (!Number.isInteger(d.n) || d.n < 1 || d.n > ETAPAS) return null;
    return {evento: d.e, etapa: d.n, versao: d.v};
  }
  if ('n' in d) return null; // só "etapa" tem número
  return {evento: d.e, etapa: 0, versao: d.v};
};

const contar = async ({request, env}) => {
  if (!mesmaOrigem(request)) return resposta(403);
  const tamanho = Number(request.headers.get('Content-Length') || 0);
  if (tamanho > MAX_CORPO) return resposta(413);
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > MAX_CORPO) return resposta(413);
  const ev = validar(texto);
  if (!ev) return resposta(400);
  if (!env || !env.DB) return resposta(503);
  try {
    await env.DB.prepare(
      'INSERT INTO contagem (dia, versao, evento, etapa, total) VALUES (?1, ?2, ?3, ?4, 1) ' +
      'ON CONFLICT (dia, versao, evento, etapa) DO UPDATE SET total = total + 1'
    ).bind(diaBrasil(), ev.versao, ev.evento, ev.etapa).run();
  } catch (e) {
    return resposta(500); // sem detalhes do erro na resposta e sem registrar o pedido
  }
  return resposta(204);
};

// Um único handler para a rota: POST conta, qualquer outro método recebe 405.
export const onRequest = (ctx) => (ctx.request.method === 'POST' ? contar(ctx) : resposta(405, {Allow: 'POST'}));
