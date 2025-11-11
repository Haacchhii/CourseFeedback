-- ===============================================
-- INSERT COURSES FOR BSIT
-- Program: Bachelor of Science in Information Technology
-- Total Courses: 54
-- Generated: 2025-11-07 00:37:40
-- ===============================================

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (114, 'Comp 1', 'Introduction to Computing', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (115, 'Comp 2', 'Computer Programming 1 (Fundamentals of Programming)', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (116, 'GEC-UTS', 'Understanding the Self', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (117, 'GEC-MATH', 'Mathematics in the Modern World', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (118, 'GEC-TCW', 'The Contemporary World', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (119, 'GEC-ART', 'Art Appreciation', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (120, 'BSC 1', 'Being Skills Course 1', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (121, 'PE 1', 'Physical Fitness & Gymnastic', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (122, 'NSTP 1', 'National Service Training Program 1', 3, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (123, 'Comp 3', 'Computer Programming 2 (Intermediate Programming)', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (124, 'IT 1', 'Computer Organization', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (125, 'IT 3', 'Elective 1', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (126, 'GEC-PCOM', 'Purposive Communication', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (127, 'GEC-STS', 'Science, Technology and Society', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (128, 'EPC', 'English Proficiency', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (129, 'Math 1', 'College Algebra', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (130, 'BSC 2', 'Being Skills Course 2', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (131, 'PE 2', 'Rhythmic Activities', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (132, 'NSTP 2', 'National Service Training Program 2', 3, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (133, 'Comp 4', 'Data Structures and Algorithms', 3, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (134, 'IT 5', 'Operating Systems', 3, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (135, 'Math 2', 'Trigonometry', 3, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (136, 'GEC-ETHICS', 'Ethics (Professional Ethics)', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (137, 'IT 2', 'Accounting Principles', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (138, 'IT 4', 'Elective 2', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (139, 'IT 6', 'Networking 1', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (140, 'IT 7', 'Object-Oriented Programming', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (141, 'IT 8', 'Web Systems and Technologies', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (142, 'IT 9', 'Systems Analysis & Design', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (143, 'Math 3', 'Analytic Geometry', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (144, 'PE 3', 'Individual & Dual Sports', 3, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (145, 'Comp 5', 'Information Management', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (146, 'IT 10', 'Human Computer Interaction (HCI)', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (147, 'IT 11', 'Networking 2', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (148, 'IT 12', 'Elective 3', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (149, 'IT 14', 'Capstone Project 1', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (150, 'GEC-RPH', 'Readings in Philippine History', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (151, 'Math 3C', 'Probability and Statistics', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (152, 'Math 4', 'Differential Calculus', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (153, 'PE 4', 'Team Sports & Recreation', 3, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (154, 'IT 13', 'Elective 4', 3, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (155, 'IT 15', 'Networking 3', 3, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (156, 'Math 5', 'Integral Calculus', 3, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (157, 'Comp 6', 'Applications Development and Emerging Technologies', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (158, 'IT 16', 'Discrete Structures', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (159, 'IT 17', 'Computer Troubleshooting and Repair', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (160, 'IT 20', 'Networking 4', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (161, 'IT 21', 'Capstone Project 2 - Technopreneurship', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (162, 'FL', 'Foreign Language', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (163, 'Rizal', 'The Life and Works of Rizal', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (164, 'Phys 1', 'Calculus-based Physics 1', 3, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (165, 'IT 18', 'OJT / Internship (600 hours)', 3, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (166, 'IT 19', 'Seminars & Field Trip', 3, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (167, 'Phys 2', 'Calculus-based Physics 2', 3, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

-- Verify BSIT courses
SELECT c.id, c.subject_code, c.subject_name, p.program_code, c.year_level, c.semester
FROM courses c
JOIN programs p ON c.program_id = p.id
WHERE p.program_code = 'BSIT'
ORDER BY c.year_level, c.semester, c.subject_code;