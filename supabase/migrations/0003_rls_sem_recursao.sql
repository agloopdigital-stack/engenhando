-- As policies liam `usuarios` dentro de `usuarios` (e de obras/midias/registros).
-- O Postgres aborta com 42P17: infinite recursion detected in policy for relation "usuarios".
-- A função security definer lê a conta uma vez, fora do RLS.

create or replace function public.conta_id_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select conta_id from public.usuarios where id = auth.uid()
$$;

revoke all on function public.conta_id_atual() from public;
grant execute on function public.conta_id_atual() to authenticated;

drop policy if exists "usuarios veem a propria conta" on contas;
create policy "usuarios veem a propria conta" on contas
  for select using (id = public.conta_id_atual());

drop policy if exists "usuarios veem colegas da mesma conta" on usuarios;
create policy "usuarios veem colegas da mesma conta" on usuarios
  for select using (conta_id = public.conta_id_atual());

drop policy if exists "usuarios veem obras da propria conta" on obras;
create policy "usuarios veem obras da propria conta" on obras
  for select using (conta_id = public.conta_id_atual());

drop policy if exists "usuarios gerenciam obras da propria conta" on obras;
create policy "usuarios gerenciam obras da propria conta" on obras
  for all
  using (conta_id = public.conta_id_atual())
  with check (conta_id = public.conta_id_atual());

drop policy if exists "usuarios veem midias das obras da propria conta" on midias;
create policy "usuarios veem midias das obras da propria conta" on midias
  for select using (
    obra_id in (select id from obras where conta_id = public.conta_id_atual())
  );

drop policy if exists "usuarios inserem midias nas obras da propria conta" on midias;
create policy "usuarios inserem midias nas obras da propria conta" on midias
  for insert with check (
    obra_id in (select id from obras where conta_id = public.conta_id_atual())
  );

drop policy if exists "usuarios veem registros das obras da propria conta" on registros_dia;
create policy "usuarios veem registros das obras da propria conta" on registros_dia
  for select using (
    obra_id in (select id from obras where conta_id = public.conta_id_atual())
  );

drop policy if exists "usuarios gerenciam registros das obras da propria conta" on registros_dia;
create policy "usuarios gerenciam registros das obras da propria conta" on registros_dia
  for all
  using (obra_id in (select id from obras where conta_id = public.conta_id_atual()))
  with check (obra_id in (select id from obras where conta_id = public.conta_id_atual()));

drop policy if exists "usuarios veem rdos das obras da propria conta" on rdos;
create policy "usuarios veem rdos das obras da propria conta" on rdos
  for select using (
    obra_id in (select id from obras where conta_id = public.conta_id_atual())
  );

drop policy if exists "usuarios gerenciam rdos das obras da propria conta" on rdos;
create policy "usuarios gerenciam rdos das obras da propria conta" on rdos
  for all
  using (obra_id in (select id from obras where conta_id = public.conta_id_atual()))
  with check (obra_id in (select id from obras where conta_id = public.conta_id_atual()));
