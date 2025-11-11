-- ===============================================
-- RESET SEQUENCES
-- Generated: 2025-11-07 00:37:40
-- ===============================================

SELECT setval('programs_id_seq', (SELECT MAX(id) FROM programs));
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- Verification
SELECT COUNT(*) as total_programs FROM programs;
SELECT COUNT(*) as total_courses FROM courses;

SELECT p.program_code, COUNT(c.id) as course_count
FROM programs p
LEFT JOIN courses c ON p.id = c.program_id
GROUP BY p.program_code
ORDER BY p.program_code;