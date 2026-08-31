-- BIOTROP V2 — Treinamentos V3
-- Grupos de público + vídeos privados no Supabase Storage.

begin;

alter table public.training_courses
  add column if not exists audience_groups text[] not null default array['todos']::text[];
alter table public.training_courses
  add column if not exists video_path text;
alter table public.training_courses
  add column if not exists content_type text default 'video';

update public.training_courses
set audience_groups = array['todos']::text[]
where audience_groups is null or cardinality(audience_groups) = 0;

create index if not exists idx_training_courses_audience
  on public.training_courses using gin(audience_groups);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('training-videos','training-videos',false,524288000,array['video/*','application/octet-stream'])
on conflict (id) do update set
  public = false,
  file_size_limit = 524288000,
  allowed_mime_types = array['video/*','application/octet-stream'];

drop policy if exists training_videos_select_v2 on storage.objects;
drop policy if exists training_videos_insert_v2 on storage.objects;
drop policy if exists training_videos_update_v2 on storage.objects;
drop policy if exists training_videos_delete_v2 on storage.objects;

create policy training_videos_select_v2
on storage.objects for select to authenticated
using (bucket_id = 'training-videos' and public.has_permission('trainings.view'));

create policy training_videos_insert_v2
on storage.objects for insert to authenticated
with check (
  bucket_id = 'training-videos'
  and public.has_permission('trainings.manage')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy training_videos_update_v2
on storage.objects for update to authenticated
using (
  bucket_id = 'training-videos'
  and public.has_permission('trainings.manage')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'training-videos'
  and public.has_permission('trainings.manage')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy training_videos_delete_v2
on storage.objects for delete to authenticated
using (
  bucket_id = 'training-videos'
  and public.has_permission('trainings.manage')
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
