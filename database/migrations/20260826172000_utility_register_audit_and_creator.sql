alter table public.utility_meters add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.utility_meters add column if not exists updated_at timestamptz not null default now();
alter table public.utility_readings add column if not exists evidence_required boolean not null default true;
alter table public.utility_readings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.utility_audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('meter','reading')),
  entity_id uuid not null,
  action text not null check (action in ('created','updated','deleted')),
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_utility_audit_entity on public.utility_audit_log(entity_type, entity_id, created_at desc);
create index if not exists idx_utility_audit_user on public.utility_audit_log(user_id, created_at desc);

alter table public.utility_audit_log enable row level security;
drop policy if exists utility_audit_select_admin on public.utility_audit_log;
create policy utility_audit_select_admin on public.utility_audit_log for select to authenticated using (public.current_user_is_admin());
drop policy if exists utility_audit_insert_self on public.utility_audit_log;
create policy utility_audit_insert_self on public.utility_audit_log for insert to authenticated with check ((select auth.uid()) = user_id);

grant select, insert on public.utility_audit_log to authenticated;
grant select, insert, update on public.utility_meters to authenticated;
grant select, insert, update on public.utility_readings to authenticated;

create or replace function public.log_utility_meter_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.utility_audit_log(entity_type,entity_id,action,user_id,payload)
  values('meter',new.id,'created',coalesce(new.created_by,auth.uid()),to_jsonb(new));
  return new;
end; $$;

drop trigger if exists trg_utility_meter_audit on public.utility_meters;
create trigger trg_utility_meter_audit after insert on public.utility_meters for each row execute function public.log_utility_meter_insert();

create or replace function public.log_utility_reading_insert()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.utility_audit_log(entity_type,entity_id,action,user_id,payload)
  values('reading',new.id,'created',new.user_id,to_jsonb(new));
  return new;
end; $$;

drop trigger if exists trg_utility_reading_audit on public.utility_readings;
create trigger trg_utility_reading_audit after insert on public.utility_readings for each row execute function public.log_utility_reading_insert();
