begin;

-- Compatibilidade das leituras com os módulos legados/front-end.
alter table utility_readings add column if not exists user_id uuid references app_users(id) on delete restrict;
alter table utility_readings add column if not exists photo_path text;
alter table utility_readings add column if not exists active boolean not null default true;
alter table utility_readings add column if not exists deleted_at timestamptz;
alter table utility_readings add column if not exists captured_at timestamptz;
alter table utility_readings add column if not exists inconsistent boolean not null default false;
alter table utility_readings add column if not exists correction_requested boolean not null default false;

update utility_readings
set user_id=coalesce(user_id,created_by)
where user_id is null;

create or replace function sync_utility_reading_compat()
returns trigger language plpgsql as $$
begin
  new.user_id := coalesce(new.user_id,new.created_by);
  new.created_by := coalesce(new.created_by,new.user_id);
  if new.photo_path is null and new.photo_file_id is not null then
    select object_name into new.photo_path from file_objects where id=new.photo_file_id;
  end if;
  new.captured_at := coalesce(new.captured_at,new.server_timestamp,new.created_at,clock_timestamp());
  new.active := coalesce(new.active,true);
  return new;
end;
$$;

drop trigger if exists trg_sync_utility_reading_compat on utility_readings;
create trigger trg_sync_utility_reading_compat
before insert or update on utility_readings
for each row execute function sync_utility_reading_compat();

create index if not exists idx_utility_readings_compat_user_date
  on utility_readings(user_id,server_timestamp desc);

create or replace view v_utility_reading_history as
select
  r.id,
  r.meter_id,
  m.code as meter_code,
  m.name as meter_name,
  m.utility_type,
  m.unit,
  r.user_id,
  coalesce(u.name,'') as user_name,
  u.email as user_email,
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
from utility_readings r
join utility_meters m on m.id=r.meter_id
left join app_users u on u.id=r.user_id
where r.active=true;

-- Treinamentos: alias para o formato esperado pelo front-end.
alter table training_progress add column if not exists training_id uuid references training_courses(id) on delete restrict;
alter table training_progress add column if not exists percentage numeric(5,2) not null default 0 check (percentage between 0 and 100);

update training_progress
set training_id=coalesce(training_id,course_id)
where training_id is null and course_id is not null;
update training_progress
set percentage=coalesce(percentage,0)
where percentage is null;

create unique index if not exists ux_training_progress_training_user
  on training_progress(training_id,user_id)
  where training_id is not null and user_id is not null;

create or replace function sync_training_progress_compat()
returns trigger language plpgsql as $$
begin
  new.training_id := coalesce(new.training_id,new.course_id);
  new.course_id := coalesce(new.course_id,new.training_id);
  new.percentage := greatest(0,least(100,coalesce(new.percentage,0)));
  return new;
end;
$$;

drop trigger if exists trg_sync_training_progress_compat on training_progress;
create trigger trg_sync_training_progress_compat
before insert or update on training_progress
for each row execute function sync_training_progress_compat();

-- Campos simples usados pela tela de solicitações.
alter table service_requests add column if not exists quantity numeric(14,3);
alter table service_requests add column if not exists unit text;

-- Mantém a ordenação usada nos cards de medidores.
alter table utility_meters add column if not exists deleted_at timestamptz;

create or replace view v_utility_meter_status as
select
  m.id,m.code,m.name,m.utility_type,m.location,m.unit,m.active,m.deleted_at,m.unit_id,
  iu.code as unit_code,iu.name as unit_name,iu.sort_order as unit_sort_order,
  lr.id as last_reading_id,lr.reading_value as last_reading,lr.previous_reading,
  lr.consumption as last_consumption,lr.server_timestamp as last_reading_at,
  (lr.id is not null) as has_reading
from utility_meters m
left join industrial_units iu on iu.id=m.unit_id
left join lateral(
  select r.* from utility_readings r
  where r.meter_id=m.id and r.active=true
  order by r.server_timestamp desc,r.id desc limit 1
) lr on true
where m.active=true or exists(
  select 1 from utility_meters mm where mm.id=m.id and mm.active=false
);

commit;
