-- Engenhando · 0001_base_schema.sql
-- Tabelas base compartilhadas por todos os módulos.
-- Rode esta migration antes de qualquer migration de módulo específico.

create extension if not exists "pgcrypto";

-- Conta = escritório de engenharia ou engenheiro autônomo.
create table if not exists contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  logo_url text,
  cor_primaria text,
  cor_secundaria text,
  criado_em timestamptz not null default now()
);

-- Usuário vinculado a uma conta. Referencia auth.users do Supabase Auth.
create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  conta_id uuid not null references contas(id) on delete cascade,
  nome text not null,
  papel text not null check (papel in ('engenheiro', 'mestre_obra', 'cliente')),
  criado_em timestamptz not null default now()
);

create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  nome text not null,
  endereco text,
  cliente_nome text,
  cliente_contato text,
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'concluida')),
  data_inicio date,
  criado_em timestamptz not null default now()
);

-- Tabela genérica de mídia (foto/áudio) usada pelo RDO e reaproveitável
-- por outros módulos (ex.: foto de nota fiscal no módulo financeiro).
create table if not exists midias (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  tipo text not null check (tipo in ('foto', 'audio', 'texto')),
  url_storage text,
  texto text,
  transcricao text,
  criado_por uuid references usuarios(id),
  criado_em timestamptz not null default now()
);

create index if not exists idx_usuarios_conta on usuarios(conta_id);
create index if not exists idx_obras_conta on obras(conta_id);
create index if not exists idx_midias_obra on midias(obra_id);

-- RLS: cada usuário só enxerga dados da própria conta.
alter table contas enable row level security;
alter table usuarios enable row level security;
alter table obras enable row level security;
alter table midias enable row level security;

create policy "usuarios veem a propria conta" on contas
  for select using (id in (select conta_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios veem colegas da mesma conta" on usuarios
  for select using (conta_id in (select conta_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios veem obras da propria conta" on obras
  for select using (conta_id in (select conta_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios gerenciam obras da propria conta" on obras
  for all using (conta_id in (select conta_id from usuarios where usuarios.id = auth.uid()));

create policy "usuarios veem midias das obras da propria conta" on midias
  for select using (obra_id in (
    select o.id from obras o
    join usuarios u on u.conta_id = o.conta_id
    where u.id = auth.uid()
  ));

create policy "usuarios inserem midias nas obras da propria conta" on midias
  for insert with check (obra_id in (
    select o.id from obras o
    join usuarios u on u.conta_id = o.conta_id
    where u.id = auth.uid()
  ));
