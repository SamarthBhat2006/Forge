-- Auto-create user trigger (Run this in the Supabase SQL Editor)
-- Creates a user in auth.users and public.users when a student is added.

CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    default_password TEXT;
    student_email TEXT;
BEGIN
    -- The email will be usn@forge.local if not provided
    student_email := COALESCE(NEW.email, LOWER(NEW.usn) || '@forge.local');
    default_password := NEW.usn;

    -- Create user in auth.users (Note: in a real Supabase environment this requires
    -- bypassing the API via supabase_admin, but for demo purposes we assume 
    -- we can insert directly or use a secure rpc if needed. For now, this is a 
    -- conceptual trigger that might need adjustment based on Supabase hosted environment)
    
    -- In standard Supabase, creating an auth user from a trigger requires using 
    -- supabase_admin schema or calling the gotrue API. 
    -- To keep it simple for the demo and since auth.users insertion can be tricky via SQL,
    -- it is often better to create the user via the Supabase Auth JS API first, 
    -- which then triggers an insertion into public.users.
    
    -- However, the spec says: "When a student is added to the Students table, a corresponding user account is auto-created"
    
    -- Since direct insert to auth.users from public schema is restricted by default,
    -- we will insert into public.users, assuming the auth.user is created via Edge Function or client first.
    -- If we have superuser access in the SQL editor, we can do this:
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        student_email,
        crypt(default_password, gen_salt('bf')),
        NOW(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        json_build_object('role', 'student', 'student_id', NEW.id, 'display_name', NEW.name),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- Insert into public.users
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (new_user_id, student_email, 'student', NEW.id, NEW.name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
AFTER INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();
