-- Engenhando · 0002_modulo_rdo.sql
-- Tabelas específicas do Módulo 1 (RDO Automático).
-- Depende de 0001_base_schema.sql já aplicada.

create table if not exists registros_dia (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  data date not null default current_date,
  criado_por uuid references usuarios(id),
  fechado boolean not null default false,
  fechado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (obra_id, data)
);

-- Liga cada mídia captada em campo a um dia específico de obra.
alter table midias
  add column if not exists registro_dia_id uuid references registros_dia(id) on delete cascade;

create index if not exists idx_midias_registro_dia on midias(registro_dia_id);

create table if not exists rdos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  registro_dia_id uuid not null references registros_dia(id) on delete cascade,
  resumo_estruturado jsonb, -- { atividades: [...], ocorrencias: [...], observacoes: "..." }
  pdf_url text,
  status text not null default 'rascunho' check (status in ('rascunho', 'processando', 'gerado', 'enviado')),
  gerado_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (registro_dia_id)
);

create index if not exists idx_rdos_obra on rdos(obra_id);

alter table registros_dia enable row level security;
alter table rdos enable row level security;

create policy "usuarios veem registros das obras da propria conta" on registros_dia
  for select using (obra_id in (
    select o.id from obras o
    join usuarios u on u.conta_id = o.conta_id
    where u.id = auth.uid()
  ));

create policy "usuarios gerenciam registros das obras da propria conta" on registros_dia
  for all using (obra_id in (
    select o.id from obras o
    join usuarios u on u.conta_id = o.conta_id
    where u.id = auth.uid()
  ));

create policy "usuarios veem rdos das obras da propria conta" on rdos
  for select using (obra_id in (
    select o.id from obras o
    join usuarios u on u.conta_id = o.conta_id
    where u.id = auth.uid()
  ));

create policy "usuarios gerenciam rdos das obras da propria conta" on rdos
  for all using (obra_id in (
    select o.id from obras o
    join usuarios u on u.conta_id = o.conta_id
    where u.id = auth.uid()
  ));
