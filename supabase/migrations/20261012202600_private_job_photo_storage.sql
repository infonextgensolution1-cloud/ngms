-- Finalise private job-photo storage after the new app serves signed URLs.
update storage.buckets set public = false where id = 'job-photos';
drop policy if exists "public read job-photos" on storage.objects;
drop policy if exists staff_read_job_photos on storage.objects;
create policy staff_read_job_photos on storage.objects for select to authenticated
  using (bucket_id = 'job-photos' and (select private.is_ngms_prompt_user()));