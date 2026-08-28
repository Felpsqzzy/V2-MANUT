-- BIOTROP • Banco SQL de Utilidades / Medidores / Horímetros
-- Supabase project: xxqipgvdksughongzpqj
-- Migração segura: pode ser executada após schema.sql.

create extension if not exists pgcrypto;

alter table public.utility_meters add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.utility_meters add column if not exists updated_at timestamptz not null default now();
alter table public.utility_readings add column if not exists evidence_required boolean not null default true;
alter table public.utility_readings add column if not exists updated_at timestamptz not null default now();
alter table public.utility_readings add column if not exists created_at timestamptz not null default now();

-- Traz medidores antigos para a tabela canônica usada pelo aplicativo.
insert into public.utility_meters (id, code, name, utility_type, location, unit, initial_reading, active, created_at)
select m.id, m.code, m.name,
       case
         when lower(coalesce(m.unit,'')) in ('m³','m3') or lower(coalesce(m.name,'')) like '%água%' or lower(coalesce(m.name,'')) like '%agua%' then 'agua'
         when lower(coalesce(m.unit,'')) in ('nm³','nm3') or lower(coalesce(m.name,'')) like '%gás%' or lower(coalesce(m.name,'')) like '%gas%' then 'gas'
         when lower(coalesce(m.unit,'')) in ('kwh','kw/h') or lower(coalesce(m.name,'')) like '%energia%' then 'energia'
         else 'horimetro'
       end,
       m.location, coalesce(nullif(m.unit,''),'h'), coalesce(m.initial_reading,0),
       lower(coalesce(m.status,'active')) <> 'inactive', coalesce(m.created_at,now())
from public.meters m
where not exists (select 1 from public.utility_meters u where u.id=m.id or u.code=m.code);

create index if not exists idx_utility_meters_created_by on public.utility_meters(created_by);
create index if not exists idx_utility_readings_meter_date on public.utility_readings(meter_id,reading_date desc);
create index if not exists idx_utility_readings_user_date on public.utility_readings(user_id,reading_date desc);

create or replace function public.set_utility_updated_at()
returns trigger language plpgsql security definer set search_path=public as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists trg_utility_meters_updated_at on public.utility_meters;
create trigger trg_utility_meters_updated_at before update on public.utility_meters for each row execute function public.set_utility_updated_at();
drop trigger if exists trg_utility_readings_updated_at on public.utility_readings;
create trigger trg_utility_readings_updated_at before update on public.utility_readings for each row execute function public.set_utility_updated_at();

-- RLS: usuário cadastra seus apontamentos; administradores acompanham tudo.
drop policy if exists utility_meters_select on public.utility_meters;
create policy utility_meters_select on public.utility_meters for select to authenticated using (true);
drop policy if exists utility_meters_insert on public.utility_meters;
create policy utility_meters_insert on public.utility_meters for insert to authenticated with check ((select auth.uid()) is not null);
drop policy if exists utility_meters_update on public.utility_meters;
create policy utility_meters_update on public.utility_meters for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

drop policy if exists utility_readings_select on public.utility_readings;
create policy utility_readings_select on public.utility_readings for select to authenticated using (user_id=(select auth.uid()) or public.current_user_is_admin());
drop policy if exists utility_readings_insert on public.utility_readings;
create policy utility_readings_insert on public.utility_readings for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists utility_readings_update on public.utility_readings;
create policy utility_readings_update on public.utility_readings for update to authenticated using (user_id=(select auth.uid()) or public.current_user_is_admin()) with check (user_id=(select auth.uid()) or public.current_user_is_admin());

grant select,insert,update on public.utility_meters to authenticated;
grant select,insert,update on public.utility_readings to authenticated;

insert into storage.buckets(id,name,public) values ('utility-evidence','utility-evidence',false) on conflict(id) do nothing;
drop policy if exists utility_evidence_insert_self on storage.objects;
create policy utility_evidence_insert_self on storage.objects for insert to authenticated with check (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists utility_evidence_select_self on storage.objects;
create policy utility_evidence_select_self on storage.objects for select to authenticated using (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists utility_evidence_update_self on storage.objects;
create policy utility_evidence_update_self on storage.objects for update to authenticated using (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists utility_evidence_delete_self on storage.objects;
create policy utility_evidence_delete_self on storage.objects for delete to authenticated using (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
