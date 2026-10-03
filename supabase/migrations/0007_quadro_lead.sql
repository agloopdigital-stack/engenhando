-- Quadro de leads da conta: nome, ordem, visibilidade e cabeçalho.
-- Fechado e Perdido permanecem sempre visíveis.

create or replace function public.quadro_lead_valido(cabecalho text, colunas jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  item jsonb;
  estagios text[] := array['novo', 'proposta_enviada', 'follow_up', 'fechado', 'perdido'];
  vistos text[] := '{}';
  estagio text;
  rotulo text;
begin
  if cabecalho not in ('contagem', 'soma', 'ambos') then
    return false;
  end if;

  if jsonb_typeof(colunas) <> 'array' or jsonb_array_length(colunas) <> 5 then
    return false;
  end if;

  for item in select value from jsonb_array_elements(colunas)
  loop
    estagio := item->>'estagio';
    rotulo := btrim(coalesce(item->>'rotulo', ''));

    if estagio is null or not (estagio = any (estagios)) or estagio = any (vistos) then
      return false;
    end if;

    if rotulo = '' or char_length(rotulo) > 40 then
      return false;
    end if;

    if jsonb_typeof(item->'visivel') <> 'boolean' then
      return false;
    end if;

    if estagio in ('fechado', 'perdido') and (item->>'visivel')::boolean = false then
      return false;
    end if;

    vistos := vistos || estagio;
  end loop;

  return cardinality(vistos) = 5;
end;
$$;

create table if not exists quadros_lead (
  conta_id uuid primary key references contas(id) on delete cascade,
  cabecalho text not null default 'ambos',
  colunas jsonb not null,
  atualizado_em timestamptz not null default now(),
  constraint quadros_lead_valido check (public.quadro_lead_valido(cabecalho, colunas))
);

alter table quadros_lead enable row level security;

drop policy if exists "usuarios veem quadro da propria conta" on quadros_lead;
create policy "usuarios veem quadro da propria conta" on quadros_lead
  for select using (conta_id = public.conta_id_atual());

drop policy if exists "usuarios criam quadro da propria conta" on quadros_lead;
create policy "usuarios criam quadro da propria conta" on quadros_lead
  for insert with check (conta_id = public.conta_id_atual());

drop policy if exists "usuarios atualizam quadro da propria conta" on quadros_lead;
create policy "usuarios atualizam quadro da propria conta" on quadros_lead
  for update
  using (conta_id = public.conta_id_atual())
  with check (conta_id = public.conta_id_atual());
