-- 2026-08-31
-- Notificações automáticas do Almoxarifado para mudanças de status em SCI/SCM.
-- A chave compartilhada fica no Supabase Vault e nunca deve ir para o Git.

create table if not exists public.notification_email_queue (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  body_text text not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_notification_email_queue_pending on public.notification_email_queue(status,created_at);
create index if not exists idx_notification_email_queue_entity on public.notification_email_queue(entity_type,entity_id);
alter table public.notification_email_queue enable row level security;

create or replace function public.get_biotrop_email_webhook_secret()
returns text language sql security definer
set search_path = pg_catalog, public, vault
as $$ select decrypted_secret from vault.decrypted_secrets where name='biotrop_almox_email_webhook_secret' limit 1; $$;
revoke all on function public.get_biotrop_email_webhook_secret() from public, anon, authenticated;
grant execute on function public.get_biotrop_email_webhook_secret() to service_role;

create or replace function public.enqueue_almoxarifado_email()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $function$
declare
  v_old_status text; v_new_status text; v_entity_type text; v_entity_id uuid;
  v_code text; v_description text; v_recip record; v_subject text; v_body text;
begin
  v_entity_type := case when TG_TABLE_NAME='service_requests' then 'SCI' else 'SCM' end;
  v_entity_id := coalesce(NEW.id, OLD.id);
  v_old_status := case when TG_OP='UPDATE' then OLD.status else null end;
  v_new_status := case when TG_OP<>'DELETE' then NEW.status else null end;
  if TG_OP='UPDATE' and coalesce(v_old_status,'')=coalesce(v_new_status,'') then return NEW; end if;
  if TG_OP='DELETE' then return OLD; end if;
  v_code := coalesce(NEW.request_number, NEW.code, NEW.id::text);
  v_description := coalesce(NEW.description, 'Sem descrição');
  v_subject := format('BIOTROP Almoxarifado — %s %s', v_entity_type, coalesce(v_new_status,'atualizada'));
  v_body := format('Solicitação %s %s recebeu uma atualização.%s\n\nNúmero: %s\nStatus anterior: %s\nNovo status: %s\nDescrição: %s\n\nAcesse a Plataforma de Manutenção para consultar os detalhes.', v_entity_type, v_new_status, case when v_old_status is null then ' foi criada.' else ' teve o status alterado.' end, v_code, coalesce(v_old_status,'—'), coalesce(v_new_status,'—'), v_description);
  for v_recip in select distinct p.email, coalesce(p.full_name,p.name) recipient_name from public.profiles p where p.active=true and nullif(trim(p.email),'') is not null and (lower(coalesce(p.role_code,''))='almoxarife' or lower(coalesce(p.app_role,''))='almoxarife' or exists (select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=p.id and ur.active=true and r.active=true and lower(r.code)='almoxarife')) loop
    insert into public.notification_email_queue(event_type,entity_type,entity_id,recipient_email,recipient_name,subject,body_text) values (case when v_old_status is null then 'created' else 'status_changed' end,v_entity_type,v_entity_id,v_recip.email,v_recip.recipient_name,v_subject,v_body);
  end loop;
  return NEW;
end;
$function$;
revoke all on function public.enqueue_almoxarifado_email() from public, anon, authenticated;

drop trigger if exists trg_queue_almox_service_requests on public.service_requests;
create trigger trg_queue_almox_service_requests after insert or update of status on public.service_requests for each row execute function public.enqueue_almoxarifado_email();
drop trigger if exists trg_queue_almox_purchase_requests on public.purchase_requests;
create trigger trg_queue_almox_purchase_requests after insert or update of status on public.purchase_requests for each row execute function public.enqueue_almoxarifado_email();

create or replace function public.notify_almox_email_queue()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, vault, extensions
as $function$
declare v_secret text; v_headers jsonb;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='biotrop_almox_email_webhook_secret' limit 1;
  if v_secret is null then return new; end if;
  v_headers := jsonb_build_object('Content-Type','application/json','x-biotrop-webhook-secret',v_secret);
  perform net.http_post('https://hoikliqttxqdsyyjdnul.supabase.co/functions/v1/almox-email-notifier',jsonb_build_object('queue_id',new.id),'{}'::jsonb,v_headers,5000);
  return new;
end;
$function$;
revoke all on function public.notify_almox_email_queue() from public, anon, authenticated;
drop trigger if exists trg_notify_almox_email_queue on public.notification_email_queue;
create trigger trg_notify_almox_email_queue after insert on public.notification_email_queue for each row execute function public.notify_almox_email_queue();