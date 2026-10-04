-- Quote-request photos: make the "public-leads" bucket private and staff-only.
--
-- Before: the bucket was public, and anon/authenticated could LIST and READ every
-- object and UPLOAD directly with the anon key (bypassing /api/quote-photo checks).
-- After:  uploads go only through /api/quote-photo (service role); reads only by
--         active staff (private.is_ngms_prompt_user()) via signed URLs.
-- site-media and hero-slides stay publicly readable.
--
-- Reversible: set public = true and restore the two dropped policies.

update storage.buckets set public = false where id = 'public-leads';

drop policy if exists leads_public_upload on storage.objects;

drop policy if exists leads_public_read on storage.objects;
create policy site_media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = any (array['site-media'::text, 'hero-slides'::text]));

create policy quote_photos_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'public-leads' and (select private.is_ngms_prompt_user()));

-- Update/delete on quote photos: staff only (was any signed-in user).
drop policy if exists site_media_staff_update on storage.objects;
create policy site_media_staff_update on storage.objects for update to authenticated
  using (bucket_id = any (array['site-media'::text, 'hero-slides'::text, 'quotes'::text]))
  with check (bucket_id = any (array['site-media'::text, 'hero-slides'::text, 'quotes'::text]));

drop policy if exists site_media_staff_delete on storage.objects;
create policy site_media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = any (array['site-media'::text, 'hero-slides'::text, 'quotes'::text]));

create policy quote_photos_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'public-leads' and (select private.is_ngms_prompt_user()));
