-- Dados do escritório ou engenheiro, um por conta.
-- Usados no cabeçalho de RDO, proposta e documentos.

create table if not exists perfis_empresa (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade unique,
  razao_social text,
  nome_fantasia text,
  cnpj text,
  crea text,
  responsavel_tecnico text,
  cpf_responsavel text,
  telefone text,
  whatsapp text,
  email text,
  site text,
  logo_url text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  inscricao_municipal text,
  pix_chave text,
  banco text,
  agencia text,
  conta_bancaria text,
  observacoes_comerciais text,
  assinatura_padrao text,
  atualizado_em timestamptz not null default now()
);

alter table perfis_empresa enable row level security;

drop policy if exists "usuarios veem perfil da propria conta" on perfis_empresa;
create policy "usuarios veem perfil da propria conta" on perfis_empresa
  for select using (conta_id = public.conta_id_atual());

drop policy if exists "usuarios gerenciam perfil da propria conta" on perfis_empresa;
create policy "usuarios gerenciam perfil da propria conta" on perfis_empresa
  for all
  using (conta_id = public.conta_id_atual())
  with check (conta_id = public.conta_id_atual());

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos publicas" on storage.objects;
create policy "logos publicas" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "usuarios enviam logo da propria conta" on storage.objects;
create policy "usuarios enviam logo da propria conta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.conta_id_atual()::text
  );

drop policy if exists "usuarios atualizam logo da propria conta" on storage.objects;
create policy "usuarios atualizam logo da propria conta" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.conta_id_atual()::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.conta_id_atual()::text
  );
