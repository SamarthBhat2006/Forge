-- Clear ForgeTrack Operational Data
-- Run this in the Supabase SQL Editor to remove all test data.
-- This script respects foreign key constraints by truncating in the correct order.

-- 1. Disable triggers temporarily if needed (optional, but safer)
-- SET session_replication_role = 'replica';

-- 2. Truncate tables
-- We use CASCADE to ensure child records are removed, or we list them in order.
TRUNCATE TABLE public.attendance CASCADE;
TRUNCATE TABLE public.materials CASCADE;
TRUNCATE TABLE public.sessions CASCADE;
TRUNCATE TABLE public.import_log CASCADE;
TRUNCATE TABLE public.students CASCADE;

-- 3. Reset sequences for SERIAL columns
ALTER SEQUENCE public.attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE public.materials_id_seq RESTART WITH 1;
ALTER SEQUENCE public.sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE public.import_log_id_seq RESTART WITH 1;
ALTER SEQUENCE public.students_id_seq RESTART WITH 1;

-- 4. Re-enable triggers
-- SET session_replication_role = 'origin';

-- 4. Re-enable triggers
-- SET session_replication_role = 'origin';

-- NOTE: Other records in public.users and auth.users are NOT touched to preserve your personal login data.
