-- Sync Auth Users with Public Users Table
-- Run this in your Supabase SQL Editor

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    user_display_name TEXT;
BEGIN
    -- Determine role (Default to mentor for development)
    -- You can restrict this to a domain like: IF NEW.email LIKE '%@domain.com'
    IF NEW.email LIKE '%@theboringpeople.in' OR NEW.email LIKE '%@gmail.com' THEN
        assigned_role := 'mentor';
    ELSE
        assigned_role := 'mentor'; -- Defaulting all to mentor for now
    END IF;

    -- Get display name from metadata or fallback to email prefix
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name', 
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Insert into public.users
    INSERT INTO public.users (id, email, role, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        assigned_role,
        user_display_name
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Retroactively sync existing users who might be missing records
INSERT INTO public.users (id, email, role, display_name)
SELECT 
    id, 
    email, 
    CASE WHEN email LIKE '%@theboringpeople.in' THEN 'mentor' ELSE 'student' END,
    split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Automatically syncs auth.users to public.users and handles domain-based mentor promotion.';
