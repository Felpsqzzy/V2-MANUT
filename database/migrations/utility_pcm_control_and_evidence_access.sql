-- PCM / Administrador: acesso de gestão aos apontamentos e evidências fotográficas.
-- Compatível com os papéis existentes: pcm, administrador e super_admin.

create or replace function public.is_utility_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role_code,'')) in ('pcm','administrador','super_admin')
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.app_role,'')) in ('pcm','administrador','super_admin')
  );
$$;

grant execute on function public.is_utility_manager() to authenticated;

drop policy if exists utility_readings_select on public.utility_readings;
create policy utility_readings_select
on public.utility_readings for select to authenticated
using (user_id = auth.uid() or public.is_utility_manager());

drop policy if exists utility_readings_update on public.utility_readings;
create policy utility_readings_update
on public.utility_readings for update to authenticated
using (user_id = auth.uid() or public.is_utility_manager())
with check (user_id = auth.uid() or public.is_utility_manager());

drop policy if exists utility_evidence_select_self on storage.objects;
drop policy if exists utility_evidence_select_manager on storage.objects;
create policy utility_evidence_select_manager
on storage.objects for select to authenticated
using (
  bucket_id = 'utility-evidence'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_utility_manager())
);

create index if not exists idx_utility_readings_status_date
  on public.utility_readings(status, reading_date desc);
create index if not exists idx_utility_readings_meter_status
  on public.utility_readings(meter_id, status);
