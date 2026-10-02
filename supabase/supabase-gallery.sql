-- Run once in Supabase → SQL Editor.
-- Creates a public "gallery" bucket (photos can be seen by everyone)
-- and lets only admins upload, replace, or delete photos.

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "Gallery photos are public" on storage.objects;
create policy "Gallery photos are public"
  on storage.objects for select
  using (bucket_id = 'gallery');

drop policy if exists "Admins upload gallery photos" on storage.objects;
create policy "Admins upload gallery photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "Admins replace gallery photos" on storage.objects;
create policy "Admins replace gallery photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "Admins delete gallery photos" on storage.objects;
create policy "Admins delete gallery photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_admin());
