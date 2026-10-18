-- Add the dedicated photo slot for the right-hand feature block on
-- /services/solar-panel-cleaning. Keep prior deployed migrations immutable.
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
      'maintenance_paving'
    ]::text[])
  );
