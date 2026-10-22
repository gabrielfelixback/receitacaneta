// Validação do que o quiz manda para o backend. Código puro (sem Deno nem
// Supabase) para rodar igual na Edge Function e nos testes em Node.
// Regra: nada de texto livre. Respostas são códigos curtos; peso (kg) e altura
// (cm) são os únicos números. Qualquer coisa fora disso é recusada ou descartada.

export const TIPOS = ['inicio', 'etapa', 'concluido', 'checkout'] as const;
export type Tipo = (typeof TIPOS)[number];

// Mesmos códigos de PERFIS no quiz/index.html.
export const PERFIS = ['economia', 'gelado', 'doce', 'lanche', 'prato_pequeno'] as const;

// fbclid fica de fora: liga a pessoa ao perfil dela no Meta, e aqui ela ficaria junto de peso e sintomas.
export const UTM_CHAVES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'] as const;

export const LIMITES = {
  corpoBytes: 8 * 1024,
  respostas: 20,
  itensLista: 12,
  etapaMax: 40,
  utmTexto: 200,
  pesoMin: 30,
  pesoMax: 300,
  alturaMin: 120,
  alturaMax: 230,
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHAVE = /^[a-z_]{1,24}$/;
const CODIGO = /^[a-z0-9_]{1,32}$/;
const VERSAO = /^[a-z0-9._-]{1,20}$/i;

export type Registro = {
  sessao: string;
  tipo: Tipo;
  etapa: number | null;
  respostas: Record<string, string | number | string[]>;
  perfil: string | null;
  utm: Record<string, string>;
  versao: string | null;
  passo: string | null;
};

export type Resultado = { ok: true; dados: Registro } | { ok: false; erro: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function limparRespostas(v: unknown): Registro['respostas'] | null {
  if (v === undefined || v === null) return {};
  if (!isObj(v)) return null;
  const entradas = Object.entries(v);
  if (entradas.length > LIMITES.respostas) return null;
  const out: Registro['respostas'] = {};
  for (const [k, val] of entradas) {
    if (!CHAVE.test(k)) return null;
    if (typeof val === 'string') {
      if (!CODIGO.test(val)) return null;
      out[k] = val;
    } else if (typeof val === 'number') {
      const [lo, hi] = k === 'peso' ? [LIMITES.pesoMin, LIMITES.pesoMax] : k === 'altura' ? [LIMITES.alturaMin, LIMITES.alturaMax] : [NaN, NaN];
      if (!Number.isFinite(val) || !(val >= lo && val <= hi)) return null;
      out[k] = Math.round(val);
    } else if (Array.isArray(val)) {
      if (val.length > LIMITES.itensLista || !val.every((x) => typeof x === 'string' && CODIGO.test(x))) return null;
      out[k] = [...new Set(val as string[])];
    } else {
      return null;
    }
  }
  return out;
}

// UTMs são só para relatório: chave desconhecida é descartada, texto longo é cortado.
function limparUtm(v: unknown): Record<string, string> {
  if (!isObj(v)) return {};
  const out: Record<string, string> = {};
  for (const k of UTM_CHAVES) {
    const val = v[k];
    if (typeof val === 'string' && val.trim()) out[k] = val.trim().slice(0, LIMITES.utmTexto);
  }
  return out;
}

export function validarRegistro(corpo: unknown): Resultado {
  if (!isObj(corpo)) return { ok: false, erro: 'corpo invalido' };

  const { sessao, tipo, etapa, respostas, perfil, utm, versao, passo } = corpo;
  if (typeof sessao !== 'string' || !UUID.test(sessao)) return { ok: false, erro: 'sessao invalida' };
  if (typeof tipo !== 'string' || !(TIPOS as readonly string[]).includes(tipo)) return { ok: false, erro: 'tipo invalido' };

  let etapaOk: number | null = null;
  if (etapa !== undefined && etapa !== null) {
    if (!Number.isInteger(etapa) || (etapa as number) < 0 || (etapa as number) > LIMITES.etapaMax) {
      return { ok: false, erro: 'etapa invalida' };
    }
    etapaOk = etapa as number;
  }
  if (tipo === 'etapa' && etapaOk === null) return { ok: false, erro: 'etapa obrigatoria' };

  const resp = limparRespostas(respostas);
  if (!resp) return { ok: false, erro: 'respostas invalidas' };

  let perfilOk: string | null = null;
  if (perfil !== undefined && perfil !== null) {
    if (typeof perfil !== 'string' || !(PERFIS as readonly string[]).includes(perfil)) return { ok: false, erro: 'perfil invalido' };
    perfilOk = perfil;
  }

  const versaoOk = typeof versao === 'string' && VERSAO.test(versao) ? versao : null;
  const passoOk = typeof passo === 'string' && CODIGO.test(passo) ? passo : null;

  return {
    ok: true,
    dados: {
      sessao: sessao.toLowerCase(),
      tipo: tipo as Tipo,
      etapa: etapaOk,
      respostas: resp,
      perfil: perfilOk,
      utm: limparUtm(utm),
      versao: versaoOk,
      passo: passoOk,
    },
  };
}

// Primeiro IP do x-forwarded-for (o cliente), sem porta.
export function ipDoCliente(xff: string | null, real: string | null): string | null {
  const bruto = (xff ?? '').split(',')[0].trim() || (real ?? '').trim();
  return bruto || null;
}
