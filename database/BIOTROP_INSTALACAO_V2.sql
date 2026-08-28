-- BIOTROP Gestão Industrial V2
-- Instalação idempotente para PostgreSQL/Supabase. Não remove dados existentes.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  full_name text,
  username text,
  email text,
  phone text,
  department text,
  sector text,
  avatar_url text,
  role_code text not null default 'viewer',
  app_role text not null default 'viewer',
  active boolean not null default false,
  is_active boolean not null default false,
  theme text not null default 'light',
  notifications_enabled boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists sector text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role_code text default 'viewer';
alter table public.profiles add column if not exists app_role text default 'viewer';
alter table public.profiles add column if not exists active boolean default false;
alter table public.profiles add column if not exists is_active boolean default false;
alter table public.profiles add column if not exists theme text default 'light';
alter table public.profiles add column if not exists notifications_enabled boolean default true;
alter table public.profiles add column if not exists last_login timestamptz;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles alter column active set default false;
alter table public.profiles alter column is_active set default false;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  system_role boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  resource text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  active boolean not null default true,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create unique index if not exists ux_user_roles_one_active
  on public.user_roles(user_id) where active;
create index if not exists idx_user_roles_role_active
  on public.user_roles(role_id, active);

insert into public.roles(code, name, description, system_role, active)
values
  ('super_admin', 'Super administrador', 'Administração integral, inclusive perfis e permissões.', true, true),
  ('administrador', 'Administrador', 'Administração operacional e gestão de usuários.', true, true),
  ('pcm', 'PCM', 'Planejamento, indicadores, relatórios e visão global de manutenção.', true, true),
  ('almoxarife', 'Almoxarife', 'Gestão de materiais, solicitações e aprovações.', true, true),
  ('tecnico', 'Técnico', 'Apontamentos e solicitações operacionais autorizadas.', true, true),
  ('viewer', 'Viewer / Pendente', 'Acesso mínimo enquanto aguarda liberação de perfil.', true, true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    active = true,
    updated_at = now();

insert into public.permissions(code, name, description, resource, action)
values
  ('users.view', 'Consultar usuários', 'Consultar o diretório de perfis.', 'users', 'view'),
  ('users.manage', 'Gerenciar usuários', 'Alterar perfil e ativar ou bloquear usuários.', 'users', 'manage'),
  ('roles.view', 'Consultar perfis de acesso', 'Consultar perfis e permissões.', 'roles', 'view'),
  ('roles.manage', 'Gerenciar perfis de acesso', 'Alterar permissões dos perfis.', 'roles', 'manage'),
  ('meters.view', 'Consultar medidores', 'Consultar medidores ativos.', 'meters', 'view'),
  ('meters.manage', 'Gerenciar medidores', 'Criar, editar, ativar e desativar medidores.', 'meters', 'manage'),
  ('readings.create', 'Registrar leituras', 'Criar apontamentos com evidência.', 'readings', 'create'),
  ('readings.view_own', 'Consultar próprias leituras', 'Consultar leituras realizadas pelo usuário.', 'readings', 'view_own'),
  ('readings.view_all', 'Consultar todas as leituras', 'Consultar leituras de todos os usuários.', 'readings', 'view_all'),
  ('readings.manage', 'Gerenciar leituras', 'Tratar status e correções sem excluir histórico.', 'readings', 'manage'),
  ('requests.create', 'Criar solicitações', 'Criar solicitações operacionais.', 'requests', 'create'),
  ('requests.view_own', 'Consultar próprias solicitações', 'Consultar solicitações do usuário.', 'requests', 'view_own'),
  ('requests.view_all', 'Consultar todas as solicitações', 'Consultar solicitações da operação.', 'requests', 'view_all'),
  ('requests.approve', 'Aprovar solicitações', 'Aprovar, reprovar ou solicitar correção.', 'requests', 'approve'),
  ('requests.manage', 'Gerenciar solicitações', 'Administrar o fluxo de solicitações.', 'requests', 'manage'),
  ('reports.view', 'Consultar relatórios', 'Consultar relatórios e indicadores.', 'reports', 'view'),
  ('audit.view', 'Consultar auditoria', 'Consultar trilhas de auditoria.', 'audit', 'view'),
  ('trainings.view', 'Consultar treinamentos', 'Consultar cursos e o próprio progresso.', 'trainings', 'view'),
  ('trainings.manage', 'Gerenciar treinamentos', 'Criar e editar cursos corporativos.', 'trainings', 'manage')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    resource = excluded.resource,
    action = excluded.action;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'super_admin'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any(array[
  'users.view','users.manage','roles.view','meters.view','meters.manage',
  'readings.create','readings.view_own','readings.view_all','readings.manage',
  'requests.create','requests.view_own','requests.view_all','requests.approve','requests.manage',
  'reports.view','audit.view','trainings.view','trainings.manage'
])
where r.code = 'administrador'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any(array[
  'meters.view','readings.create','readings.view_own','readings.view_all','readings.manage',
  'requests.create','requests.view_own','requests.view_all','requests.approve',
  'reports.view','audit.view','trainings.view'
])
where r.code = 'pcm'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any(array[
  'requests.create','requests.view_own','requests.view_all','requests.approve','requests.manage',
  'reports.view','trainings.view'
])
where r.code = 'almoxarife'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any(array[
  'meters.view','readings.create','readings.view_own',
  'requests.create','requests.view_own','trainings.view'
])
where r.code = 'tecnico'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'trainings.view'
where r.code = 'viewer'
on conflict do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_roles_updated_at on public.roles;
create trigger trg_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_roles_updated_at on public.user_roles;
create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

create or replace function public.has_permission(
  p_permission_code text,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_user_id is null then
    return false;
  end if;

  if p_user_id is distinct from auth.uid() and coalesce(auth.role(), '') <> 'service_role' then
    return false;
  end if;

  return exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    join public.profiles pf on pf.id = ur.user_id
    where ur.user_id = p_user_id
      and ur.active
      and r.active
      and p.code = p_permission_code
      and coalesce(pf.active, true)
      and coalesce(pf.is_active, true)
  );
end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.has_permission('users.manage')
      or public.has_permission('roles.manage');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.current_user_is_admin();
$$;

create or replace function public.get_my_access_context()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'user_id', p.id,
    'profile', to_jsonb(p),
    'active', coalesce(p.active, true) and coalesce(p.is_active, true),
    'roles', coalesce((
      select jsonb_agg(jsonb_build_object('code', r.code, 'name', r.name) order by r.name)
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id and ur.active and r.active
    ), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(distinct perm.code)
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      join public.role_permissions rp on rp.role_id = r.id
      join public.permissions perm on perm.id = rp.permission_id
      where ur.user_id = p.id and ur.active and r.active
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.id = auth.uid();
$$;

create table if not exists public.industrial_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.industrial_units(code, name, sort_order, active)
values
  ('CAMM1', 'CAMM 1', 10, true),
  ('CAMM2', 'CAMM 2', 20, true),
  ('CAMM3', 'CAMM 3', 30, true),
  ('CLOG', 'C. LOG', 40, true)
on conflict (code) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    active = true,
    deleted_at = null,
    updated_at = now();

drop trigger if exists trg_industrial_units_updated_at on public.industrial_units;
create trigger trg_industrial_units_updated_at
before update on public.industrial_units
for each row execute function public.set_updated_at();

create table if not exists public.utility_meters (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.industrial_units(id) on delete restrict,
  code text not null unique,
  name text not null,
  utility_type text not null,
  location text,
  unit text not null,
  initial_reading numeric(18,3),
  active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint utility_meters_type_check_v2 check (utility_type in ('agua','gas','energia','horimetro'))
);

alter table public.utility_meters add column if not exists unit_id uuid references public.industrial_units(id) on delete restrict;
alter table public.utility_meters add column if not exists location text;
alter table public.utility_meters add column if not exists unit text;
alter table public.utility_meters add column if not exists initial_reading numeric(18,3);
alter table public.utility_meters add column if not exists active boolean default true;
alter table public.utility_meters add column if not exists deleted_at timestamptz;
alter table public.utility_meters add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.utility_meters add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.utility_meters add column if not exists created_at timestamptz default now();
alter table public.utility_meters add column if not exists updated_at timestamptz default now();
alter table public.utility_meters alter column initial_reading drop not null;
alter table public.utility_meters alter column initial_reading drop default;

create unique index if not exists ux_utility_meters_code on public.utility_meters(code);
create index if not exists idx_utility_meters_unit_type_active
  on public.utility_meters(unit_id, utility_type, active);

do $$
begin
  if exists (
    select 1 from public.utility_meters
    where name = 'HIDROMETRO 08 - CAMM 2' and coalesce(location, '') = 'CAMM 2'
  ) and not exists (
    select 1 from public.utility_meters where code = 'CAMM2-AGUA-08'
  ) then
    update public.utility_meters
    set code = 'CAMM2-AGUA-08', updated_at = now()
    where name = 'HIDROMETRO 08 - CAMM 2' and coalesce(location, '') = 'CAMM 2';
  end if;

  if exists (
    select 1 from public.utility_meters
    where name = 'HIDROMETRO 09 - CAMM 2' and coalesce(location, '') = 'CAMM 2'
  ) and not exists (
    select 1 from public.utility_meters where code = 'CAMM2-AGUA-09'
  ) then
    update public.utility_meters
    set code = 'CAMM2-AGUA-09', updated_at = now()
    where name = 'HIDROMETRO 09 - CAMM 2' and coalesce(location, '') = 'CAMM 2';
  end if;
end;
$$;

insert into public.utility_meters(unit_id, code, name, utility_type, location, unit, initial_reading, active, deleted_at)
values
  ((select id from public.industrial_units where code='CAMM1'), 'CAMM1-GAS-01', 'MEDIDOR GÁS 01 - CAMM 1', 'gas', 'CAMM 1', 'Nm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM1'), 'CAMM1-AGUA-02', 'HIDROMETRO 02 - CAMM 1', 'agua', 'CAMM 1', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM1'), 'CAMM1-AGUA-03', 'HIDROMETRO 03 - CAMM 1', 'agua', 'CAMM 1', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM1'), 'CAMM1-AGUA-06', 'HIDROMETRO 06 - CAMM 1 - POÇO', 'agua', 'CAMM 1', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM1'), 'CAMM1-LUZ-02', 'MEDIDOR ENERGIA 02 - CAMM 1 - BOMBA DE INCENDIO', 'energia', 'CAMM 1', 'kWh', null, true, null),
  ((select id from public.industrial_units where code='CAMM1'), 'CAMM1-LUZ-01', 'MEDIDOR ENERGIA 01 - CAMM 1 - CABINE PRIMARIA', 'energia', 'CAMM 1', 'kWh', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-GAS-01', 'MEDIDOR GÁS 01 - CAMM 2', 'gas', 'CAMM 2', 'Nm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-AGUA-01', 'HIDROMETRO 01 - CAMM 2', 'agua', 'CAMM 2', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-AGUA-02', 'HIDROMETRO 02 - CAMM 2', 'agua', 'CAMM 2', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-AGUA-08', 'HIDROMETRO 08 - CAMM 2', 'agua', 'CAMM 2', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-AGUA-09', 'HIDROMETRO 09 - CAMM 2', 'agua', 'CAMM 2', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-LUZ-02', 'MEDIDOR ENERGIA 02 - CAMM 2', 'energia', 'CAMM 2', 'kWh', null, true, null),
  ((select id from public.industrial_units where code='CAMM2'), 'CAMM2-LUZ-01', 'MEDIDOR ENERGIA 01 - CAMM 2', 'energia', 'CAMM 2', 'kWh', null, true, null),
  ((select id from public.industrial_units where code='CAMM3'), 'CAMM3-GAS-01', 'MEDIDOR GÁS 01 - CAMM 3', 'gas', 'CAMM 3', 'Nm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM3'), 'CAMM3-AGUA-01', 'HIDROMETRO 01 - CAMM 3', 'agua', 'CAMM 3', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CAMM3'), 'CAMM3-LUZ-01', 'MEDIDOR ENERGIA 01 - CAMM 3', 'energia', 'CAMM 3', 'kWh', null, true, null),
  ((select id from public.industrial_units where code='CLOG'), 'CLOG-AGUA-01', 'HIDROMETRO 01 - C. LOG', 'agua', 'C. LOG', 'm³', null, true, null),
  ((select id from public.industrial_units where code='CLOG'), 'CLOG-LUZ-01', 'MEDIDOR ENERGIA 01 - C. LOG', 'energia', 'C. LOG', 'kWh', null, true, null)
on conflict (code) do update
set unit_id = excluded.unit_id,
    name = excluded.name,
    utility_type = excluded.utility_type,
    location = excluded.location,
    unit = excluded.unit,
    active = true,
    deleted_at = null,
    updated_at = now();

update public.utility_meters m
set active = false,
    deleted_at = coalesce(m.deleted_at, now()),
    updated_at = now()
where m.name in ('HIDROMETRO 08 - CAMM 2', 'HIDROMETRO 09 - CAMM 2')
  and m.code not in ('CAMM2-AGUA-08', 'CAMM2-AGUA-09');

drop trigger if exists trg_utility_meters_updated_at on public.utility_meters;
create trigger trg_utility_meters_updated_at
before update on public.utility_meters
for each row execute function public.set_updated_at();

create table if not exists public.utility_readings (
  id uuid primary key default gen_random_uuid(),
  meter_id uuid not null references public.utility_meters(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  reading_value numeric(18,3) not null check (reading_value >= 0),
  previous_reading numeric(18,3),
  consumption numeric(18,3),
  reading_date timestamptz not null default now(),
  server_timestamp timestamptz not null default now(),
  latitude numeric(10,7),
  longitude numeric(10,7),
  status text not null default 'pendente',
  observation text,
  inconsistent boolean not null default false,
  correction_requested boolean not null default false,
  photo_path text,
  captured_at timestamptz,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint utility_readings_consumption_nonnegative_v2
    check (consumption is null or consumption >= 0)
);

alter table public.utility_readings add column if not exists previous_reading numeric(18,3);
alter table public.utility_readings add column if not exists consumption numeric(18,3);
alter table public.utility_readings add column if not exists reading_date timestamptz default now();
alter table public.utility_readings add column if not exists server_timestamp timestamptz default now();
alter table public.utility_readings add column if not exists latitude numeric(10,7);
alter table public.utility_readings add column if not exists longitude numeric(10,7);
alter table public.utility_readings add column if not exists status text default 'pendente';
alter table public.utility_readings add column if not exists observation text;
alter table public.utility_readings add column if not exists inconsistent boolean default false;
alter table public.utility_readings add column if not exists correction_requested boolean default false;
alter table public.utility_readings add column if not exists photo_path text;
alter table public.utility_readings add column if not exists captured_at timestamptz;
alter table public.utility_readings add column if not exists active boolean default true;
alter table public.utility_readings add column if not exists deleted_at timestamptz;
alter table public.utility_readings add column if not exists created_at timestamptz default now();
alter table public.utility_readings add column if not exists updated_at timestamptz default now();

update public.utility_readings r
set meter_id = canonical.id
from public.utility_meters legacy
join public.utility_meters canonical
  on canonical.code = case legacy.name
    when 'HIDROMETRO 08 - CAMM 2' then 'CAMM2-AGUA-08'
    when 'HIDROMETRO 09 - CAMM 2' then 'CAMM2-AGUA-09'
  end
where r.meter_id = legacy.id
  and legacy.name in ('HIDROMETRO 08 - CAMM 2', 'HIDROMETRO 09 - CAMM 2')
  and legacy.id <> canonical.id;

create index if not exists idx_utility_readings_meter_server
  on public.utility_readings(meter_id, server_timestamp desc, id desc);
create index if not exists idx_utility_readings_user_server
  on public.utility_readings(user_id, server_timestamp desc);
create index if not exists idx_utility_readings_status_active
  on public.utility_readings(status, active);

create table if not exists public.access_audit_log (
  id bigint generated by default as identity primary key,
  entity_type text not null,
  entity_id text,
  action text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  old_values jsonb,
  new_values jsonb
);

create index if not exists idx_access_audit_entity_time
  on public.access_audit_log(entity_type, entity_id, occurred_at desc);
create index if not exists idx_access_audit_actor_time
  on public.access_audit_log(actor_user_id, occurred_at desc);

create or replace function public.audit_biotrop_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_id text;
begin
  v_id := case when tg_op = 'DELETE' then old.id::text else new.id::text end;
  insert into public.access_audit_log(
    entity_type, entity_id, action, actor_user_id, old_values, new_values
  )
  values (
    tg_table_name,
    v_id,
    lower(tg_op),
    auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_audit_utility_meters on public.utility_meters;
drop trigger if exists trg_utility_meter_audit on public.utility_meters;
create trigger trg_audit_utility_meters
after insert or update or delete on public.utility_meters
for each row execute function public.audit_biotrop_changes();

drop trigger if exists trg_audit_utility_readings on public.utility_readings;
drop trigger if exists trg_utility_reading_audit on public.utility_readings;
create trigger trg_audit_utility_readings
after insert or update or delete on public.utility_readings
for each row execute function public.audit_biotrop_changes();

create or replace function public.prepare_utility_reading()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_previous numeric(18,3);
  v_uid uuid;
  v_meter_active boolean;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'A leitura exige uma sessão autenticada.';
  end if;

  if not public.has_permission('readings.create', v_uid) then
    raise exception using
      errcode = '42501',
      message = 'Usuário sem permissão para registrar leituras.';
  end if;

  select m.active into v_meter_active
  from public.utility_meters m
  where m.id = new.meter_id;

  if coalesce(v_meter_active, false) = false then
    raise exception using
      errcode = '22023',
      message = 'O medidor informado não existe ou está inativo.';
  end if;

  if nullif(btrim(new.photo_path), '') is null then
    raise exception using
      errcode = '23514',
      message = 'A evidência fotográfica é obrigatória.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.meter_id::text, 0));

  select r.reading_value
  into v_previous
  from public.utility_readings r
  where r.meter_id = new.meter_id
    and r.active
  order by r.server_timestamp desc, r.id desc
  limit 1
  for update;

  if v_previous is not null and new.reading_value < v_previous then
    raise exception using
      errcode = 'P0001',
      message = format(
        'A leitura informada (%s) não pode ser menor que a leitura anterior (%s).',
        new.reading_value,
        v_previous
      );
  end if;

  new.user_id := v_uid;
  new.previous_reading := v_previous;
  new.consumption := case
    when v_previous is null then null
    else new.reading_value - v_previous
  end;
  new.reading_date := clock_timestamp();
  new.server_timestamp := new.reading_date;
  new.created_at := new.reading_date;
  new.updated_at := new.reading_date;
  new.captured_at := coalesce(new.captured_at, new.reading_date);
  new.active := true;
  new.deleted_at := null;
  return new;
end;
$$;

drop trigger if exists trg_prepare_utility_reading on public.utility_readings;
create trigger trg_prepare_utility_reading
before insert on public.utility_readings
for each row execute function public.prepare_utility_reading();

create or replace function public.protect_utility_reading_history()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.meter_id is distinct from old.meter_id
     or new.user_id is distinct from old.user_id
     or new.reading_value is distinct from old.reading_value
     or new.previous_reading is distinct from old.previous_reading
     or new.consumption is distinct from old.consumption
     or new.reading_date is distinct from old.reading_date
     or new.server_timestamp is distinct from old.server_timestamp then
    raise exception using
      errcode = '42501',
      message = 'Os valores históricos de uma leitura são imutáveis.';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists trg_protect_utility_reading_history on public.utility_readings;
create trigger trg_protect_utility_reading_history
before update on public.utility_readings
for each row execute function public.protect_utility_reading_history();

create or replace function public.create_utility_reading(
  p_meter_id uuid,
  p_reading_value numeric,
  p_observation text default null,
  p_photo_path text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns public.utility_readings
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_row public.utility_readings;
begin
  insert into public.utility_readings(
    meter_id, user_id, reading_value, observation, photo_path,
    latitude, longitude, captured_at
  )
  values (
    p_meter_id, auth.uid(), p_reading_value, nullif(btrim(p_observation), ''),
    nullif(btrim(p_photo_path), ''), p_latitude, p_longitude, clock_timestamp()
  )
  returning * into v_row;
  return v_row;
end;
$$;

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  requester_id uuid not null references auth.users(id) on delete restrict,
  material_type_id uuid,
  description text,
  quantity numeric(14,3),
  unit text,
  justification text,
  process_number text,
  warehouse_note text,
  status text not null default 'ENVIADA',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  requester_id uuid not null references auth.users(id) on delete restrict,
  description text,
  team text,
  urgency text,
  cost_center text,
  justification text,
  approval_note text,
  status text not null default 'pendente_aprovacao_lider',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_requests add column if not exists request_number text;
alter table public.service_requests add column if not exists requester_id uuid references auth.users(id) on delete restrict;
alter table public.service_requests add column if not exists material_type_id uuid;
alter table public.service_requests add column if not exists description text;
alter table public.service_requests add column if not exists quantity numeric(14,3);
alter table public.service_requests add column if not exists unit text;
alter table public.service_requests add column if not exists justification text;
alter table public.service_requests add column if not exists process_number text;
alter table public.service_requests add column if not exists warehouse_note text;
alter table public.service_requests add column if not exists status text default 'ENVIADA';
alter table public.service_requests add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.service_requests add column if not exists approved_at timestamptz;
alter table public.service_requests add column if not exists active boolean default true;
alter table public.service_requests add column if not exists deleted_at timestamptz;
alter table public.service_requests add column if not exists created_at timestamptz default now();
alter table public.service_requests add column if not exists updated_at timestamptz default now();
create unique index if not exists ux_service_requests_number
  on public.service_requests(request_number) where request_number is not null;

alter table public.purchase_requests add column if not exists code text;
alter table public.purchase_requests add column if not exists requester_id uuid references auth.users(id) on delete restrict;
alter table public.purchase_requests add column if not exists description text;
alter table public.purchase_requests add column if not exists team text;
alter table public.purchase_requests add column if not exists urgency text;
alter table public.purchase_requests add column if not exists cost_center text;
alter table public.purchase_requests add column if not exists justification text;
alter table public.purchase_requests add column if not exists approval_note text;
alter table public.purchase_requests add column if not exists status text default 'pendente_aprovacao_lider';
alter table public.purchase_requests add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.purchase_requests add column if not exists approved_at timestamptz;
alter table public.purchase_requests add column if not exists active boolean default true;
alter table public.purchase_requests add column if not exists deleted_at timestamptz;
alter table public.purchase_requests add column if not exists created_at timestamptz default now();
alter table public.purchase_requests add column if not exists updated_at timestamptz default now();
create unique index if not exists ux_purchase_requests_code
  on public.purchase_requests(code) where code is not null;

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  video_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  mandatory boolean not null default false,
  active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_progress (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.training_courses(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  percentage numeric(5,2) not null default 0 check (percentage between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_id, user_id)
);

alter table public.training_courses add column if not exists title text;
alter table public.training_courses add column if not exists category text;
alter table public.training_courses add column if not exists description text;
alter table public.training_courses add column if not exists video_url text;
alter table public.training_courses add column if not exists duration_seconds integer;
alter table public.training_courses add column if not exists mandatory boolean default false;
alter table public.training_courses add column if not exists active boolean default true;
alter table public.training_courses add column if not exists deleted_at timestamptz;
alter table public.training_courses add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.training_courses add column if not exists created_at timestamptz default now();
alter table public.training_courses add column if not exists updated_at timestamptz default now();

alter table public.training_progress add column if not exists training_id uuid references public.training_courses(id) on delete restrict;
alter table public.training_progress add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.training_progress add column if not exists percentage numeric(5,2) default 0;
alter table public.training_progress add column if not exists completed_at timestamptz;
alter table public.training_progress add column if not exists created_at timestamptz default now();
alter table public.training_progress add column if not exists updated_at timestamptz default now();
create unique index if not exists ux_training_progress_course_user
  on public.training_progress(training_id, user_id)
  where training_id is not null and user_id is not null;

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  description text,
  category text,
  file_url text not null,
  file_type text not null,
  file_mime text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_families (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_requests_requester_created
  on public.service_requests(requester_id, created_at desc);
create index if not exists idx_service_requests_status_active
  on public.service_requests(status, active);
create index if not exists idx_purchase_requests_requester_created
  on public.purchase_requests(requester_id, created_at desc);
create index if not exists idx_purchase_requests_status_active
  on public.purchase_requests(status, active);
create index if not exists idx_training_courses_active_created
  on public.training_courses(active, created_at desc);
create index if not exists idx_training_progress_user
  on public.training_progress(user_id, updated_at desc);
create index if not exists idx_materials_user_created
  on public.materials(user_id, created_at desc);
create index if not exists idx_material_families_active_name
  on public.material_families(active, name);

create or replace function public.protect_service_request_workflow()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_can_manage boolean;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'A solicitação exige uma sessão autenticada.';
  end if;

  v_can_manage := public.has_permission('requests.approve', v_uid)
    or public.has_permission('requests.manage', v_uid);

  if tg_op = 'INSERT' then
    if not public.has_permission('requests.create', v_uid) then
      raise exception using errcode = '42501', message = 'Usuário sem permissão para criar solicitações.';
    end if;
    new.requester_id := v_uid;
    new.status := 'ENVIADA';
    new.approved_by := null;
    new.approved_at := null;
    new.active := true;
    new.deleted_at := null;
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
    return new;
  end if;

  if new.requester_id is distinct from old.requester_id then
    raise exception using errcode = '42501', message = 'O solicitante não pode ser alterado.';
  end if;
  if new.request_number is distinct from old.request_number then
    raise exception using errcode = '42501', message = 'O número da solicitação é imutável.';
  end if;

  if not v_can_manage then
    if old.requester_id is distinct from v_uid then
      raise exception using errcode = '42501', message = 'Usuário sem permissão para alterar esta solicitação.';
    end if;
    if old.status not in ('ENVIADA', 'CORREÇÃO SOLICITADA') then
      raise exception using errcode = '42501', message = 'Esta solicitação não pode mais ser alterada pelo solicitante.';
    end if;
    new.status := case when old.status = 'CORREÇÃO SOLICITADA' then 'ENVIADA' else old.status end;
    new.process_number := old.process_number;
    new.warehouse_note := old.warehouse_note;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
    new.active := old.active;
    new.deleted_at := old.deleted_at;
  else
    if new.status not in ('ENVIADA', 'EM ANÁLISE', 'CORREÇÃO SOLICITADA', 'APROVADA', 'REPROVADA', 'CADASTRADA', 'CANCELADA') then
      raise exception using errcode = '22023', message = 'Status de solicitação inválido.';
    end if;
    if new.status in ('APROVADA', 'REPROVADA', 'CADASTRADA') and new.status is distinct from old.status then
      new.approved_by := v_uid;
      new.approved_at := clock_timestamp();
    end if;
  end if;

  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists trg_protect_service_request_workflow on public.service_requests;
create trigger trg_protect_service_request_workflow
before insert or update on public.service_requests
for each row execute function public.protect_service_request_workflow();

create or replace function public.protect_purchase_request_workflow()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_can_manage boolean;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'A solicitação exige uma sessão autenticada.';
  end if;

  v_can_manage := public.has_permission('requests.approve', v_uid)
    or public.has_permission('requests.manage', v_uid);

  if tg_op = 'INSERT' then
    if not public.has_permission('requests.create', v_uid) then
      raise exception using errcode = '42501', message = 'Usuário sem permissão para criar solicitações.';
    end if;
    new.requester_id := v_uid;
    new.status := 'pendente_aprovacao_lider';
    new.approved_by := null;
    new.approved_at := null;
    new.active := true;
    new.deleted_at := null;
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
    return new;
  end if;

  if new.requester_id is distinct from old.requester_id then
    raise exception using errcode = '42501', message = 'O solicitante não pode ser alterado.';
  end if;
  if new.code is distinct from old.code then
    raise exception using errcode = '42501', message = 'O código da solicitação é imutável.';
  end if;

  if not v_can_manage then
    if old.requester_id is distinct from v_uid then
      raise exception using errcode = '42501', message = 'Usuário sem permissão para alterar esta solicitação.';
    end if;
    if old.status not in ('pendente_aprovacao_lider', 'revisao_solicitada') then
      raise exception using errcode = '42501', message = 'Esta solicitação não pode mais ser alterada pelo solicitante.';
    end if;
    new.status := 'pendente_aprovacao_lider';
    new.approval_note := old.approval_note;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
    new.active := old.active;
    new.deleted_at := old.deleted_at;
  else
    if new.status not in ('pendente_aprovacao_lider', 'aprovada', 'reprovada', 'revisao_solicitada', 'em_tratativa', 'concluida') then
      raise exception using errcode = '22023', message = 'Status de solicitação inválido.';
    end if;
    if new.status in ('aprovada', 'reprovada', 'concluida') and new.status is distinct from old.status then
      new.approved_by := v_uid;
      new.approved_at := clock_timestamp();
    end if;
  end if;

  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists trg_protect_purchase_request_workflow on public.purchase_requests;
create trigger trg_protect_purchase_request_workflow
before insert or update on public.purchase_requests
for each row execute function public.protect_purchase_request_workflow();

drop trigger if exists trg_audit_service_requests on public.service_requests;
create trigger trg_audit_service_requests
after insert or update or delete on public.service_requests
for each row execute function public.audit_biotrop_changes();

drop trigger if exists trg_audit_purchase_requests on public.purchase_requests;
create trigger trg_audit_purchase_requests
after insert or update or delete on public.purchase_requests
for each row execute function public.audit_biotrop_changes();

drop trigger if exists trg_service_requests_updated_at on public.service_requests;
create trigger trg_service_requests_updated_at
before update on public.service_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchase_requests_updated_at on public.purchase_requests;
create trigger trg_purchase_requests_updated_at
before update on public.purchase_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_training_courses_updated_at on public.training_courses;
create trigger trg_training_courses_updated_at
before update on public.training_courses
for each row execute function public.set_updated_at();

drop trigger if exists trg_training_progress_updated_at on public.training_progress;
create trigger trg_training_progress_updated_at
before update on public.training_progress
for each row execute function public.set_updated_at();

drop trigger if exists trg_materials_updated_at on public.materials;
create trigger trg_materials_updated_at
before update on public.materials
for each row execute function public.set_updated_at();

drop trigger if exists trg_material_families_updated_at on public.material_families;
create trigger trg_material_families_updated_at
before update on public.material_families
for each row execute function public.set_updated_at();

create or replace function public.admin_set_user_access(
  p_user_id uuid,
  p_role_code text,
  p_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_role public.roles;
  v_old jsonb;
  v_new jsonb;
begin
  if not public.has_permission('users.manage') then
    raise exception using errcode = '42501', message = 'Sem permissão para alterar acessos.';
  end if;
  if p_role_code = 'super_admin' and not public.has_permission('roles.manage') then
    raise exception using errcode = '42501', message = 'Somente um super administrador pode atribuir esse perfil.';
  end if;
  if exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and ur.active
      and r.code = 'super_admin'
  ) and not public.has_permission('roles.manage') then
    raise exception using errcode = '42501', message = 'Somente um super administrador pode alterar outro super administrador.';
  end if;

  select * into v_role
  from public.roles
  where code = p_role_code and active;

  if v_role.id is null then
    raise exception using errcode = '22023', message = 'Perfil de acesso inválido.';
  end if;

  if p_user_id = auth.uid() and not p_active then
    raise exception using errcode = '22023', message = 'Não é permitido bloquear a própria conta.';
  end if;

  select jsonb_build_object(
    'profile', to_jsonb(p),
    'roles', coalesce((
      select jsonb_agg(r.code)
      from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id and ur.active
    ), '[]'::jsonb)
  )
  into v_old
  from public.profiles p
  where p.id = p_user_id;

  update public.user_roles
  set active = false, updated_at = now()
  where user_id = p_user_id and active;

  insert into public.user_roles(user_id, role_id, active, assigned_by)
  values (p_user_id, v_role.id, true, auth.uid())
  on conflict (user_id, role_id) do update
  set active = true,
      assigned_by = auth.uid(),
      assigned_at = now(),
      updated_at = now();

  update public.profiles
  set role_code = v_role.code,
      app_role = v_role.code,
      active = p_active,
      is_active = p_active,
      updated_at = now()
  where id = p_user_id;

  select jsonb_build_object(
    'user_id', p.id,
    'role_code', p.role_code,
    'active', p.active and p.is_active
  )
  into v_new
  from public.profiles p
  where p.id = p_user_id;

  insert into public.access_audit_log(
    entity_type, entity_id, action, actor_user_id, old_values, new_values
  )
  values ('user_access', p_user_id::text, 'set_access', auth.uid(), v_old, v_new);

  return v_new;
end;
$$;

create or replace function public.admin_set_role_permissions(
  p_role_code text,
  p_permission_codes text[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_role_id uuid;
  v_old jsonb;
  v_new jsonb;
begin
  if not public.has_permission('roles.manage') then
    raise exception using errcode = '42501', message = 'Sem permissão para alterar perfis.';
  end if;

  if p_role_code = 'super_admin' then
    raise exception using errcode = '22023', message = 'O perfil super_admin não pode ser reduzido.';
  end if;

  select id into v_role_id from public.roles where code = p_role_code and active;
  if v_role_id is null then
    raise exception using errcode = '22023', message = 'Perfil de acesso inválido.';
  end if;

  select coalesce(jsonb_agg(p.code order by p.code), '[]'::jsonb)
  into v_old
  from public.role_permissions rp
  join public.permissions p on p.id = rp.permission_id
  where rp.role_id = v_role_id;

  delete from public.role_permissions where role_id = v_role_id;

  insert into public.role_permissions(role_id, permission_id)
  select v_role_id, p.id
  from public.permissions p
  where p.code = any(coalesce(p_permission_codes, array[]::text[]));

  select coalesce(jsonb_agg(p.code order by p.code), '[]'::jsonb)
  into v_new
  from public.role_permissions rp
  join public.permissions p on p.id = rp.permission_id
  where rp.role_id = v_role_id;

  insert into public.access_audit_log(
    entity_type, entity_id, action, actor_user_id, old_values, new_values
  )
  values ('role_permissions', p_role_code, 'set_permissions', auth.uid(), v_old, v_new);

  return jsonb_build_object('role_code', p_role_code, 'permissions', v_new);
end;
$$;

create or replace function public.get_access_admin_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.has_permission('users.view') then
    raise exception using errcode = '42501', message = 'Sem permissão para consultar usuários.';
  end if;

  return jsonb_build_object(
    'profiles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'full_name', p.full_name,
          'email', p.email,
          'department', p.department,
          'role_code', coalesce(r.code, p.role_code, 'viewer'),
          'active', coalesce(p.active, true) and coalesce(p.is_active, true),
          'created_at', p.created_at
        )
        order by coalesce(p.name, p.email)
      )
      from public.profiles p
      left join public.user_roles ur on ur.user_id = p.id and ur.active
      left join public.roles r on r.id = ur.role_id
    ), '[]'::jsonb),
    'roles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'code', r.code,
          'name', r.name,
          'description', r.description,
          'permissions', coalesce((
            select jsonb_agg(p.code order by p.code)
            from public.role_permissions rp
            join public.permissions p on p.id = rp.permission_id
            where rp.role_id = r.id
          ), '[]'::jsonb)
        )
        order by r.name
      )
      from public.roles r
      where r.active
    ), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(
        jsonb_build_object('code', p.code, 'name', p.name, 'resource', p.resource)
        order by p.resource, p.name
      )
      from public.permissions p
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.touch_my_last_login()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.profiles set last_login = now(), updated_at = now() where id = auth.uid();
$$;

create or replace function public.handle_new_auth_user_biotrop_v2()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_viewer_role_id uuid;
  v_name text;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuário'
  );

  insert into public.profiles(
    id, name, full_name, username, email, role_code, app_role, active, is_active
  )
  values (
    new.id, v_name, v_name, split_part(coalesce(new.email, ''), '@', 1),
    new.email, 'viewer', 'viewer', false, false
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  select id into v_viewer_role_id from public.roles where code = 'viewer';
  if v_viewer_role_id is not null and not exists (
    select 1 from public.user_roles where user_id = new.id and active
  ) then
    insert into public.user_roles(user_id, role_id, active)
    values (new.id, v_viewer_role_id, true)
    on conflict (user_id, role_id) do update set active = true, updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_biotrop on auth.users;
drop trigger if exists on_auth_user_created_biotrop_v2 on auth.users;
create trigger on_auth_user_created_biotrop_v2
after insert on auth.users
for each row execute function public.handle_new_auth_user_biotrop_v2();

insert into public.profiles(
  id, name, full_name, username, email, role_code, app_role, active, is_active
)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'Usuário'),
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'Usuário'),
  split_part(coalesce(u.email, ''), '@', 1),
  u.email,
  'viewer',
  'viewer',
  false,
  false
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_roles(user_id, role_id, active)
select p.id, r.id, true
from public.profiles p
join public.roles r on r.code = case
  when lower(coalesce(p.role_code, p.app_role, '')) in ('super_admin') then 'super_admin'
  when lower(coalesce(p.role_code, p.app_role, '')) in ('administrador','admin','gestor','manager') then 'administrador'
  when lower(coalesce(p.role_code, p.app_role, '')) in ('pcm','pcm_perfil','pcnm') then 'pcm'
  when lower(coalesce(p.role_code, p.app_role, '')) in ('almoxarife','aprovador') then 'almoxarife'
  when lower(coalesce(p.role_code, p.app_role, '')) in ('tecnico','técnico') then 'tecnico'
  else 'viewer'
end
where not exists (
    select 1 from public.user_roles ur where ur.user_id = p.id and ur.active
  )
on conflict (user_id, role_id) do update
set active = true, updated_at = now();

create or replace function public.bootstrap_biotrop_super_admin(p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user auth.users;
  v_role_id uuid;
  v_name text;
begin
  select * into v_user from auth.users where lower(email) = lower(p_email) limit 1;
  if v_user.id is null then
    return false;
  end if;

  v_name := coalesce(
    nullif(v_user.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(v_user.email, ''), '@', 1), ''),
    'Usuário'
  );

  insert into public.profiles(
    id, name, full_name, username, email, role_code, app_role, active, is_active
  )
  values (
    v_user.id, v_name, v_name, split_part(v_user.email, '@', 1),
    v_user.email, 'super_admin', 'super_admin', true, true
  )
  on conflict (id) do update
  set email = excluded.email,
      role_code = 'super_admin',
      app_role = 'super_admin',
      active = true,
      is_active = true,
      updated_at = now();

  select id into v_role_id from public.roles where code = 'super_admin';
  update public.user_roles set active = false, updated_at = now()
  where user_id = v_user.id and role_id <> v_role_id and active;

  insert into public.user_roles(user_id, role_id, active, assigned_by)
  values (v_user.id, v_role_id, true, null)
  on conflict (user_id, role_id) do update
  set active = true, assigned_at = now(), updated_at = now();

  insert into public.access_audit_log(
    entity_type, entity_id, action, actor_user_id, new_values
  )
  values (
    'user_access', v_user.id::text, 'bootstrap_super_admin', null,
    jsonb_build_object('email', v_user.email, 'role_code', 'super_admin')
  );
  return true;
end;
$$;

-- Se a conta ainda não existir, crie-a no Supabase Auth e repita:
-- select public.bootstrap_biotrop_super_admin('felipe.vieira@biotrop.com.br');
select public.bootstrap_biotrop_super_admin('felipe.vieira@biotrop.com.br');

create or replace view public.v_utility_meter_status
with (security_barrier = true)
as
select
  m.id,
  m.code,
  m.name,
  m.utility_type,
  m.location,
  m.unit,
  m.active,
  m.deleted_at,
  m.unit_id,
  u.code as unit_code,
  u.name as unit_name,
  u.sort_order as unit_sort_order,
  lr.id as last_reading_id,
  lr.reading_value as last_reading,
  lr.previous_reading,
  lr.consumption as last_consumption,
  lr.reading_date as last_reading_at,
  (lr.id is not null) as has_reading
from public.utility_meters m
left join public.industrial_units u on u.id = m.unit_id
left join lateral (
  select r.*
  from public.utility_readings r
  where r.meter_id = m.id and r.active
  order by r.server_timestamp desc, r.id desc
  limit 1
) lr on true
where m.active or public.has_permission('meters.manage');

create or replace view public.v_utility_reading_history
with (security_invoker = true)
as
select
  r.id,
  r.meter_id,
  m.code as meter_code,
  m.name as meter_name,
  m.utility_type,
  m.unit,
  coalesce(u.name, m.location) as unit_name,
  r.user_id,
  coalesce(p.full_name, p.name, p.email) as user_name,
  p.email as user_email,
  r.reading_value,
  r.previous_reading,
  r.consumption,
  r.reading_date,
  r.server_timestamp,
  r.status,
  r.observation,
  r.photo_path,
  r.latitude,
  r.longitude,
  r.captured_at
from public.utility_readings r
join public.utility_meters m on m.id = r.meter_id
left join public.industrial_units u on u.id = m.unit_id
left join public.profiles p on p.id = r.user_id
where r.active;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.industrial_units enable row level security;
alter table public.utility_meters enable row level security;
alter table public.utility_readings enable row level security;
alter table public.access_audit_log enable row level security;
alter table public.service_requests enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.training_courses enable row level security;
alter table public.training_progress enable row level security;
alter table public.materials enable row level security;
alter table public.material_families enable row level security;

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_select_v2 on public.profiles;
create policy profiles_select_v2 on public.profiles
for select to authenticated
using (id = auth.uid() or public.has_permission('users.view'));

drop policy if exists profiles_update_self_v2 on public.profiles;
create policy profiles_update_self_v2 on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists roles_select_v2 on public.roles;
create policy roles_select_v2 on public.roles
for select to authenticated
using (public.has_permission('roles.view') or public.has_permission('users.manage'));

drop policy if exists permissions_select_v2 on public.permissions;
create policy permissions_select_v2 on public.permissions
for select to authenticated
using (public.has_permission('roles.view'));

drop policy if exists role_permissions_select_v2 on public.role_permissions;
create policy role_permissions_select_v2 on public.role_permissions
for select to authenticated
using (public.has_permission('roles.view'));

drop policy if exists user_roles_select_v2 on public.user_roles;
create policy user_roles_select_v2 on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.has_permission('users.view'));

drop policy if exists industrial_units_select_v2 on public.industrial_units;
create policy industrial_units_select_v2 on public.industrial_units
for select to authenticated
using (active or public.has_permission('meters.manage'));

drop policy if exists industrial_units_manage_v2 on public.industrial_units;
create policy industrial_units_manage_v2 on public.industrial_units
for all to authenticated
using (public.has_permission('meters.manage'))
with check (public.has_permission('meters.manage'));

drop policy if exists utility_meters_select on public.utility_meters;
drop policy if exists utility_meters_select_v2 on public.utility_meters;
create policy utility_meters_select_v2 on public.utility_meters
for select to authenticated
using (active or public.has_permission('meters.manage'));

drop policy if exists utility_meters_insert on public.utility_meters;
drop policy if exists utility_meters_insert_v2 on public.utility_meters;
create policy utility_meters_insert_v2 on public.utility_meters
for insert to authenticated
with check (public.has_permission('meters.manage'));

drop policy if exists utility_meters_update on public.utility_meters;
drop policy if exists utility_meters_update_v2 on public.utility_meters;
create policy utility_meters_update_v2 on public.utility_meters
for update to authenticated
using (public.has_permission('meters.manage'))
with check (public.has_permission('meters.manage'));

drop policy if exists utility_readings_select on public.utility_readings;
drop policy if exists utility_readings_select_v2 on public.utility_readings;
create policy utility_readings_select_v2 on public.utility_readings
for select to authenticated
using (
  user_id = auth.uid()
  or public.has_permission('readings.view_all')
);

drop policy if exists utility_readings_insert on public.utility_readings;
drop policy if exists utility_readings_insert_v2 on public.utility_readings;
create policy utility_readings_insert_v2 on public.utility_readings
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.has_permission('readings.create')
);

drop policy if exists utility_readings_update on public.utility_readings;
drop policy if exists utility_readings_update_v2 on public.utility_readings;
create policy utility_readings_update_v2 on public.utility_readings
for update to authenticated
using (public.has_permission('readings.manage'))
with check (public.has_permission('readings.manage'));

drop policy if exists access_audit_select_v2 on public.access_audit_log;
create policy access_audit_select_v2 on public.access_audit_log
for select to authenticated
using (public.has_permission('audit.view'));

drop policy if exists service_requests_select_v2 on public.service_requests;
create policy service_requests_select_v2 on public.service_requests
for select to authenticated
using (requester_id = auth.uid() or public.has_permission('requests.view_all'));

drop policy if exists service_requests_insert_v2 on public.service_requests;
create policy service_requests_insert_v2 on public.service_requests
for insert to authenticated
with check (requester_id = auth.uid() and public.has_permission('requests.create'));

drop policy if exists service_requests_update_v2 on public.service_requests;
create policy service_requests_update_v2 on public.service_requests
for update to authenticated
using (
  requester_id = auth.uid()
  or public.has_permission('requests.approve')
  or public.has_permission('requests.manage')
)
with check (
  requester_id = auth.uid()
  or public.has_permission('requests.approve')
  or public.has_permission('requests.manage')
);

drop policy if exists purchase_requests_select_v2 on public.purchase_requests;
create policy purchase_requests_select_v2 on public.purchase_requests
for select to authenticated
using (requester_id = auth.uid() or public.has_permission('requests.view_all'));

drop policy if exists purchase_requests_insert_v2 on public.purchase_requests;
create policy purchase_requests_insert_v2 on public.purchase_requests
for insert to authenticated
with check (requester_id = auth.uid() and public.has_permission('requests.create'));

drop policy if exists purchase_requests_update_v2 on public.purchase_requests;
create policy purchase_requests_update_v2 on public.purchase_requests
for update to authenticated
using (
  requester_id = auth.uid()
  or public.has_permission('requests.approve')
  or public.has_permission('requests.manage')
)
with check (
  requester_id = auth.uid()
  or public.has_permission('requests.approve')
  or public.has_permission('requests.manage')
);

drop policy if exists training_courses_select_v2 on public.training_courses;
create policy training_courses_select_v2 on public.training_courses
for select to authenticated
using (active and public.has_permission('trainings.view') or public.has_permission('trainings.manage'));

drop policy if exists training_courses_insert_v2 on public.training_courses;
create policy training_courses_insert_v2 on public.training_courses
for insert to authenticated
with check (public.has_permission('trainings.manage') and created_by = auth.uid());

drop policy if exists training_courses_update_v2 on public.training_courses;
create policy training_courses_update_v2 on public.training_courses
for update to authenticated
using (public.has_permission('trainings.manage'))
with check (public.has_permission('trainings.manage'));

drop policy if exists training_progress_select_v2 on public.training_progress;
create policy training_progress_select_v2 on public.training_progress
for select to authenticated
using (user_id = auth.uid() or public.has_permission('trainings.manage'));

drop policy if exists training_progress_insert_v2 on public.training_progress;
create policy training_progress_insert_v2 on public.training_progress
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists training_progress_update_v2 on public.training_progress;
create policy training_progress_update_v2 on public.training_progress
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists materials_select_v2 on public.materials;
create policy materials_select_v2 on public.materials
for select to authenticated
using (user_id = auth.uid() or public.has_permission('requests.view_all'));

drop policy if exists materials_insert_v2 on public.materials;
create policy materials_insert_v2 on public.materials
for insert to authenticated
with check (user_id = auth.uid() and public.has_permission('requests.create'));

drop policy if exists materials_update_v2 on public.materials;
create policy materials_update_v2 on public.materials
for update to authenticated
using (user_id = auth.uid() or public.has_permission('requests.manage'))
with check (user_id = auth.uid() or public.has_permission('requests.manage'));

drop policy if exists material_families_select_v2 on public.material_families;
create policy material_families_select_v2 on public.material_families
for select to authenticated
using (active or public.has_permission('requests.manage'));

drop policy if exists material_families_insert_v2 on public.material_families;
create policy material_families_insert_v2 on public.material_families
for insert to authenticated
with check (public.has_permission('requests.manage'));

drop policy if exists material_families_update_v2 on public.material_families;
create policy material_families_update_v2 on public.material_families
for update to authenticated
using (public.has_permission('requests.manage'))
with check (public.has_permission('requests.manage'));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'utility-evidence',
  'utility-evidence',
  false,
  12582912,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists utility_evidence_insert_self on storage.objects;
drop policy if exists utility_evidence_insert_v2 on storage.objects;
create policy utility_evidence_insert_v2 on storage.objects
for insert to authenticated
with check (
  bucket_id = 'utility-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_permission('readings.create')
);

drop policy if exists utility_evidence_select_self on storage.objects;
drop policy if exists utility_evidence_select_v2 on storage.objects;
create policy utility_evidence_select_v2 on storage.objects
for select to authenticated
using (
  bucket_id = 'utility-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.has_permission('readings.view_all')
  )
);

drop policy if exists utility_evidence_update_self on storage.objects;
drop policy if exists utility_evidence_delete_self on storage.objects;
drop policy if exists utility_evidence_delete_v2 on storage.objects;
create policy utility_evidence_delete_v2 on storage.objects
for delete to authenticated
using (
  bucket_id = 'utility-evidence'
  and (
    public.has_permission('readings.manage')
    or (
      (storage.foldername(name))[1] = auth.uid()::text
      and not exists (
        select 1 from public.utility_readings r where r.photo_path = storage.objects.name
      )
    )
  )
);

revoke all on public.profiles from anon, authenticated;
revoke all on public.roles, public.permissions, public.role_permissions, public.user_roles from anon, authenticated;
revoke all on public.industrial_units, public.utility_meters, public.utility_readings from anon, authenticated;
revoke all on public.access_audit_log from anon, authenticated;
revoke all on public.service_requests, public.purchase_requests from anon, authenticated;
revoke all on public.training_courses, public.training_progress from anon, authenticated;
revoke all on public.materials from anon, authenticated;
revoke all on public.material_families from anon, authenticated;

do $$
begin
  if to_regclass('public.materiais') is not null then
    execute 'revoke delete on public.materiais from authenticated';
  end if;
  if to_regclass('public.apontamentos') is not null then
    execute 'revoke delete on public.apontamentos from authenticated';
  end if;
  if to_regclass('public.aprovacao_auditoria') is not null then
    execute 'revoke insert, update, delete on public.aprovacao_auditoria from authenticated';
  end if;
end;
$$;

grant select on public.profiles to authenticated;
grant update(name, full_name, phone, department, sector, avatar_url, theme, notifications_enabled)
  on public.profiles to authenticated;
grant select on public.roles, public.permissions, public.role_permissions, public.user_roles to authenticated;
grant select, insert, update on public.industrial_units to authenticated;
grant select, insert, update on public.utility_meters to authenticated;
grant select, insert, update on public.utility_readings to authenticated;
grant select on public.access_audit_log to authenticated;
grant select, insert, update on public.service_requests, public.purchase_requests to authenticated;
grant select, insert, update on public.training_courses, public.training_progress to authenticated;
grant select, insert, update on public.materials to authenticated;
grant select, insert, update on public.material_families to authenticated;
grant select on public.v_utility_meter_status, public.v_utility_reading_history to authenticated;

revoke all on function public.bootstrap_biotrop_super_admin(text) from public, anon, authenticated;
grant execute on function public.has_permission(text, uuid) to authenticated, service_role;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_my_access_context() to authenticated;
grant execute on function public.create_utility_reading(uuid, numeric, text, text, numeric, numeric) to authenticated;
grant execute on function public.admin_set_user_access(uuid, text, boolean) to authenticated;
grant execute on function public.admin_set_role_permissions(text, text[]) to authenticated;
grant execute on function public.get_access_admin_data() to authenticated;
grant execute on function public.touch_my_last_login() to authenticated;

commit;
