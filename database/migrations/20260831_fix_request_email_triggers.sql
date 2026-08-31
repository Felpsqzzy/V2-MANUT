-- Fix trigger functions that referenced NEW.request_number and NEW.code directly.
-- PostgreSQL records do not expose a field that does not exist on the current table;
-- use to_jsonb(NEW) so the same trigger function safely handles SCI and SCM.
create or replace function public.enqueue_almoxarifado_email()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public
as $function$
declare
  v_old_status text; v_new_status text; v_entity_type text; v_entity_id uuid;
  v_code text; v_description text; v_recip record; v_subject text; v_body text; v_json jsonb;
begin
  v_entity_type := case when TG_TABLE_NAME='service_requests' then 'SCI' else 'SCM' end;
  v_entity_id := coalesce(NEW.id,OLD.id);
  v_json := to_jsonb(NEW);
  v_old_status := case when TG_OP='UPDATE' then OLD.status else null end;
  v_new_status := case when TG_OP<>'DELETE' then NEW.status else null end;
  if TG_OP='UPDATE' and coalesce(v_old_status,'')=coalesce(v_new_status,'') then return NEW; end if;
  if TG_OP='DELETE' then return OLD; end if;
  v_code := coalesce(v_json->>'request_number',v_json->>'code',v_entity_id::text);
  v_description := coalesce(v_json->>'description','Sem descrição');
  v_subject := format('BIOTROP Almoxarifado — %s %s',v_entity_type,coalesce(v_new_status,'atualizada'));
  v_body := format(E'Solicitação %s %s recebeu uma atualização.%s\n\nNúmero: %s\nStatus anterior: %s\nNovo status: %s\nDescrição: %s\n\nAcesse a Plataforma de Manutenção para consultar os detalhes.',v_entity_type,v_new_status,case when v_old_status is null then ' foi criada.' else ' teve o status alterado.' end,v_code,coalesce(v_old_status,'—'),coalesce(v_new_status,'—'),v_description);
  for v_recip in select distinct p.email,coalesce(p.full_name,p.name) recipient_name from public.profiles p where coalesce(p.active,p.is_active,true)=true and nullif(trim(p.email),'') is not null and (lower(coalesce(p.role_code,''))='almoxarife' or lower(coalesce(p.app_role,''))='almoxarife' or exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=p.id and ur.active=true and r.active=true and lower(r.code)='almoxarife')) loop
    insert into public.notification_email_queue(event_type,entity_type,entity_id,recipient_email,recipient_name,subject,body_text)
    values(case when v_old_status is null then 'created' else 'status_changed' end,v_entity_type,v_entity_id,v_recip.email,v_recip.recipient_name,v_subject,v_body);
  end loop;
  return NEW;
end;
$function$;

create or replace function public.notify_workflow_request()
returns trigger language plpgsql security definer
set search_path=public
as $function$
declare v_workflow text; v_leader uuid; v_title text; v_code text; v_json jsonb;
begin
  v_workflow := case when TG_TABLE_NAME='service_requests' then 'SCI' else 'SCM' end;
  v_json := to_jsonb(NEW);
  v_leader := (select leader_user_id from public.approval_leaders where workflow=v_workflow);
  v_code := coalesce(v_json->>'request_number',v_json->>'code','Solicitação');
  if v_leader is not null then
    v_title := 'Nova '||v_workflow||' para aprovação';
    insert into public.app_notifications(user_id,type,title,body,entity_type,entity_id)
    values(v_leader,'approval',v_title,v_code||' aguarda sua análise.',v_workflow,NEW.id);
    insert into public.notification_email_queue(event_type,entity_type,entity_id,recipient_email,recipient_name,subject,body_text,status)
    select 'approval_pending',v_workflow,NEW.id,p.email,coalesce(p.full_name,p.name),v_title,v_code||' aguarda sua análise.','pending'
    from public.profiles p where p.id=v_leader and nullif(trim(p.email),'') is not null;
  end if;
  return NEW;
end;
$function$;
