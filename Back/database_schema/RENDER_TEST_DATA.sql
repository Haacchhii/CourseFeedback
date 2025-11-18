-- ============================================================
-- RENDER.COM TEST DATA SETUP
-- Course Feedback System - Testing Data
-- Generated: November 18, 2025
-- ============================================================
-- This file populates the database with test data for all roles
-- Run this AFTER DATABASE_COMPLETE_SETUP.sql
-- ============================================================

-- ============================================================
-- PART 1: PROGRAMS
-- ============================================================

INSERT INTO programs (id, program_code, program_name)
VALUES 
    (1, 'BSCS-DS', 'Bachelor of Science in Computer Science - Data Science'),
    (2, 'BS-CYBER', 'Bachelor of Science in Cybersecurity'),
    (3, 'BSIT', 'Bachelor of Science in Information Technology'),
    (4, 'BSPSY', 'Bachelor of Science in Psychology'),
    (5, 'BAPSY', 'Bachelor of Arts in Psychology'),
    (6, 'BMA', 'Bachelor of Multimedia Arts'),
    (7, 'ABCOMM', 'Bachelor of Arts in Communication')
ON CONFLICT (program_code) DO NOTHING;

-- Reset sequence
SELECT setval('programs_id_seq', (SELECT MAX(id) FROM programs));

-- ============================================================
-- PART 2: USERS (All Roles with bcrypt hashed passwords)
-- ============================================================
-- Password for all test accounts: "test123"
-- Bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u

-- Admin User
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('admin@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'System', 'Administrator', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Secretary Users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('secretary1@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Maria', 'Santos', 'secretary', TRUE),
    ('secretary2@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Ana', 'Cruz', 'secretary', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Department Head Users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('depthead1@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Dr. Robert', 'Johnson', 'department_head', TRUE),
    ('depthead2@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Dr. Lisa', 'Chen', 'department_head', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Instructor Users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('instructor1@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Prof. John', 'Reyes', 'instructor', TRUE),
    ('instructor2@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Prof. Sarah', 'Garcia', 'instructor', TRUE),
    ('instructor3@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Prof. Michael', 'Tan', 'instructor', TRUE),
    ('instructor4@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Prof. Emma', 'Villanueva', 'instructor', TRUE),
    ('instructor5@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Prof. David', 'Ramos', 'instructor', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Student Users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES 
    ('student1@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Juan', 'Dela Cruz', 'student', TRUE),
    ('student2@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Maria', 'Reyes', 'student', TRUE),
    ('student3@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Pedro', 'Santos', 'student', TRUE),
    ('student4@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Ana', 'Garcia', 'student', TRUE),
    ('student5@lpubatangas.edu.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eedgH47UEx0u', 'Carlos', 'Mendoza', 'student', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PART 3: SECRETARY PROFILES
-- ============================================================

INSERT INTO secretaries (user_id, department)
SELECT u.id, 'Academic Affairs'
FROM users u WHERE u.email = 'secretary1@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO secretaries (user_id, department)
SELECT u.id, 'Student Affairs'
FROM users u WHERE u.email = 'secretary2@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- PART 4: DEPARTMENT HEAD PROFILES
-- ============================================================

INSERT INTO department_heads (user_id, department)
SELECT u.id, 'Computer Science'
FROM users u WHERE u.email = 'depthead1@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO department_heads (user_id, department)
SELECT u.id, 'Psychology'
FROM users u WHERE u.email = 'depthead2@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- PART 5: INSTRUCTOR PROFILES
-- ============================================================

INSERT INTO instructors (user_id, name, department, specialization)
SELECT u.id, u.first_name || ' ' || u.last_name, 'Computer Science', 'Data Structures & Algorithms'
FROM users u WHERE u.email = 'instructor1@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO instructors (user_id, name, department, specialization)
SELECT u.id, u.first_name || ' ' || u.last_name, 'Computer Science', 'Web Development'
FROM users u WHERE u.email = 'instructor2@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO instructors (user_id, name, department, specialization)
SELECT u.id, u.first_name || ' ' || u.last_name, 'Information Technology', 'Network Security'
FROM users u WHERE u.email = 'instructor3@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO instructors (user_id, name, department, specialization)
SELECT u.id, u.first_name || ' ' || u.last_name, 'Psychology', 'Clinical Psychology'
FROM users u WHERE u.email = 'instructor4@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO instructors (user_id, name, department, specialization)
SELECT u.id, u.first_name || ' ' || u.last_name, 'Multimedia Arts', 'Digital Design'
FROM users u WHERE u.email = 'instructor5@lpubatangas.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- PART 6: STUDENT PROFILES
-- ============================================================

-- Student 1: BSIT Year 2
INSERT INTO students (user_id, student_id, program_id, year_level)
SELECT u.id, '2021-00001', p.id, 2
FROM users u, programs p
WHERE u.email = 'student1@lpubatangas.edu.ph' AND p.program_code = 'BSIT'
ON CONFLICT (user_id) DO NOTHING;

-- Student 2: BSIT Year 2
INSERT INTO students (user_id, student_id, program_id, year_level)
SELECT u.id, '2021-00002', p.id, 2
FROM users u, programs p
WHERE u.email = 'student2@lpubatangas.edu.ph' AND p.program_code = 'BSIT'
ON CONFLICT (user_id) DO NOTHING;

-- Student 3: BSCS-DS Year 1
INSERT INTO students (user_id, student_id, program_id, year_level)
SELECT u.id, '2022-00003', p.id, 1
FROM users u, programs p
WHERE u.email = 'student3@lpubatangas.edu.ph' AND p.program_code = 'BSCS-DS'
ON CONFLICT (user_id) DO NOTHING;

-- Student 4: BSPSY Year 3
INSERT INTO students (user_id, student_id, program_id, year_level)
SELECT u.id, '2020-00004', p.id, 3
FROM users u, programs p
WHERE u.email = 'student4@lpubatangas.edu.ph' AND p.program_code = 'BSPSY'
ON CONFLICT (user_id) DO NOTHING;

-- Student 5: BMA Year 2
INSERT INTO students (user_id, student_id, program_id, year_level)
SELECT u.id, '2021-00005', p.id, 2
FROM users u, programs p
WHERE u.email = 'student5@lpubatangas.edu.ph' AND p.program_code = 'BMA'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- PART 7: COURSES
-- ============================================================

-- BSIT Courses (Year 2, Semester 1)
INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'IT211', 'Data Structures and Algorithms', 2, 1, 3.0
FROM programs p WHERE p.program_code = 'BSIT'
ON CONFLICT (subject_code, program_id) DO NOTHING;

INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'IT212', 'Web Development 1', 2, 1, 3.0
FROM programs p WHERE p.program_code = 'BSIT'
ON CONFLICT (subject_code, program_id) DO NOTHING;

INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'IT213', 'Database Management Systems', 2, 1, 3.0
FROM programs p WHERE p.program_code = 'BSIT'
ON CONFLICT (subject_code, program_id) DO NOTHING;

-- BSCS-DS Courses (Year 1, Semester 1)
INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'CS111', 'Introduction to Programming', 1, 1, 3.0
FROM programs p WHERE p.program_code = 'BSCS-DS'
ON CONFLICT (subject_code, program_id) DO NOTHING;

INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'CS112', 'Discrete Mathematics', 1, 1, 3.0
FROM programs p WHERE p.program_code = 'BSCS-DS'
ON CONFLICT (subject_code, program_id) DO NOTHING;

-- BSPSY Courses (Year 3, Semester 1)
INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'PSY311', 'Abnormal Psychology', 3, 1, 3.0
FROM programs p WHERE p.program_code = 'BSPSY'
ON CONFLICT (subject_code, program_id) DO NOTHING;

INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'PSY312', 'Psychological Assessment', 3, 1, 3.0
FROM programs p WHERE p.program_code = 'BSPSY'
ON CONFLICT (subject_code, program_id) DO NOTHING;

-- BMA Courses (Year 2, Semester 1)
INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'MMA211', 'Digital Illustration', 2, 1, 3.0
FROM programs p WHERE p.program_code = 'BMA'
ON CONFLICT (subject_code, program_id) DO NOTHING;

INSERT INTO courses (program_id, subject_code, subject_name, year_level, semester, units)
SELECT p.id, 'MMA212', '3D Modeling and Animation', 2, 1, 3.0
FROM programs p WHERE p.program_code = 'BMA'
ON CONFLICT (subject_code, program_id) DO NOTHING;

-- ============================================================
-- PART 8: CLASS SECTIONS
-- ============================================================

-- IT211 - Data Structures (Instructor: Prof. John Reyes)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'IT211-A', '2024-2025', 1, 'MWF 8:00-9:00 AM'
FROM courses c, users u
WHERE c.subject_code = 'IT211' AND u.email = 'instructor1@lpubatangas.edu.ph';

-- IT212 - Web Development (Instructor: Prof. Sarah Garcia)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'IT212-A', '2024-2025', 1, 'TTH 10:00-11:30 AM'
FROM courses c, users u
WHERE c.subject_code = 'IT212' AND u.email = 'instructor2@lpubatangas.edu.ph';

-- IT213 - Database Management (Instructor: Prof. Michael Tan)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'IT213-A', '2024-2025', 1, 'MWF 1:00-2:30 PM'
FROM courses c, users u
WHERE c.subject_code = 'IT213' AND u.email = 'instructor3@lpubatangas.edu.ph';

-- CS111 - Intro to Programming (Instructor: Prof. John Reyes)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'CS111-A', '2024-2025', 1, 'MWF 9:00-10:00 AM'
FROM courses c, users u
WHERE c.subject_code = 'CS111' AND u.email = 'instructor1@lpubatangas.edu.ph';

-- PSY311 - Abnormal Psychology (Instructor: Prof. Emma Villanueva)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'PSY311-A', '2024-2025', 1, 'TTH 1:00-2:30 PM'
FROM courses c, users u
WHERE c.subject_code = 'PSY311' AND u.email = 'instructor4@lpubatangas.edu.ph';

-- PSY312 - Psychological Assessment (Instructor: Prof. Emma Villanueva)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'PSY312-A', '2024-2025', 1, 'TTH 3:00-4:30 PM'
FROM courses c, users u
WHERE c.subject_code = 'PSY312' AND u.email = 'instructor4@lpubatangas.edu.ph';

-- MMA211 - Digital Illustration (Instructor: Prof. David Ramos)
INSERT INTO class_sections (course_id, instructor_id, section_code, academic_year, semester, schedule)
SELECT c.id, u.id, 'MMA211-A', '2024-2025', 1, 'MW 3:00-5:00 PM'
FROM courses c, users u
WHERE c.subject_code = 'MMA211' AND u.email = 'instructor5@lpubatangas.edu.ph';

-- ============================================================
-- PART 9: ENROLLMENTS
-- ============================================================

-- Student 1 (Juan - BSIT) enrolled in IT211, IT212, IT213
INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2021-00001' AND cs.section_code = 'IT211-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2021-00001' AND cs.section_code = 'IT212-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2021-00001' AND cs.section_code = 'IT213-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 2 (Maria - BSIT) enrolled in IT211, IT212
INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2021-00002' AND cs.section_code = 'IT211-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2021-00002' AND cs.section_code = 'IT212-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 3 (Pedro - BSCS-DS) enrolled in CS111
INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2022-00003' AND cs.section_code = 'CS111-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 4 (Ana - BSPSY) enrolled in PSY311, PSY312
INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2020-00004' AND cs.section_code = 'PSY311-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2020-00004' AND cs.section_code = 'PSY312-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 5 (Carlos - BMA) enrolled in MMA211
INSERT INTO enrollments (student_id, class_section_id)
SELECT s.id, cs.id
FROM students s, class_sections cs
WHERE s.student_id = '2021-00005' AND cs.section_code = 'MMA211-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- ============================================================
-- PART 10: SAMPLE EVALUATIONS
-- ============================================================

-- Student 1 evaluates IT211 (Prof. John Reyes) - Positive
INSERT INTO evaluations (student_id, class_section_id, rating_overall, rating_teaching, rating_knowledge, rating_communication, rating_engagement, comments, sentiment)
SELECT s.id, cs.id, 5, 5, 5, 4, 5, 
    'Prof. Reyes is an excellent instructor! His explanations are clear and he makes complex topics easy to understand. Very engaging lectures.',
    'positive'
FROM students s, class_sections cs
WHERE s.student_id = '2021-00001' AND cs.section_code = 'IT211-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 2 evaluates IT212 (Prof. Sarah Garcia) - Positive
INSERT INTO evaluations (student_id, class_section_id, rating_overall, rating_teaching, rating_knowledge, rating_communication, rating_engagement, comments, sentiment)
SELECT s.id, cs.id, 4, 4, 5, 4, 4,
    'Great web development class! Prof. Garcia knows her stuff and the projects are practical and useful.',
    'positive'
FROM students s, class_sections cs
WHERE s.student_id = '2021-00002' AND cs.section_code = 'IT212-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 3 evaluates CS111 (Prof. John Reyes) - Neutral
INSERT INTO evaluations (student_id, class_section_id, rating_overall, rating_teaching, rating_knowledge, rating_communication, rating_engagement, comments, sentiment)
SELECT s.id, cs.id, 3, 3, 4, 3, 3,
    'The course is okay. Sometimes the pace is too fast but overall decent introduction to programming.',
    'neutral'
FROM students s, class_sections cs
WHERE s.student_id = '2022-00003' AND cs.section_code = 'CS111-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- Student 4 evaluates PSY311 (Prof. Emma Villanueva) - Very Positive
INSERT INTO evaluations (student_id, class_section_id, rating_overall, rating_teaching, rating_knowledge, rating_communication, rating_engagement, comments, sentiment)
SELECT s.id, cs.id, 5, 5, 5, 5, 5,
    'Prof. Villanueva is amazing! Her passion for psychology is contagious. The case studies and discussions are incredibly insightful.',
    'positive'
FROM students s, class_sections cs
WHERE s.student_id = '2020-00004' AND cs.section_code = 'PSY311-A'
ON CONFLICT (student_id, class_section_id) DO NOTHING;

-- ============================================================
-- PART 11: EVALUATION PERIOD
-- ============================================================

INSERT INTO evaluation_periods (name, semester, academic_year, start_date, end_date, status, total_students, completed_evaluations)
VALUES 
    ('First Semester Evaluation 2024-2025', 'First Semester', '2024-2025', '2024-09-01 00:00:00', '2025-01-31 23:59:59', 'active', 5, 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 12: SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (category, key, value, data_type, description, is_public)
VALUES 
    ('evaluation', 'allow_anonymous', 'true', 'boolean', 'Allow anonymous evaluations', true),
    ('evaluation', 'min_rating', '1', 'number', 'Minimum rating value', true),
    ('evaluation', 'max_rating', '5', 'number', 'Maximum rating value', true),
    ('email', 'smtp_enabled', 'false', 'boolean', 'Enable email notifications', false),
    ('ml', 'sentiment_enabled', 'true', 'boolean', 'Enable ML sentiment analysis', true),
    ('ml', 'anomaly_detection_enabled', 'true', 'boolean', 'Enable anomaly detection', true)
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

SELECT '=== DATA IMPORT SUMMARY ===' as status;

SELECT 'Programs' as table_name, COUNT(*) as count FROM programs
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Secretaries', COUNT(*) FROM secretaries
UNION ALL
SELECT 'Department Heads', COUNT(*) FROM department_heads
UNION ALL
SELECT 'Instructors', COUNT(*) FROM instructors
UNION ALL
SELECT 'Courses', COUNT(*) FROM courses
UNION ALL
SELECT 'Class Sections', COUNT(*) FROM class_sections
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Evaluations', COUNT(*) FROM evaluations
UNION ALL
SELECT 'Evaluation Periods', COUNT(*) FROM evaluation_periods
UNION ALL
SELECT 'System Settings', COUNT(*) FROM system_settings;

SELECT '=== TEST ACCOUNTS ===' as info;
SELECT 
    '📧 Email: ' || email as credential,
    '🔑 Password: test123' as password,
    '👤 Role: ' || role as user_role,
    first_name || ' ' || last_name as name
FROM users
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'secretary' THEN 2
        WHEN 'department_head' THEN 3
        WHEN 'instructor' THEN 4
        WHEN 'student' THEN 5
    END,
    email;

SELECT '✅ TEST DATA SETUP COMPLETE!' as message;
