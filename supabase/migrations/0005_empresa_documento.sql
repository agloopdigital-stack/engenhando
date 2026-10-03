-- Campos para o documento sair com endereço completo e assinatura do RT.
-- A cor do traço do PDF fica na conta, e o dono da conta pode atualizá-la.

alter table perfis_empresa
  add column if not exists registro_responsavel text,
  add column if not exists carimbo_url text,
  add column if not exists numero text,
  add column if not exists complemento text;

drop policy if exists "usuarios atualizam a propria conta" on contas;
create policy "usuarios atualizam a propria conta" on contas
  for update
  using (id = public.conta_id_atual())
  with check (id = public.conta_id_atual());
