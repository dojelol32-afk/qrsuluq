-- Supabase SQL Schema for Smart QR Code Attendance System (v2)
--
-- If you already created the OLD tables, run this first (THIS DELETES ALL EXISTING DATA):
--   DROP TABLE IF EXISTS attendance_records, qr_sessions, courses, users CASCADE;

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_number VARCHAR(30) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email = lower(email)),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Teacher', 'Student')) NOT NULL,
    department VARCHAR(100),
    year_level VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT student_needs_number CHECK (role <> 'Student' OR student_number IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(course_id) ON DELETE SET NULL,
    teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL DEFAULT 'محاضرة',
    secret_key VARCHAR(128) NOT NULL,
    interval_seconds INT NOT NULL DEFAULT 10 CHECK (interval_seconds BETWEEN 5 AND 60),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES qr_sessions(session_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('On_Time', 'Late', 'Very_Late', 'Absent')) DEFAULT 'On_Time',
    device_ip VARCHAR(45),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_session UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON qr_sessions(teacher_id);

-- Row Level Security: enabled with NO policies, so the public (anon/authenticated) API keys
-- can read nothing. Only the backend, using the service_role key, can access the data.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON users, courses, qr_sessions, attendance_records FROM anon, authenticated;
