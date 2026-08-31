-- Inkbox mail transport for Almoxarifado notifications.
-- The actual key is provisioned directly in Supabase Vault and is never stored in Git.
create or replace function public.get_biotrop_inkbox_api_key()
returns text language sql security definer
set search_path=pg_catalog,public,vault
as $$
  select decrypted_secret from vault.decrypted_secrets
  where name='biotrop_inkbox_api_key' limit 1;
$$;
revoke all on function public.get_biotrop_inkbox_api_key() from public,anon,authenticated;
grant execute on function public.get_biotrop_inkbox_api_key() to service_role;
