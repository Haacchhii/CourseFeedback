-- ============================================
-- HELPER SCRIPT: Check Enrollment Data
-- ============================================
-- This script helps diagnose enrollment issues
-- Run these queries to check what data is missing

-- 1. Check Program Sections
SELECT 
    ps.id,
    ps.section_name,
    p.program_code,
    ps.year_level,
    ps.semester,
    ps.school_year,
    COUNT(DISTINCT ss.student_id) as student_count,
    ps.is_active
FROM program_sections ps
JOIN programs p ON ps.program_id = p.id
LEFT JOIN section_students ss ON ps.id = ss.section_id
GROUP BY ps.id, ps.section_name, p.program_code, ps.year_level, ps.semester, ps.school_year, ps.is_active
ORDER BY p.program_code, ps.year_level, ps.section_name;

-- 2. Check which students are NOT assigned to any program section
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    s.program_id,
    p.program_code,
    s.year_level,
    u.is_active
FROM users u
JOIN students s ON u.id = s.user_id
LEFT JOIN programs p ON s.program_id = p.id
LEFT JOIN section_students ss ON u.id = ss.student_id
WHERE u.role = 'student'
AND ss.id IS NULL
AND u.is_active = true
ORDER BY p.program_code, s.year_level, u.last_name;

-- 3. Check course enrollments for students
SELECT 
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as student_name,
    COUNT(DISTINCT e.class_section_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_enrollments
FROM users u
LEFT JOIN enrollments e ON u.id = e.student_id
WHERE u.role = 'student'
AND u.is_active = true
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING COUNT(e.id) = 0  -- Show students with no enrollments
ORDER BY u.last_name;

-- 4. Check if students have section assignments but no course enrollments
SELECT 
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as student_name,
    ps.section_name,
    p.program_code,
    ps.year_level,
    COUNT(DISTINCT e.id) as course_enrollments
FROM section_students ss
JOIN users u ON ss.student_id = u.id
JOIN program_sections ps ON ss.section_id = ps.id
JOIN programs p ON ps.program_id = p.id
LEFT JOIN enrollments e ON u.id = e.student_id AND e.status = 'active'
WHERE u.role = 'student'
AND u.is_active = true
GROUP BY u.id, u.email, u.first_name, u.last_name, ps.section_name, p.program_code, ps.year_level
HAVING COUNT(e.id) = 0
ORDER BY p.program_code, ps.year_level, u.last_name;

-- ============================================
-- HELPER: Auto-assign students to program sections
-- ============================================
-- Run this if students exist but are not assigned to sections
-- This creates one section per program/year level and assigns students

-- First, create missing program sections (one per program/year)
INSERT INTO program_sections (program_id, section_name, year_level, semester, school_year, is_active, created_at)
SELECT DISTINCT
    s.program_id,
    p.program_code || ' ' || s.year_level || '-A' as section_name,
    s.year_level,
    1,  -- Use integer for semester
    '2024-2025',
    true,
    NOW()
FROM students s
JOIN programs p ON s.program_id = p.id
JOIN users u ON s.user_id = u.id
WHERE u.is_active = true
AND u.role = 'student'
AND NOT EXISTS (
    SELECT 1 FROM program_sections ps
    WHERE ps.program_id = s.program_id
    AND ps.year_level = s.year_level
    AND ps.section_name = p.program_code || ' ' || s.year_level || '-A'
)
ON CONFLICT DO NOTHING;

-- Then, assign students to their corresponding sections
INSERT INTO section_students (section_id, student_id, created_at)
SELECT DISTINCT
    ps.id,
    u.id,
    NOW()
FROM users u
JOIN students s ON u.id = s.user_id
JOIN programs p ON s.program_id = p.id
JOIN program_sections ps ON ps.program_id = s.program_id 
    AND ps.year_level = s.year_level
    AND ps.section_name = p.program_code || ' ' || s.year_level || '-A'
WHERE u.role = 'student'
AND u.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM section_students ss
    WHERE ss.section_id = ps.id
    AND ss.student_id = u.id
)
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER: Create sample course enrollments
-- ============================================
-- Only run this if you need to create test data
-- This assumes you have class_sections already created

/*
-- Example: Enroll all active students in all available class sections for their program
INSERT INTO enrollments (student_id, class_section_id, status, enrolled_at)
SELECT DISTINCT
    u.id as student_id,
    cs.id as class_section_id,
    'active' as status,
    NOW() as enrolled_at
FROM users u
JOIN students s ON u.id = s.user_id
CROSS JOIN class_sections cs
JOIN courses c ON cs.course_id = c.id
WHERE u.role = 'student'
AND u.is_active = true
AND c.program_id = s.program_id  -- Match program
AND NOT EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.student_id = u.id
    AND e.class_section_id = cs.id
)
LIMIT 1000;  -- Safety limit
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check final counts
SELECT 
    'Total Active Students' as metric,
    COUNT(*) as count
FROM users
WHERE role = 'student' AND is_active = true

UNION ALL

SELECT 
    'Students in Sections',
    COUNT(DISTINCT student_id)
FROM section_students ss
JOIN users u ON ss.student_id = u.id
WHERE u.is_active = true

UNION ALL

SELECT 
    'Students with Course Enrollments',
    COUNT(DISTINCT student_id)
FROM enrollments e
JOIN users u ON e.student_id = u.id
WHERE e.status = 'active' AND u.is_active = true

UNION ALL

SELECT 
    'Total Active Course Enrollments',
    COUNT(*)
FROM enrollments
WHERE status = 'active';
