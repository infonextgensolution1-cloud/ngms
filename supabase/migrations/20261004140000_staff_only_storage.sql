-- Staff-only storage writes, and staff-only reads for private buckets.
--
-- Before: any signed-in user (incl. customer-portal users) could upload, change
-- and delete files in every admin bucket, and READ worker-documents and
-- purchase-receipts. Also, the quote-photo staff policies had been created on the
-- "quotes" bucket instead of "public-leads", leaving public-leads with no policy,
-- so staff could not view quote photos in Admin → Leads.
--
-- After:
--   * Public read stays exactly as it was for the public buckets:
--     site-media, hero-slides, gallery-photos, before-after-photos, job-photos.
--   * Only active staff (private.is_ngms_prompt_user()) can upload / update /
--     delete in any admin bucket.
--   * Only active staff can read the private buckets:
--     public-leads (quote photos), quotes, purchase-receipts, worker-documents.
--   * Quote photo uploads still go through /api/quote-photo (service role).
--
-- Safe to re-run: every policy is dropped "if exists" before it is created.
-- Reversible: recreate the dropped policies (names listed below) with their old
-- bucket_id-only conditions.

begin;

-- Old per-bucket policies for signed-in users (and the misplaced quote-photo ones).
drop policy if exists "Authenticated can write before-after-photos storage"  on storage.objects;
drop policy if exists "Authenticated can update before-after-photos storage" on storage.objects;
drop policy if exists "Authenticated can delete before-after-photos storage" on storage.objects;
drop policy if exists "Authenticated can write gallery-photos storage"       on storage.objects;
drop policy if exists "Authenticated can update gallery-photos storage"      on storage.objects;
drop policy if exists "Authenticated can delete gallery-photos storage"      on storage.objects;
drop policy if exists "Authenticated can write hero-slides storage"          on storage.objects;
drop policy if exists "Authenticated can update hero-slides storage"         on storage.objects;
drop policy if exists "Authenticated can delete hero-slides storage"         on storage.objects;
drop policy if exists "staff write job-photos"                               on storage.objects;
drop policy if exists "staff update job-photos"                              on storage.objects;
drop policy if exists "staff delete job-photos"                              on storage.objects;
drop policy if exists "staff read purchase-receipts"                         on storage.objects;
drop policy if exists "staff write purchase-receipts"                        on storage.objects;
drop policy if exists "staff update purchase-receipts"                       on storage.objects;
drop policy if exists "staff delete purchase-receipts"                       on storage.objects;
drop policy if exists "staff read worker-documents"                          on storage.objects;
drop policy if exists "staff write worker-documents"                         on storage.objects;
drop policy if exists "staff update worker-documents"                        on storage.objects;
drop policy if exists "staff delete worker-documents"                        on storage.objects;
drop policy if exists quotes_staff_read                                      on storage.objects;
drop policy if exists site_media_staff_write                                 on storage.objects;
drop policy if exists site_media_staff_update                                on storage.objects;
drop policy if exists site_media_staff_delete                                on storage.objects;
drop policy if exists quote_photos_staff_read                                on storage.objects;
drop policy if exists quote_photos_staff_delete                              on storage.objects;
drop policy if exists staff_storage_write                                    on storage.objects;
drop policy if exists staff_storage_update                                   on storage.objects;
drop policy if exists staff_storage_delete                                   on storage.objects;
drop policy if exists staff_private_read                                     on storage.objects;

-- Staff manage every admin bucket.
create policy staff_storage_write on storage.objects for insert to authenticated
  with check (
    bucket_id = any (array['site-media', 'hero-slides', 'gallery-photos', 'before-after-photos',
                           'job-photos', 'quotes', 'purchase-receipts', 'worker-documents'])
    and (select private.is_ngms_prompt_user())
  );

create policy staff_storage_update on storage.objects for update to authenticated
  using (
    bucket_id = any (array['site-media', 'hero-slides', 'gallery-photos', 'before-after-photos',
                           'job-photos', 'quotes', 'purchase-receipts', 'worker-documents'])
    and (select private.is_ngms_prompt_user())
  )
  with check (
    bucket_id = any (array['site-media', 'hero-slides', 'gallery-photos', 'before-after-photos',
                           'job-photos', 'quotes', 'purchase-receipts', 'worker-documents'])
    and (select private.is_ngms_prompt_user())
  );

create policy staff_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id = any (array['site-media', 'hero-slides', 'gallery-photos', 'before-after-photos',
                           'job-photos', 'quotes', 'purchase-receipts', 'worker-documents', 'public-leads'])
    and (select private.is_ngms_prompt_user())
  );

-- Only staff can read the private buckets (quote photos, quotes, receipts, worker documents).
create policy staff_private_read on storage.objects for select to authenticated
  using (
    bucket_id = any (array['public-leads', 'quotes', 'purchase-receipts', 'worker-documents'])
    and (select private.is_ngms_prompt_user())
  );

-- Unchanged on purpose (public read for public buckets):
--   "Public read before-after-photos", "Public read gallery-photos",
--   "Public read hero-slides", "public read job-photos", site_media_public_read.

commit;
