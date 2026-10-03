-- Funil de leads: contato separado, proposta com valor e registro de conversa.

alter table leads
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists endereco text;

update leads
set email = contato
where email is null
  and contato like '%@%';

update leads
set whatsapp = contato
where whatsapp is null
  and contato is not null
  and contato not like '%@%';

alter table propostas
  add column if not exists valor numeric,
  add column if not exists prazo_dias integer,
  add column if not exists escopo text;

create table if not exists contatos_lead (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  conta_id uuid not null references contas(id) on delete cascade,
  nota text not null,
  criado_em timestamptz not null default now()
);

alter table contatos_lead enable row level security;

drop policy if exists "usuarios veem contatos da propria conta" on contatos_lead;
create policy "usuarios veem contatos da propria conta" on contatos_lead
  for select using (conta_id = public.conta_id_atual());

drop policy if exists "usuarios registram contatos da propria conta" on contatos_lead;
create policy "usuarios registram contatos da propria conta" on contatos_lead
  for insert with check (
    conta_id = public.conta_id_atual()
    and exists (
      select 1 from leads
      where leads.id = contatos_lead.lead_id
        and leads.conta_id = public.conta_id_atual()
    )
  );

create index if not exists idx_contatos_lead_lead on contatos_lead (lead_id, criado_em desc);

create or replace function public.criar_template_padrao_conta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.templates_proposta (conta_id, nome, corpo_template)
  values (
    new.id,
    'Proposta padrão',
    $corpo$Cliente: {{cliente_nome}}

Escopo
{{escopo}}

Valor: {{valor}}
Prazo: {{prazo}} dias

{{empresa_nome}}
CNPJ {{cnpj}}
{{crea}}
{{cidade}}
PIX {{pix}}
$corpo$
  );
  return new;
end;
$$;

revoke all on function public.criar_template_padrao_conta() from public;

drop trigger if exists contas_template_padrao on contas;
create trigger contas_template_padrao
  after insert on contas
  for each row
  execute function public.criar_template_padrao_conta();

insert into templates_proposta (conta_id, nome, corpo_template)
select
  c.id,
  'Proposta padrão',
  $corpo$Cliente: {{cliente_nome}}

Escopo
{{escopo}}

Valor: {{valor}}
Prazo: {{prazo}} dias

{{empresa_nome}}
CNPJ {{cnpj}}
{{crea}}
{{cidade}}
PIX {{pix}}
$corpo$
from contas c
where not exists (
  select 1 from templates_proposta t where t.conta_id = c.id
);
