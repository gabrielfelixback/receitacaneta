-- =====================================================================
-- Quiz de receitas para quem usa caneta (GLP-1): sessões, eventos e funil.
-- Tudo é anônimo: não guardamos nome, e-mail, telefone nem IP. O IP vira um
-- hash com sal (só para limitar abuso) e as respostas são códigos curtos.
-- Acesso: só o backend (service_role). RLS ligada e forçada, sem policy,
-- então anon e authenticated não leem nem escrevem nada direto.
-- =====================================================================

create table quiz_sessoes (
  id            uuid primary key,
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  ip_hash       text,
  versao        text,
  utm           jsonb not null default '{}'::jsonb,
  respostas     jsonb not null default '{}'::jsonb,
  etapa_max     smallint not null default 0,
  perfil        text,
  concluida_em  timestamptz,
  checkout_em   timestamptz
);
comment on table quiz_sessoes is 'Uma linha por pessoa que abriu o quiz. Respostas anônimas, mescladas a cada etapa.';
comment on column quiz_sessoes.ip_hash is 'sha256(sal + IP). Só para limitar sessões por hora; não identifica a pessoa.';
comment on column quiz_sessoes.perfil is 'Perfil calculado no fim do quiz (economia, gelado, doce, lanche, prato_pequeno).';

create index quiz_sessoes_criada_em_idx on quiz_sessoes (criada_em);
create index quiz_sessoes_ip_hash_idx on quiz_sessoes (ip_hash, criada_em);

create table quiz_eventos (
  id        bigint generated always as identity primary key,
  sessao_id uuid not null references quiz_sessoes (id) on delete cascade,
  tipo      text not null check (tipo in ('inicio', 'etapa', 'concluido', 'checkout')),
  etapa     smallint,
  criado_em timestamptz not null default now()
);
comment on table quiz_eventos is 'Linha do tempo de cada sessão. Alimenta a view do funil (onde as pessoas saem).';

create index quiz_eventos_sessao_idx on quiz_eventos (sessao_id);
create index quiz_eventos_criado_em_idx on quiz_eventos (criado_em);

alter table quiz_sessoes enable row level security;
alter table quiz_eventos enable row level security;
alter table quiz_sessoes force row level security;
alter table quiz_eventos force row level security;
revoke all on quiz_sessoes, quiz_eventos from anon, authenticated;

-- ---------------------------------------------------------------------
-- Registro atômico de um evento. Chamado só pela Edge Function `quiz`
-- (service_role). Cria a sessão na primeira chamada, mescla as respostas
-- e aplica dois limites: sessões novas por IP/hora e eventos por sessão.
-- ---------------------------------------------------------------------
create or replace function quiz_registrar(
  p_sessao    uuid,
  p_tipo      text,
  p_etapa     int,
  p_respostas jsonb,
  p_perfil    text,
  p_utm       jsonb,
  p_ip_hash   text,
  p_versao    text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_existe  boolean;
  v_eventos int;
begin
  select true into v_existe from quiz_sessoes where id = p_sessao for update;

  if v_existe is null then
    if p_ip_hash is not null and (
      select count(*) from quiz_sessoes
      where ip_hash = p_ip_hash and criada_em > now() - interval '1 hour'
    ) >= 40 then
      return jsonb_build_object('ok', false, 'erro', 'limite');
    end if;
    insert into quiz_sessoes (id, ip_hash, versao, utm)
    values (p_sessao, p_ip_hash, p_versao, coalesce(p_utm, '{}'::jsonb));
  end if;

  select count(*) into v_eventos from quiz_eventos where sessao_id = p_sessao;
  if v_eventos >= 80 then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;

  insert into quiz_eventos (sessao_id, tipo, etapa) values (p_sessao, p_tipo, p_etapa);

  update quiz_sessoes set
    atualizada_em = now(),
    respostas     = respostas || coalesce(p_respostas, '{}'::jsonb),
    etapa_max     = greatest(etapa_max, coalesce(p_etapa, 0)),
    perfil        = coalesce(p_perfil, perfil),
    concluida_em  = case when p_tipo = 'concluido' then coalesce(concluida_em, now()) else concluida_em end,
    checkout_em   = case when p_tipo = 'checkout' then coalesce(checkout_em, now()) else checkout_em end
  where id = p_sessao;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function quiz_registrar(uuid, text, int, jsonb, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function quiz_registrar(uuid, text, int, jsonb, text, jsonb, text, text) to service_role;

-- ---------------------------------------------------------------------
-- Leitura (Studio ou SQL): funil por etapa, resumo por dia e por perfil.
-- security_invoker: a view respeita as permissões de quem consulta.
-- ---------------------------------------------------------------------
create or replace view quiz_funil with (security_invoker = true) as
select
  etapa,
  count(distinct sessao_id) as pessoas,
  round(100.0 * count(distinct sessao_id)
    / nullif((select count(distinct sessao_id) from quiz_eventos where tipo = 'inicio'), 0), 1) as pct_do_inicio
from quiz_eventos
where tipo = 'etapa'
group by etapa
order by etapa;

create or replace view quiz_resumo_diario with (security_invoker = true) as
select
  (criada_em at time zone 'America/Sao_Paulo')::date as dia,
  count(*)                                   as sessoes,
  count(concluida_em)                        as concluidas,
  count(checkout_em)                         as foram_ao_checkout,
  round(100.0 * count(concluida_em) / nullif(count(*), 0), 1)         as pct_conclusao,
  round(100.0 * count(checkout_em) / nullif(count(concluida_em), 0), 1) as pct_checkout_dos_concluidos
from quiz_sessoes
group by 1
order by 1 desc;

create or replace view quiz_por_perfil with (security_invoker = true) as
select
  perfil,
  count(*)            as concluidas,
  count(checkout_em)  as foram_ao_checkout,
  round(100.0 * count(checkout_em) / nullif(count(*), 0), 1) as pct_checkout
from quiz_sessoes
where concluida_em is not null
group by perfil
order by concluidas desc;

create or replace view quiz_por_campanha with (security_invoker = true) as
select
  coalesce(utm ->> 'utm_campaign', '(sem campanha)') as campanha,
  coalesce(utm ->> 'utm_content', '(sem criativo)')  as criativo,
  count(*)            as sessoes,
  count(concluida_em) as concluidas,
  count(checkout_em)  as foram_ao_checkout
from quiz_sessoes
group by 1, 2
order by sessoes desc;

revoke all on quiz_funil, quiz_resumo_diario, quiz_por_perfil, quiz_por_campanha from anon, authenticated;

-- ---------------------------------------------------------------------
-- Retenção: apaga sessões com mais de 180 dias (eventos vão junto).
-- Agende com pg_cron: select cron.schedule('quiz-limpeza', '0 4 * * *', 'select quiz_limpar_antigos()');
-- ---------------------------------------------------------------------
create or replace function quiz_limpar_antigos() returns int
language sql
set search_path = public
as $$
  with apagadas as (
    delete from quiz_sessoes where criada_em < now() - interval '180 days' returning 1
  )
  select count(*)::int from apagadas;
$$;

revoke all on function quiz_limpar_antigos() from public, anon, authenticated;
grant execute on function quiz_limpar_antigos() to service_role;
