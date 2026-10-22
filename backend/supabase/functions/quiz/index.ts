// Edge Function: quiz
// POST /quiz  corpo JSON (enviado como text/plain para não gerar preflight):
//   { sessao: uuid, tipo: 'inicio'|'etapa'|'concluido'|'checkout', etapa?, respostas?, perfil?, utm?, versao? }
// -> { ok: true } ou { ok: false, erro }
// Pública (deploy com --no-verify-jwt): o quiz roda sem login. A proteção é
// a lista de origens, o limite de tamanho, a validação estrita e os limites
// por IP/sessão dentro de quiz_registrar. Nunca devolve dados ao navegador.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json, origemPermitida } from '../_shared/cors.ts';
import { ipDoCliente, LIMITES, validarRegistro } from '../_shared/validar.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const SAL = Deno.env.get('QUIZ_IP_SALT') ?? '';

async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip || !SAL) return null;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SAL + ip));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ ok: false, erro: 'metodo' }, 405, origin);
  if (!origemPermitida(origin)) return json({ ok: false, erro: 'origem' }, 403, origin);

  const texto = await req.text();
  if (new TextEncoder().encode(texto).length > LIMITES.corpoBytes) return json({ ok: false, erro: 'grande demais' }, 413, origin);

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return json({ ok: false, erro: 'json invalido' }, 400, origin);
  }

  const v = validarRegistro(corpo);
  if (!v.ok) return json({ ok: false, erro: v.erro }, 400, origin);
  const d = v.dados;

  const ip = ipDoCliente(req.headers.get('x-forwarded-for'), req.headers.get('x-real-ip'));
  const { data, error } = await db.rpc('quiz_registrar', {
    p_sessao: d.sessao,
    p_tipo: d.tipo,
    p_etapa: d.etapa,
    p_respostas: d.respostas,
    p_perfil: d.perfil,
    p_utm: d.utm,
    p_ip_hash: await hashIp(ip),
    p_versao: d.versao,
  });
  if (error) {
    console.error('quiz_registrar', error.message);
    return json({ ok: false, erro: 'falha ao salvar' }, 500, origin);
  }
  const r = data as { ok: boolean; erro?: string };
  return json(r, r.ok ? 200 : 429, origin);
});
