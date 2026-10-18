-- Dedicated Admin → Media slots for the body corporate landing page.
-- Each slot is isolated to one fixed position on /body-corporate-maintenance.
alter table public.gallery_photos
  drop constraint if exists gallery_photos_slot_check;

alter table public.gallery_photos
  add constraint gallery_photos_slot_check
  check (
    slot is null
    or slot = any (array[
      'hero_solar',
      'solar_service_feature',
      'hero_feature',
      'mission_left',
      'mission_right',
      'maintenance_high_pressure',
      'maintenance_painting',
      'maintenance_paving',
      'body_corporate_hero',
      'body_corporate_project_1',
      'body_corporate_project_2',
      'body_corporate_project_3'
    ]::text[])
  );
