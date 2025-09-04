-- Course Evaluation Database Schema
-- Run this script in pgAdmin 4 Query Tool

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'department_head', 'admin')),
    firebase_uid VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- BSIT, BSCS, etc.
    name VARCHAR(255) NOT NULL,
    duration_years INTEGER NOT NULL
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL, -- BSIT101, CSDS205, etc.
    course_name VARCHAR(255) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    year_level INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    units INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class sections table
CREATE TABLE IF NOT EXISTS class_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    class_code VARCHAR(50) UNIQUE NOT NULL, -- ITCO-1001-A
    instructor_name VARCHAR(255),
    schedule VARCHAR(255),
    room VARCHAR(100),
    max_students INTEGER DEFAULT 40,
    semester VARCHAR(20) NOT NULL, -- "First Semester 2025"
    academic_year VARCHAR(20) NOT NULL, -- "2024-2025"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_section_id INTEGER REFERENCES class_sections(id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    UNIQUE(student_id, class_section_id)
);

-- Course evaluations
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_section_id INTEGER REFERENCES class_sections(id),
    rating_teaching INTEGER CHECK (rating_teaching BETWEEN 1 AND 5),
    rating_content INTEGER CHECK (rating_content BETWEEN 1 AND 5),
    rating_engagement INTEGER CHECK (rating_engagement BETWEEN 1 AND 5),
    rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
    comments TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_section_id)
);

-- Department heads
CREATE TABLE IF NOT EXISTS department_heads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(255),
    programs INTEGER[], -- Array of program IDs they oversee
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default programs
INSERT INTO programs (code, name, duration_years) VALUES 
('BSIT', 'Bachelor of Science in Information Technology', 4),
('BSCS-DS', 'Bachelor of Science in Computer Science - Data Science', 3),
('BSCS', 'Bachelor of Science in Computer Science', 3),
('BSCY', 'Bachelor of Science in Cybersecurity', 3),
('BMA', 'Bachelor of Multimedia Arts', 4)
ON CONFLICT (code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_program_year ON students(program_id, year_level);
CREATE INDEX IF NOT EXISTS idx_courses_program_year ON courses(program_id, year_level);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_class ON evaluations(class_section_id);
