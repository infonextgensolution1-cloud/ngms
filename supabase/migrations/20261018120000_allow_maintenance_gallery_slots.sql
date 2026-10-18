alter table public.gallery_photos
  drop constraint if exists gallery_photos_slot_check;

alter table public.gallery_photos
  add constraint gallery_photos_slot_check
  check (
    slot is null
    or slot = any (array[
      'hero_solar',
      'hero_feature',
      'mission_left',
      'mission_right',
      'maintenance_high_pressure',
      'maintenance_painting',
      'maintenance_paving',
      'body_corporate_hero',
      'body_corporate_cleaning',
      'body_corporate_painting',
      'body_corporate_paving'
    ]::text[])
  );
