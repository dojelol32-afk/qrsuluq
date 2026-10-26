-- Supabase SQL Schema for Smart QR Code Attendance System
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Teacher', 'Student')) NOT NULL,
    department VARCHAR(100),
    year_level VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    secret_key VARCHAR(128) NOT NULL,
    interval_seconds INT DEFAULT 10,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES qr_sessions(session_id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('On_Time', 'Late', 'Very_Late', 'Absent')) DEFAULT 'On_Time',
    device_ip VARCHAR(45),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_session UNIQUE (session_id, student_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
