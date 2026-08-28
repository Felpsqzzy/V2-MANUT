-- BIOTROP • schema consolidado do sistema existente
-- Projeto Supabase: xxqipgvdksughongzpqj
create extension if not exists pgcrypto;

alter table public.utility_readings add column if not exists photo_path text;
alter table public.utility_readings add column if not exists captured_at timestamptz;
alter table public.service_requests add column if not exists approved_at timestamptz;
alter table public.service_requests add column if not exists approved_by uuid;
alter table public.purchase_requests add column if not exists approved_at timestamptz;
alter table public.purchase_requests add column if not exists approved_by uuid;

create table if not exists public.approval_notifications (
  id uuid primary key default gen_random_uuid(), request_id uuid not null, request_type text not null check (request_type in ('SCI','SCM')), request_number text not null, recipient_emails text[] not null default '{}', subject text not null, status text not null default 'pending' check (status in ('pending','sent','failed')), error_message text, created_at timestamptz not null default now(), sent_at timestamptz
);
create unique index if not exists ux_approval_notification_request on public.approval_notifications(request_id,request_type);
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null, message text not null, notification_type text not null default 'info', read_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists idx_user_notifications_user_created on public.user_notifications(user_id,created_at desc);

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(), codigo_item text not null, descricao text not null, categoria text not null, quantidade numeric(14,3) not null default 0 check (quantidade >= 0), unidade text not null, observacoes text, status text not null default 'Pendente' check (status in ('Pendente','Aprovado','Rejeitado')), solicitante_id uuid not null references auth.users(id) on delete cascade, aprovado_por uuid references auth.users(id), aprovado_em timestamptz, rejeitado_motivo text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.apontamentos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tipo text not null, descricao text, valor numeric(14,3), unidade text, foto_path text, latitude numeric(10,7), longitude numeric(10,7), status text not null default 'Pendente' check (status in ('Pendente','Aprovado','Rejeitado')), aprovado_por uuid references auth.users(id), aprovado_em timestamptz, rejeitado_motivo text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists role_code text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists theme text default 'light';
create table if not exists public.aprovacao_auditoria (
  id uuid primary key default gen_random_uuid(), entidade text not null, entidade_id uuid not null, acao text not null check (acao in ('Aprovado','Rejeitado')), realizado_por uuid not null references auth.users(id), realizado_em timestamptz not null default now(), observacao text
);
create or replace function public.audit_approval()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.status is distinct from old.status and new.status in ('Aprovado','Rejeitado') then
    insert into public.aprovacao_auditoria(entidade,entidade_id,acao,realizado_por,observacao) values (tg_table_name,new.id,new.status,coalesce(new.aprovado_por,auth.uid()),new.rejeitado_motivo);
  end if;
  new.updated_at=now(); return new;
end;
$$;
drop trigger if exists trg_materiais_auditoria on public.materiais;
create trigger trg_materiais_auditoria before update on public.materiais for each row execute procedure public.audit_approval();
drop trigger if exists trg_apontamentos_auditoria on public.apontamentos;
create trigger trg_apontamentos_auditoria before update on public.apontamentos for each row execute procedure public.audit_approval();

insert into storage.buckets(id,name,public) values ('avatars','avatars',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values ('profile-pictures','profile-pictures',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values ('utility-evidence','utility-evidence',false) on conflict(id) do nothing;

alter table public.approval_notifications enable row level security;
alter table public.user_notifications enable row level security;
alter table public.materiais enable row level security;
alter table public.apontamentos enable row level security;
alter table public.aprovacao_auditoria enable row level security;
revoke all on public.approval_notifications from anon,authenticated;
revoke all on public.user_notifications from anon,authenticated;
grant insert on public.approval_notifications to authenticated;
grant select on public.user_notifications to authenticated;
grant select,insert,update,delete on public.materiais to authenticated;
grant select,insert,update,delete on public.apontamentos to authenticated;
grant select on public.aprovacao_auditoria to authenticated;

drop policy if exists approval_notifications_insert on public.approval_notifications;
create policy approval_notifications_insert on public.approval_notifications for insert to authenticated with check(true);
drop policy if exists user_notifications_own on public.user_notifications;
create policy user_notifications_own on public.user_notifications for select to authenticated using((select auth.uid())=user_id);
drop policy if exists materiais_select on public.materiais;
create policy materiais_select on public.materiais for select to authenticated using(solicitante_id=auth.uid() or is_admin());
drop policy if exists materiais_insert on public.materiais;
create policy materiais_insert on public.materiais for insert to authenticated with check(solicitante_id=auth.uid());
drop policy if exists materiais_update on public.materiais;
create policy materiais_update on public.materiais for update to authenticated using(solicitante_id=auth.uid() or is_admin()) with check(solicitante_id=auth.uid() or is_admin());
drop policy if exists materiais_delete on public.materiais;
create policy materiais_delete on public.materiais for delete to authenticated using(solicitante_id=auth.uid() or is_admin());
drop policy if exists apontamentos_select on public.apontamentos;
create policy apontamentos_select on public.apontamentos for select to authenticated using(user_id=auth.uid() or is_admin());
drop policy if exists apontamentos_insert on public.apontamentos;
create policy apontamentos_insert on public.apontamentos for insert to authenticated with check(user_id=auth.uid());
drop policy if exists apontamentos_update on public.apontamentos;
create policy apontamentos_update on public.apontamentos for update to authenticated using(user_id=auth.uid() or is_admin()) with check(user_id=auth.uid() or is_admin());
drop policy if exists apontamentos_delete on public.apontamentos;
create policy apontamentos_delete on public.apontamentos for delete to authenticated using(user_id=auth.uid() or is_admin());
drop policy if exists auditoria_select on public.aprovacao_auditoria;
create policy auditoria_select on public.aprovacao_auditoria for select to authenticated using(realizado_por=auth.uid() or is_admin());

drop policy if exists profile_pictures_public_read on storage.objects;
create policy profile_pictures_public_read on storage.objects for select to public using(bucket_id='profile-pictures');
drop policy if exists profile_pictures_insert_own on storage.objects;
create policy profile_pictures_insert_own on storage.objects for insert to authenticated with check(bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists profile_pictures_update_own on storage.objects;
create policy profile_pictures_update_own on storage.objects for update to authenticated using(bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists profile_pictures_delete_own on storage.objects;
create policy profile_pictures_delete_own on storage.objects for delete to authenticated using(bucket_id='profile-pictures' and (storage.foldername(name))[1]=(select auth.uid())::text);

alter publication supabase_realtime add table public.materiais;
alter publication supabase_realtime add table public.apontamentos;
alter publication supabase_realtime add table public.aprovacao_auditoria;
