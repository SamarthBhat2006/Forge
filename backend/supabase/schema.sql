-- ForgeTrack Database Schema
-- Run this in the Supabase SQL Editor

-- 1. Students Table
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sessions Table
CREATE TABLE public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ImportLog Table (needs to be created before attendance for FK)
CREATE TABLE public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings TEXT,
    column_mapping TEXT,
    status TEXT NOT NULL
);

-- 4. Attendance Table
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id),
    session_id INTEGER NOT NULL REFERENCES public.sessions(id),
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id),
    UNIQUE(student_id, session_id)
);

-- 5. Materials Table
CREATE TABLE public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Users Table (mapping to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id),
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Constraints & Triggers
-- Prevent attendance for future dates and dates before program start (2025-08-04)
CREATE OR REPLACE FUNCTION check_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
    session_date DATE;
BEGIN
    SELECT date INTO session_date FROM public.sessions WHERE id = NEW.session_id;
    IF session_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot mark attendance for a future date';
    END IF;
    IF session_date < '2025-08-04' THEN
        RAISE EXCEPTION 'Cannot mark attendance for a date before program start (2025-08-04)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_attendance_date
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION check_attendance_date();

-- 8. Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Students RLS
CREATE POLICY "mentors_all_students" ON public.students
FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "students_read_own_profile" ON public.students
FOR SELECT USING (
    id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Sessions RLS
CREATE POLICY "mentors_all_sessions" ON public.sessions
FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "students_read_all_sessions" ON public.sessions
FOR SELECT USING (true); -- Students can see all sessions

-- Attendance RLS
CREATE POLICY "mentors_all_attendance" ON public.attendance
FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "students_read_own_attendance" ON public.attendance
FOR SELECT USING (
    student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Materials RLS
CREATE POLICY "mentors_all_materials" ON public.materials
FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "students_read_all_materials" ON public.materials
FOR SELECT USING (true); -- Students can see all materials

-- ImportLog RLS
CREATE POLICY "mentors_all_import_log" ON public.import_log
FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);
-- Students have NO access to import_log

-- Users RLS
CREATE POLICY "users_read_all" ON public.users
FOR SELECT USING (true);
