-- ===============================================
-- INSERT COURSES FOR BSCS-DS
-- Program: Bachelor of Science in Computer Science - Data Science
-- Total Courses: 58
-- Generated: 2025-11-07 00:37:39
-- ===============================================

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (1, 'Comp 1', 'Introduction to Computing', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (2, 'Comp 2', 'Computer Programming 1 (Fundamentals of Programming)', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (3, 'CS 1', 'Digital Design', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (4, 'GEC-UTS', 'Understanding the Self', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (5, 'GEC-MATH', 'Mathematics in the Modern World', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (6, 'Math 1', 'College Algebra', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (7, 'BSC 1', 'Being Skills Course 1', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (8, 'PE 1', 'Physical Fitness & Gymnastic', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (9, 'NSTP 1', 'National Service Training Program 1', 1, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (10, 'CS 2', 'Computer Organization and Architecture', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (11, 'CS 3', 'Operating Systems', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (12, 'CS 5', 'Multimedia Technologies', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (13, 'Comp 3', 'Computer Programming 2 (Intermediate Programming)', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (14, 'Math 2', 'Plane and Spherical Trigonometry', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (15, 'Math 3', 'Analytic Geometry', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (16, 'BSC 2', 'Being Skills Course 2', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (17, 'EPC', 'English Proficiency', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (18, 'PE 2', 'Rhythmic Activities', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (19, 'NSTP 2', 'National Service Training Program 2', 1, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (20, 'CS 6', 'Networking 1', 1, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (21, 'CS 11', 'Elective 1', 1, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (22, 'Comp 4', 'Data Structures & Algorithms', 1, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (23, 'PE 3', 'Individual & Dual Sports', 1, 1, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (24, 'CS 4', 'Systems Analysis and Design', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (25, 'CS 8', 'Object-Oriented Programming', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (26, 'CS 9', 'Programming Languages', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (27, 'CS 10', 'Networking 2', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (28, 'CS 16', 'Elective 2', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (29, 'Math 4', 'Differential Calculus', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (30, 'Math 3C', 'Probability and Statistics', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (31, 'FL', 'Foreign Language', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (32, 'GEC-STS', 'Science, Technology & Society', 1, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (33, 'CS 7', 'Project Management', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (34, 'CS 11A', 'Computational Statistics', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (35, 'CS 14', 'Networking 3', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (36, 'CS 15', 'Software Engineering', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (37, 'CS 18', 'Elective 3', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (38, 'CS 18A', 'Artificial Intelligence and Machine Learning', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (39, 'Comp 5', 'Information Management', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (40, 'Math 5', 'Integral Calculus', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (41, 'GEC-TCW', 'The Contemporary World', 1, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (42, 'CS 12', 'Discrete Structures', 1, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (43, 'CS 13', 'CS Thesis Writing 1', 1, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (44, 'Phys 1', 'Calculus-based Physics 1', 1, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (45, 'PE 4', 'Team Sports & Recreation', 1, 2, 'Summer', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (46, 'CS 17', 'Automata Theory and Formal Languages', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (47, 'CS 19', 'Elective 4', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (48, 'CS 21', 'Networking 4', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (49, 'CS 22', 'CS Thesis Writing 2', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (50, 'Comp 6', 'Application Devt. & Emerging Technologies', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (51, 'Phys 2', 'Calculus-based Physics 2', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (52, 'GEC-RPH', 'Readings in Philippine History', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (53, 'GEC-ART', 'Art Appreciation', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (54, 'GEC-PCOM', 'Purposive Communication', 1, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (55, 'CS 20', 'Modeling and Simulation', 1, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (56, 'Rizal', 'The Life and Works of Rizal', 1, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (57, 'GEC-ETHICS', 'Ethics (Professional Ethics)', 1, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (58, 'OJT', 'On-the-Job Training (500 Hours)', 1, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

-- Verify BSCS-DS courses
SELECT c.id, c.subject_code, c.subject_name, p.program_code, c.year_level, c.semester
FROM courses c
JOIN programs p ON c.program_id = p.id
WHERE p.program_code = 'BSCS-DS'
ORDER BY c.year_level, c.semester, c.subject_code;