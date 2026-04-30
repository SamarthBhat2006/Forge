-- Seed Data for ForgeTrack

-- 1. Insert Mentor
-- In standard Supabase, creating an auth user from a script usually uses gotrue API.
-- For demo purposes, we will assume these users are created in public.users directly 
-- with dummy UUIDs, or that we skip auth.users insertion for the seed if it fails in hosted supabase.
-- We will insert dummy records into public.users.
INSERT INTO public.users (id, email, role, student_id, display_name)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'nischay@theboringpeople.in', 'mentor', NULL, 'Nischay B K'),
    ('00000000-0000-0000-0000-000000000002', 'varun@theboringpeople.in', 'mentor', NULL, 'Varun')
ON CONFLICT DO NOTHING;

-- 2. Insert Students
INSERT INTO public.students (name, usn, admission_number, email, branch_code) VALUES
('Abhishek Sharma', '4SH24CS001', '24CS001', 'abhishek@forge.local', 'CS'),
('Divya Kulkarni', '4SH24CS002', '24CS002', 'divya@forge.local', 'AI'),
('Ravi Kumar', '4SH24CS003', '24CS003', 'ravi@forge.local', 'CS'),
('Sneha Patil', '4SH24CS004', '24CS004', 'sneha@forge.local', 'IS'),
('Arjun Reddy', '4SH24CS005', '24CS005', 'arjun@forge.local', 'AI'),
('Kavya Rao', '4SH24CS006', '24CS006', 'kavya@forge.local', 'CS'),
('Mohammed Ali', '4SH24CS007', '24CS007', 'ali@forge.local', 'IS'),
('Pooja Hegde', '4SH24CS008', '24CS008', 'pooja@forge.local', 'CS'),
('Karthik N', '4SH24CS009', '24CS009', 'karthik@forge.local', 'AI'),
('Anjali Desai', '4SH24CS010', '24CS010', 'anjali@forge.local', 'CS'),
('Rahul K', '4SH24CS011', '24CS011', 'rahul@forge.local', 'IS'),
('Neha Singh', '4SH24CS012', '24CS012', 'neha@forge.local', 'CS'),
('Sanjay M', '4SH24CS013', '24CS013', 'sanjay@forge.local', 'AI'),
('Priya B', '4SH24CS014', '24CS014', 'priya@forge.local', 'CS'),
('Akash V', '4SH24CS015', '24CS015', 'akash@forge.local', 'IS'),
('Meghana T', '4SH24CS016', '24CS016', 'meghana@forge.local', 'CS'),
('Vikram S', '4SH24CS017', '24CS017', 'vikram@forge.local', 'AI'),
('Aishwarya R', '4SH24CS018', '24CS018', 'aishwarya@forge.local', 'CS'),
('Nitin P', '4SH24CS019', '24CS019', 'nitin@forge.local', 'IS'),
('Swathi K', '4SH24CS020', '24CS020', 'swathi@forge.local', 'CS'),
('Darshan G', '4SH24CS021', '24CS021', 'darshan@forge.local', 'AI'),
('Shruthi C', '4SH24CS022', '24CS022', 'shruthi@forge.local', 'CS'),
('Kiran D', '4SH24CS023', '24CS023', 'kiran@forge.local', 'IS'),
('Bhavya L', '4SH24CS024', '24CS024', 'bhavya@forge.local', 'CS'),
('Chetan H', '4SH24CS025', '24CS025', 'chetan@forge.local', 'AI');

-- 3. Insert Sessions
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type) VALUES
('2026-04-01', '8-Layer AI Application Stack', 4, 2.0, 'offline'),
('2026-04-03', 'LLM Fundamentals', 4, 2.0, 'offline'),
('2026-04-08', 'Prompt Engineering Mastery', 4, 2.0, 'online'),
('2026-04-10', 'Function Calling & Tool Use', 4, 2.0, 'offline'),
('2026-04-15', 'ReAct Agent Pattern', 4, 2.5, 'offline'),
('2026-05-01', 'Embeddings and Vector DBs', 5, 2.0, 'offline'),
('2026-05-05', 'pgvector RAG', 5, 2.5, 'offline'),
('2026-05-12', 'Advanced RAG Techniques', 5, 2.0, 'online'),
('2026-05-18', 'Evaluating AI Responses', 5, 2.0, 'offline'),
('2026-05-25', 'Fine-tuning Basics', 5, 2.0, 'offline'),
('2026-06-02', 'Tiered Autonomy Multi-Agent', 6, 3.0, 'offline'),
('2026-06-09', 'AI UI/UX Patterns', 6, 2.0, 'offline'),
('2026-06-16', 'Streaming Responses', 6, 2.0, 'online'),
('2026-06-23', 'Production Deployment Strategies', 6, 2.0, 'offline'),
('2026-06-30', 'Final Project Presentations', 6, 3.0, 'offline');

-- 4. Insert Attendance (Sample for some sessions)
DO $$
DECLARE
    student record;
    session record;
    is_present boolean;
BEGIN
    FOR session IN SELECT * FROM public.sessions LOOP
        FOR student IN SELECT * FROM public.students LOOP
            -- Generate a deterministic but random-looking attendance (e.g. 80% present)
            is_present := ((student.id + session.id) % 10) > 1; 
            
            -- Only insert attendance if session is not in the future
            IF session.date <= CURRENT_DATE THEN
                INSERT INTO public.attendance (student_id, session_id, present, marked_by)
                VALUES (student.id, session.id, is_present, 'Nischay B K');
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- 5. Insert Materials
INSERT INTO public.materials (session_id, title, type, url, description)
SELECT id, 'Slides: ' || topic, 'slides', 'https://docs.google.com/presentation/d/dummy', 'Presentation slides'
FROM public.sessions;

INSERT INTO public.materials (session_id, title, type, url, description)
SELECT id, 'Recording: ' || topic, 'recording', 'https://youtube.com/watch?v=dummy', 'Session recording'
FROM public.sessions
WHERE session_type = 'online' OR month_number = 6;

-- 6. Insert ImportLog 
INSERT INTO public.import_log (filename, uploaded_by, total_rows, imported_rows, skipped_rows, warnings, column_mapping, status) VALUES
('month3_attendance.csv', 'Nischay B K', 150, 145, 5, '[{"row": 12, "msg": "Student Not Found"}]', '{"name": "student_name", "date": "date"}', 'completed'),
('month2_attendance.csv', 'Varun', 120, 120, 0, '[]', '{"name": "student_name", "date": "date"}', 'completed');
