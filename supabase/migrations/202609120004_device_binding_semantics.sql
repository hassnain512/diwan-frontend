-- A reader may bind to only one device, enforced by the single device_id column
-- and claim_reader_device row lock. Multiple reader accounts may legitimately
-- be used on one family device, so device_id must not be globally unique.
drop index if exists public.readers_device_id_unique;
