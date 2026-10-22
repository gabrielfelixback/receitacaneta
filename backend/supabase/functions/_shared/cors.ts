// CORS do quiz. Em produção, ALLOWED_ORIGINS lista os domínios do quiz
// separados por vírgula (ex.: https://quiz.seudominio.com.br). Vazio = qualquer
// origem, só para testar.
const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function origemPermitida(origin: string | null): boolean {
  return configured.length === 0 || (!!origin && configured.includes(origin));
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = configured.length === 0 ? '*' : origin && configured.includes(origin) ? origin : configured[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}
