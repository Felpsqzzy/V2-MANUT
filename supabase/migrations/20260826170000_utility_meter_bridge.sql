-- Compatibility bridge for the existing application query that embeds meters(name,code).
-- The canonical write table is public.utility_meters.
insert into public.meters(id,code,name,unit,location,initial_reading,status,created_at)
select id,code,name,unit,location,initial_reading,case when active then 'active' else 'inactive' end,created_at
from public.utility_meters
on conflict (id) do update set code=excluded.code,name=excluded.name,unit=excluded.unit,location=excluded.location,initial_reading=excluded.initial_reading,status=excluded.status;

create or replace function public.sync_utility_meter_to_legacy()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='DELETE' then delete from public.meters where id=old.id; return old; end if;
  insert into public.meters(id,code,name,unit,location,initial_reading,status,created_at)
  values(new.id,new.code,new.name,new.unit,new.location,new.initial_reading,case when new.active then 'active' else 'inactive' end,new.created_at)
  on conflict(id) do update set code=excluded.code,name=excluded.name,unit=excluded.unit,location=excluded.location,initial_reading=excluded.initial_reading,status=excluded.status;
  return new;
end; $$;

drop trigger if exists trg_sync_utility_meter_to_legacy on public.utility_meters;
create trigger trg_sync_utility_meter_to_legacy after insert or update or delete on public.utility_meters for each row execute function public.sync_utility_meter_to_legacy();

do $$ begin
  if not exists (select 1 from pg_constraint where conname='utility_readings_meter_id_meters_fkey') then
    alter table public.utility_readings add constraint utility_readings_meter_id_meters_fkey foreign key (meter_id) references public.meters(id) on delete cascade;
  end if;
end $$;
