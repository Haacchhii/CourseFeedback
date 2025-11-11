-- ===============================================
-- INSERT COURSES FOR BS-CYBER
-- Program: Bachelor of Science in Cybersecurity
-- Total Courses: 55
-- Generated: 2025-11-07 00:37:39
-- ===============================================

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (59, 'CYBER 1', 'Introduction to Computers and Networking', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (60, 'CYBER 2', 'Introduction to Cybersecurity', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (61, 'CYBER 3', 'Programming Fundamentals', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (62, 'CyberElec1', 'Cybersecurity Elective 1', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (63, 'GEC-UTS', 'Understanding the Self', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (64, 'GEC-MATH', 'Mathematics in the Modern World', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (65, 'GEC-PCOM', 'Purposive Communication', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (66, 'BSC 1', 'Being Skills Course 1', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (67, 'PE1/PATHFit1', 'Physical Activities Towards Health and Fitness 1: Movement Competency Training', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (68, 'NSTP 1', 'National Service Training Program 1', 2, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (69, 'CYBER 4', 'Computer Organization', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (70, 'CYBER 5', 'Network Security', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (71, 'CYBER 6', 'Cybersecurity and Digital Forensics', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (72, 'CyberElec2', 'Cybersecurity Elective 2', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (73, 'GEC-ART', 'Art Appreciation', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (74, 'GEC-STS', 'Science, Technology and Society', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (75, 'Math 1', 'College Algebra', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (76, 'BSC 2', 'Being Skills Course 2', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (77, 'PE2/PATHFit2', 'Physical Activities Towards Health and Fitness 2: Exercise-Based Fitness Activities', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (78, 'NSTP 2', 'National Service Training Program 2', 2, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (79, 'GEC-ETHICS', 'Ethics (Professional Ethics)', 2, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (80, 'CYBER 7', 'Discrete Structures', 2, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (81, 'Math 2', 'Trigonometry', 2, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (82, 'CYBER 8', 'CCNA 1 - Networking 1', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (83, 'CYBER 9', 'Operating Systems', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (84, 'CYBER 10', 'Machine Learning and Artificial Intelligence for Cybersecurity', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (85, 'CYBER 11', 'Security-Oriented Systems Analysis and Design', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (86, 'CYBER 12', 'IT Governance and Security Planning', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (87, 'CYBER 13', 'Cryptography and Cryptanalysis', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (88, 'CYBER 14', 'Ethical Hacking and Defense Strategy', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (89, 'IT 2', 'Accounting Principles', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (90, 'Math 3', 'Analytic Geometry', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (91, 'PE3/PATHFit3', 'Physical Activities Towards Health and Fitness 3: Philippine Traditional Dances', 2, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (92, 'CYBER 15', 'CCNA 2 - Networking 2', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (93, 'CYBER 16', 'Server Administration and Security', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (94, 'CYBER 17', 'Capstone Project 1', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (95, 'CYBER 18', 'Information Security', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (96, 'GEC-TCW', 'The Contemporary World', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (97, 'EPC', 'English Proficiency', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (98, 'Math 3C', 'Probability and Statistics', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (99, 'Math 4', 'Differential Calculus', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (100, 'PE4/PATHFit4', 'Physical Activities Towards Health and Fitness 4: Martial Arts - Taekwondo', 2, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (101, 'CYBER 19', 'CCNA 3 - Networking 3', 2, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (102, 'CyberElec3', 'Cybersecurity Elective 3', 2, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (103, 'Math 5', 'Integral Calculus', 2, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (104, 'CYBER 20', 'Legal Aspects and Issues of Cybersecurity', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (105, 'CYBER 21', 'Cyber Incident Analysis and Response', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (106, 'CYBER 22', 'Capstone Project 2', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (107, 'CYBER 23', 'Seminars and Field Trip', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (108, 'CyberElec4', 'Cybersecurity Elective 4', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (109, 'FL', 'Foreign Language', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (110, 'Rizal', 'The Life and Works of Rizal', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (111, 'GEC-RPH', 'Readings in Philippine History', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (112, 'Phys 1', 'Calculus-based Physics 1', 2, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (113, 'CYBER 24', 'OJT/Practicum for Cybersecurity (600 hours)', 2, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

-- Verify BS-CYBER courses
SELECT c.id, c.subject_code, c.subject_name, p.program_code, c.year_level, c.semester
FROM courses c
JOIN programs p ON c.program_id = p.id
WHERE p.program_code = 'BS-CYBER'
ORDER BY c.year_level, c.semester, c.subject_code;