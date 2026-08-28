-- BIOTROP • PostgreSQL / Supabase schema versionado
-- Auth é gerenciado por Supabase Auth; não armazene senha em public.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text,
  email text,
  phone text,
  department text,
  sector text,
  avatar_url text,
  role_code text not null default 'tecnico',
  app_role text not null default 'tecnico',
  active boolean not null default true,
  is_active boolean not null default true,
  theme text not null default 'dark' check (theme in ('dark','light','system')),
  notifications_enabled boolean not null default true,
  full_name text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  codigo_item text,
  descricao text not null,
  categoria text,
  quantidade numeric(14,3) not null default 1 check (quantidade >= 0),
  unidade text not null default 'UN',
  observacoes text,
  status text not null default 'Pendente' check (status in ('Pendente','Aprovado','Rejeitado')),
  solicitante_id uuid references auth.users(id) on delete set null,
  aprovado_por uuid references auth.users(id) on delete set null,
  aprovado_em timestamptz,
  rejeitado_motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_materiais_status on public.materiais(status);
create index if not exists idx_materiais_solicitante on public.materiais(solicitante_id);
create index if not exists idx_materiais_codigo on public.materiais(codigo_item);

create table if not exists public.apontamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  equipamento text,
  valor numeric(14,3),
  unidade text,
  observacao text,
  status text not null default 'Pendente' check (status in ('Pendente','Aprovado','Rejeitado')),
  aprovado_por uuid references auth.users(id) on delete set null,
  aprovado_em timestamptz,
  rejeitado_motivo text,
  foto_path text,
  video_path text,
  latitude double precision,
  longitude double precision,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_apontamentos_status on public.apontamentos(status);
create index if not exists idx_apontamentos_user_created on public.apontamentos(user_id,created_at desc);

create table if not exists public.material_anexos (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materiais(id) on delete cascade,
  nome_arquivo text not null,
  mime_type text,
  tamanho_bytes bigint,
  storage_path text not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_material_anexos_material on public.material_anexos(material_id);

create table if not exists public.aprovacao_auditoria (
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  registro_id uuid not null,
  status_anterior text,
  status_novo text not null,
  aprovado_por uuid references auth.users(id) on delete set null,
  motivo text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================
-- UTILIDADES / MEDIDORES
-- =============================
create table if not exists public.utility_meters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  utility_type text not null check (utility_type in ('horimetro','agua','gas','energia')),
  location text,
  unit text not null default 'h',
  initial_reading numeric(14,3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_utility_meters_type on public.utility_meters(utility_type);
create index if not exists idx_utility_meters_active on public.utility_meters(active);

create table if not exists public.utility_readings (
  id uuid primary key default gen_random_uuid(),
  meter_id uuid references public.utility_meters(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reading_value numeric(14,3) not null,
  previous_reading numeric(14,3),
  consumption numeric(14,3),
  reading_date timestamptz not null default now(),
  server_timestamp timestamptz not null default now(),
  latitude numeric(10,7),
  longitude numeric(10,7),
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  observation text,
  inconsistent boolean not null default false,
  correction_requested boolean not null default false,
  photo_path text,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_utility_readings_meter_date on public.utility_readings(meter_id,reading_date desc);
create index if not exists idx_utility_readings_user_date on public.utility_readings(user_id,reading_date desc);
create index if not exists idx_utility_readings_status on public.utility_readings(status);

-- Compatibilidade com versões anteriores que já possuíam public.meters.
create table if not exists public.meters (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid,
  code text not null unique,
  name text not null,
  unit text not null default 'h',
  location text,
  sector text,
  equipment text,
  serial_number text,
  manufacturer text,
  model text,
  status text not null default 'active',
  installed_at date,
  initial_reading numeric(14,3) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

insert into storage.buckets(id,name,public) values ('profile-pictures','profile-pictures',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values ('material-attachments','material-attachments',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values ('utility-evidence','utility-evidence',false) on conflict(id) do nothing;

alter table public.profiles enable row level security;
alter table public.materiais enable row level security;
alter table public.apontamentos enable row level security;
alter table public.material_anexos enable row level security;
alter table public.aprovacao_auditoria enable row level security;
alter table public.user_notifications enable row level security;
alter table public.utility_meters enable row level security;
alter table public.utility_readings enable row level security;

-- Função segura para verificar gestor/admin sem depender da tabela no frontend.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.role_code,p.app_role,'') in ('admin','gestor','aprovador','almoxarife')
      and coalesce(p.active,true)=true
  );
$$;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using ((select auth.uid())=id or public.current_user_is_admin());
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert to authenticated with check ((select auth.uid())=id);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using ((select auth.uid())=id or public.current_user_is_admin()) with check ((select auth.uid())=id or public.current_user_is_admin());

drop policy if exists materiais_select_own_or_approved on public.materiais;
create policy materiais_select_own_or_approved on public.materiais for select to authenticated using ((select auth.uid())=solicitante_id or status='Aprovado' or public.current_user_is_admin());
drop policy if exists materiais_insert_own on public.materiais;
create policy materiais_insert_own on public.materiais for insert to authenticated with check ((select auth.uid())=solicitante_id);
drop policy if exists materiais_update_own on public.materiais;
create policy materiais_update_own on public.materiais for update to authenticated using ((select auth.uid())=solicitante_id or public.current_user_is_admin()) with check ((select auth.uid())=solicitante_id or public.current_user_is_admin());

drop policy if exists apontamentos_select_own_or_approved on public.apontamentos;
create policy apontamentos_select_own_or_approved on public.apontamentos for select to authenticated using ((select auth.uid())=user_id or status='Aprovado' or public.current_user_is_admin());
drop policy if exists apontamentos_insert_own on public.apontamentos;
create policy apontamentos_insert_own on public.apontamentos for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists apontamentos_update_own on public.apontamentos;
create policy apontamentos_update_own on public.apontamentos for update to authenticated using ((select auth.uid())=user_id or public.current_user_is_admin()) with check ((select auth.uid())=user_id or public.current_user_is_admin());

drop policy if exists utility_meters_select on public.utility_meters;
create policy utility_meters_select on public.utility_meters for select to authenticated using (true);
drop policy if exists utility_meters_insert on public.utility_meters;
create policy utility_meters_insert on public.utility_meters for insert to authenticated with check ((select auth.uid()) is not null);
drop policy if exists utility_meters_update on public.utility_meters;
create policy utility_meters_update on public.utility_meters for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

drop policy if exists utility_readings_select on public.utility_readings;
create policy utility_readings_select on public.utility_readings for select to authenticated using ((user_id=(select auth.uid()) or public.current_user_is_admin()));
drop policy if exists utility_readings_insert on public.utility_readings;
create policy utility_readings_insert on public.utility_readings for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists utility_readings_update on public.utility_readings;
create policy utility_readings_update on public.utility_readings for update to authenticated using ((user_id=(select auth.uid()) or public.current_user_is_admin())) with check ((user_id=(select auth.uid()) or public.current_user_is_admin()));

grant select,insert,update on public.utility_meters to authenticated;
grant select,insert,update on public.utility_readings to authenticated;

drop policy if exists utility_evidence_insert_self on storage.objects;
create policy utility_evidence_insert_self on storage.objects for insert to authenticated with check (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists utility_evidence_select_self on storage.objects;
create policy utility_evidence_select_self on storage.objects for select to authenticated using (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists utility_evidence_delete_self on storage.objects;
create policy utility_evidence_delete_self on storage.objects for delete to authenticated using (bucket_id='utility-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists material_anexos_select_own on public.material_anexos;
create policy material_anexos_select_own on public.material_anexos for select to authenticated using ((select auth.uid())=uploaded_by or public.current_user_is_admin());
drop policy if exists material_anexos_insert_own on public.material_anexos;
create policy material_anexos_insert_own on public.material_anexos for insert to authenticated with check ((select auth.uid())=uploaded_by);

drop policy if exists notifications_own on public.user_notifications;
create policy notifications_own on public.user_notifications for select to authenticated using ((select auth.uid())=user_id);

-- Storage: fotos de perfil públicas; upload/update somente na pasta do próprio UID.
drop policy if exists profile_pictures_public_read on storage.objects;
create policy profile_pictures_public_read on storage.objects for select using (bucket_id='profile-pictures');
drop policy if exists profile_pictures_insert_self on storage.objects;
create policy profile_pictures_insert_self on storage.objects for insert to authenticated with check (bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists profile_pictures_update_self on storage.objects;
create policy profile_pictures_update_self on storage.objects for update to authenticated using (bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists material_attachments_select_self on storage.objects;
create policy material_attachments_select_self on storage.objects for select to authenticated using (bucket_id='material-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists material_attachments_insert_self on storage.objects;
create policy material_attachments_insert_self on storage.objects for insert to authenticated with check (bucket_id='material-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Perfil automático no cadastro Auth.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  insert into public.profiles(id,name,full_name,email,role_code,app_role,active,is_active)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),new.email,'tecnico','tecnico',true,true)
  on conflict(id) do update set email=excluded.email,updated_at=now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_biotrop on auth.users;
create trigger on_auth_user_created_biotrop after insert on auth.users for each row execute procedure public.handle_new_auth_user();