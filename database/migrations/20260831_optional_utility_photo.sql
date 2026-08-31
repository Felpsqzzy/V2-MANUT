-- A foto é evidência complementar, não requisito para registrar a leitura.
create or replace function public.prepare_utility_reading()
returns trigger
language plpgsql
security definer
set search_path to pg_catalog, public
as $function$
declare
  v_previous numeric(18,3);
  v_uid uuid;
  v_meter_active boolean;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception using errcode='42501',message='A leitura exige uma sessão autenticada.'; end if;
  if not public.has_permission('readings.create',v_uid) then raise exception using errcode='42501',message='Usuário sem permissão para registrar leituras.'; end if;
  select m.active into v_meter_active from public.utility_meters m where m.id=new.meter_id;
  if coalesce(v_meter_active,false)=false then raise exception using errcode='22023',message='O medidor informado não existe ou está inativo.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.meter_id::text,0));
  select r.reading_value into v_previous from public.utility_readings r where r.meter_id=new.meter_id and r.active order by r.server_timestamp desc,r.id desc limit 1 for update;
  if v_previous is not null and new.reading_value<v_previous then raise exception using errcode='P0001',message=format('A leitura informada (%s) não pode ser menor que a leitura anterior (%s).',new.reading_value,v_previous); end if;
  new.user_id:=v_uid;
  new.previous_reading:=v_previous;
  new.consumption:=case when v_previous is null then null else new.reading_value-v_previous end;
  new.reading_date:=clock_timestamp();
  new.server_timestamp:=new.reading_date;
  new.created_at:=new.reading_date;
  new.updated_at:=new.reading_date;
  new.captured_at:=coalesce(new.captured_at,new.reading_date);
  new.active:=true;
  new.deleted_at:=null;
  return new;
end;
$function$;