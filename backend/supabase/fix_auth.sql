-- Fix Mentor Auth
-- Run this in your Supabase SQL Editor

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'nischay@theboringpeople.in',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role":"mentor","display_name":"Nischay B K"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE 
SET encrypted_password = EXCLUDED.encrypted_password;

-- Also make sure the public.users record exists (from seed.sql)
INSERT INTO public.users (id, email, role, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'nischay@theboringpeople.in', 'mentor', 'Nischay B K')
ON CONFLICT (id) DO NOTHING;
