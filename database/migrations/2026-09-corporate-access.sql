create table if not exists public.corporate_access_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  enabled boolean not null default true,
  allowed_roles text[] not null default array['viewer']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.corporate_access_allowlist enable row level security;

drop policy if exists corporate_access_admin_all on public.corporate_access_allowlist;
create policy corporate_access_admin_all on public.corporate_access_allowlist
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.app_role in ('admin','administrador','super_admin')))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.app_role in ('admin','administrador','super_admin')));

create index if not exists idx_corporate_access_allowlist_enabled
  on public.corporate_access_allowlist(enabled);

create or replace function public.is_corporate_email_allowed(p_email text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.corporate_access_allowlist
    where lower(email)=lower(trim(p_email)) and enabled=true
  )
  or lower(split_part(trim(p_email),'@',2))='biotrop.com.br';
$$;

revoke all on function public.is_corporate_email_allowed(text) from public;
grant execute on function public.is_corporate_email_allowed(text) to authenticated, anon;
