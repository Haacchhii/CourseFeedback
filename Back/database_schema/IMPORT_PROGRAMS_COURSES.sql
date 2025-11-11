-- ===============================================
-- IMPORT PROGRAMS AND COURSES FROM EXCEL
-- Generated: 2025-11-07 00:02:56
-- Source: Courses.xlsx
-- ===============================================

-- ================================================
-- INSERT PROGRAMS
-- ================================================

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (1, 'BSCS-DS', 'Bachelor of Science in Computer Science - Data Science', 'College of Computer Studies', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (2, 'BS-CYBER', 'Bachelor of Science in Cybersecurity', 'College of Computer Studies', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (3, 'BSIT', 'Bachelor of Science in Information Technology', 'College of Computer Studies', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (4, 'BSPSY', 'Bachelor of Science in Psychology', 'College of Arts and Sciences', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (5, 'BAPSY', 'Bachelor of Arts in Psychology', 'College of Arts and Sciences', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (6, 'BMA', 'Bachelor of Multimedia Arts', 'College of Arts and Sciences', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

INSERT INTO programs (id, program_code, program_name, department, is_active)
VALUES (7, 'ABCOMM', 'Bachelor of Arts in Communication', 'College of Arts and Sciences', TRUE)
ON CONFLICT (program_code) DO UPDATE SET
    program_name = EXCLUDED.program_name,
    department = EXCLUDED.department;

-- ================================================
-- INSERT COURSES
-- ================================================

-- Program: BSCS-DS (58 courses)

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


-- Program: BS-CYBER (55 courses)

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


-- Program: BSIT (54 courses)

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


-- Program: BSPSY (49 courses)

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (168, 'GEC-UTS', 'Understanding the Self', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (169, 'GEC-PCOM', 'Purposive Communication', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (170, 'JPL', 'Life and Works of Jose P. Laurel', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (171, 'PSY 1', 'Introduction to Psychology', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (172, 'EDUC 1', 'The Child and Adolescent Learners and Learning Principles', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (173, 'PE 1', 'Physical Fitness and Gymnastic', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (174, 'NSTP 1', 'National Service Training Program 1', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (175, 'BSC 1', 'Being Skills Course 1', 4, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (176, 'GEC-MATH', 'Mathematics in the Modern World', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (177, 'GEC-RPH', 'Readings in Philippine History', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (178, 'PSY 2', 'Psychological Statistics', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (179, 'PSY 3', 'Developmental Psychology', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (180, 'PE 2', 'Rhythmic Activities', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (181, 'NSTP 2', 'National Service Training Program 2', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (182, 'BSC 2', 'Being Skills Course 2', 4, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (183, 'GEC-TCW', 'The Contemporary World', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (184, 'GEC-ART', 'Art Appreciation', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (185, 'PSY 4', 'Sikolohiyang Pilipino', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (186, 'PSY 5', 'Theories of Personality', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (187, 'PSY 6', 'Social Psychology', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (188, 'ANA PHY', 'Anatomy and Physiology', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (189, 'EPC', 'English Proficiency Course', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (190, 'PE 3', 'Individual and Dual Sports', 4, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (191, 'GEC-ETHICS', 'Ethics', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (192, 'GEC-STS', 'Science Technology & Society', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (193, 'PSY 7', 'Physiological Psychology', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (194, 'PSY 8', 'Cognitive Psychology', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (195, 'PSY 9', 'Experimental Psychology', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (196, 'Zoo', 'Zoology', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (197, 'PE 4', 'Team Sports and Recreation', 4, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (198, 'PSY 10', 'Field Methods in Psychology', 4, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (199, 'PSY 11', 'Abnormal Psychology', 4, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (200, 'Chem 1', 'Inorganic and Organic Chemistry', 4, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (201, 'EDUC 7', 'Facilitating Learner Centered Teaching', 4, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (202, 'Rizal', 'Life, Works and Writings of Rizal', 4, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (203, 'VE', 'Values Education', 4, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (204, 'Physics', 'General Physics', 4, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (205, 'PSY 12', 'Psychological Assessment', 4, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (206, 'PSY 13', 'Industrial/Organizational Psychology', 4, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (207, 'PSY 14A', 'Research in Psychology 1', 4, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (208, 'Psy Elec 1', 'Positive Psychology', 4, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (209, 'SPED', 'Special Education', 4, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (210, 'Psy Elec 2', 'Educational Psychology', 4, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (211, 'PSY 14B', 'Research in Psychology 2', 4, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (212, 'Psy Elec 3', 'Introduction to Counseling', 4, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (213, 'FL', 'Foreign Language', 4, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (214, 'PSY 15', 'Special Topic in Psychology 1', 4, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (215, 'PSY 16', 'Special Topic in Psychology 2', 4, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (216, 'PSY 17', 'Practicum in Psychology', 4, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;


-- Program: BAPSY (45 courses)

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (217, 'GEC-UTS', 'Understanding the Self', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (218, 'GEC-PCOM', 'Purposive Communication', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (219, 'JPL', 'Life and Works of Jose P. Laurel', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (220, 'PSY 1', 'Introduction to Psychology', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (221, 'EDUC 1', 'The Child and Adolescent Learners and Learning Principles', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (222, 'BSC 1', 'Being Skills Course', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (223, 'PE 1', 'Physical Fitness and Gymnastic', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (224, 'NSTP 1', 'National Service Training Program 1', 5, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (225, 'GEC-MATH', 'Mathematics in the Modern World', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (226, 'GEC-RPH', 'Readings in Philippine History', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (227, 'PSY 2', 'Psychological Statistics', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (228, 'PSY 3', 'Developmental Psychology', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (229, 'BSC 2', 'Being Skills Course 2', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (230, 'PE 2', 'Rhythmic Activities', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (231, 'NSTP 2', 'National Service Training Program 2', 5, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (232, 'GEC-TCW', 'The Contemporary World', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (233, 'GEC-ART', 'Art Appreciation', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (234, 'EPC', 'English Proficiency Course', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (235, 'PSY 4', 'Sikolohiyang Pilipino', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (236, 'PSY 5', 'Theories of Personality', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (237, 'PSY 6', 'Social Psychology', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (238, 'PE 3', 'Individual and Dual Sports', 5, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (239, 'GEC-ETHICS', 'Ethics', 5, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (240, 'GEC-STS', 'Science Technology & Society', 5, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (241, 'PSY 7', 'Physiological Psychology', 5, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (242, 'PSY 8', 'Cognitive Psychology', 5, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (243, 'PSY 9', 'Experimental Psychology', 5, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (244, 'PE 4', 'Team Sports and Recreation', 5, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (245, 'PSY 10', 'Field Methods in Psychology', 5, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (246, 'PSY 11', 'Abnormal Psychology', 5, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (247, 'EDUC 7', 'Facilitating Learner Centered Teaching', 5, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (248, 'RIZAL', 'Life, Works and Writings of Rizal', 5, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (249, 'VE', 'Values Education', 5, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (250, 'PSY 12', 'Psychological Assessment', 5, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (251, 'PSY 13', 'Industrial/Organizational Psychology', 5, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (252, 'PSY 14A', 'Research in Psychology 1', 5, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (253, 'PSY ELEC 1', 'Positive Psychology', 5, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (254, 'SPED', 'Special Education', 5, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (255, 'PSY ELEC 2', 'Educational Psychology', 5, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (256, 'PSY 14B', 'Research in Psychology 2', 5, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (257, 'PSY ELEC 3', 'Introduction to Counseling', 5, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (258, 'FL', 'Foreign Language', 5, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (259, 'PSY 15', 'Special Topic in Psychology 1', 5, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (260, 'PSY 16', 'Special Topic in Psychology 2', 5, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (261, 'PSY 17', 'Practicum in Psychology', 5, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;


-- Program: BMA (56 courses)

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (262, 'GEC-UTS', 'Understanding the Self', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (263, 'GEC-PCOM', 'Purposive Communication', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (264, 'MMA 1', 'Introduction to Multimedia Arts', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (265, 'MMA 2', 'Drawing 1', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (266, 'MMA 3', 'Color Theory', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (267, 'JPL', 'Life and Works of Jose P. Laurel', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (268, 'BSC 1', 'Being Skills Course 1', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (269, 'NSTP 1', 'National Service Training Program 1', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (270, 'PE 1', 'Physical Fitness and Gymnastic', 6, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (271, 'GEC-RPH', 'Readings in Phil. History', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (272, 'GEC-MATH', 'Mathematics in the Modern World', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (273, 'MMA 4', 'Drawing 2', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (274, 'MMA 5', 'History of Graphic Design', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (275, 'MMA 6', 'Elements and Principles of Design', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (276, 'BSC 2', 'Being Skills Course 2', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (277, 'NSTP 2', 'National Service Training Program 2', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (278, 'PE 2', 'Rhythmic Activities', 6, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (279, 'GEC-TCW', 'The Contemporary World', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (280, 'GEC-ART', 'Art Appreciation', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (281, 'MMA 7', 'Writing for New Media', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (282, 'MMA 8', 'Typography & Layout (Graphics)', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (283, 'MMA 9', '2D Animation 1', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (284, 'MMA 10', 'Digital Photography', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (285, 'EPC', 'English Proficiency Course', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (286, 'PE 3', 'Individual and Dual Sports', 6, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (287, 'GEC-ETHICS', 'Ethics', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (288, 'GEC-STS', 'Science, Technology and Society', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (289, 'HUM-GRB', 'Great Books', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (290, 'MMA 11', 'Advanced Digital Photography', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (291, 'MMA 12', '2D Animation 2', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (292, 'MMA 13', 'Multimedia Publishing', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (293, 'MMA 14', 'Interactive Media Design', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (294, 'PE 4', 'Team Sports and Recreation', 6, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (295, 'Educ 7', 'Facilitating Learner Centered Teaching', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (296, 'Rizal', 'Life and Works of Rizal', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (297, 'Math 1', 'Basic Statistics', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (298, 'MMA 15', 'Fundamentals in Film and Video Production', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (299, 'MMA 16', 'Game Design: Art Production', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (300, 'MMA 17', '3D Modeling', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (301, 'MMA 18', 'Web Design', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (302, 'MMA 19', 'Research Methods', 6, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (303, 'MMA 20', 'Advertising Principles and Practices', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (304, 'MMA 21', 'Post-Production Techniques', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (305, 'MMA 22', '3D Animation', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (306, 'MMA 23', 'Advanced Web Design', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (307, 'MMA 24', 'Digital Sound Production', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (308, 'MMA 25', 'Design Professions, Law, Regulation and Ethics', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (309, 'MMA 26', 'Capstone Project 1', 6, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (310, 'MMA 27', 'Business Ventures in Multimedia', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (311, 'MMA 28', 'Multimedia Seminars', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (312, 'MMA 29', 'Brand Communications', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (313, 'MMA 30', 'Portfolio Preparation and Exhibit Design', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (314, 'MMA 31', 'Capstone Project 2', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (315, 'MMA 32', 'New Media Culture', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (316, 'FL', 'Foreign Language', 6, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (317, 'MMA 33', 'Practicum', 6, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;


-- Program: ABCOMM (50 courses)

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (318, 'GEC-UTS', 'Understanding the Self', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (319, 'GEC-PCOM', 'Purposive Communication', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (320, 'ABCOMM 101', 'Introduction to Communication', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (321, 'ABCOMM 102', 'Introduction to Broadcasting', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (322, 'ABCOMM 103', 'Communication Media Laws and Ethics', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (323, 'JPL', 'Life and Works of Jose P. Laurel', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (324, 'PE 1', 'Physical Fitness and Gymnastics', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (325, 'NSTP 1', 'National Service Training Program 1', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (326, 'BSC 1', 'Being Skills Course 1', 7, 1, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (327, 'GEC-RPH', 'Readings in Philippine History', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (328, 'GEC-MATH', 'Mathematics in the Modern World', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (329, 'ABCOMM 104', 'Oral Communication and Public Speaking', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (330, 'ABCOMM 105', 'Communication Theories', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (331, 'ABCOMM 106', 'Writing for Print Media', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (332, 'PE 2', 'Rhythmic Activities', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (333, 'NSTP 2', 'National Service Training Program 2', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (334, 'BSC 2', 'Being Skills Course 2', 7, 1, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (335, 'GEC-TCW', 'The Contemporary World', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (336, 'GEC-ART', 'Art Appreciation', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (337, 'ABCOMM 201', 'Development Communication', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (338, 'ABCOMM 202', 'Writing for Radio and Television', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (339, 'ABCOMM 203', 'Communication Research 1', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (340, 'ABCOMM 204', 'Photography', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (341, 'EPC', 'English Proficiency Course', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (342, 'PE 3', 'Individual and Dual Sports', 7, 2, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (343, 'GEC-ETHICS', 'Ethics', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (344, 'GEC-STS', 'Science, Technology and Society', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (345, 'ABCOMM 205', 'Organizational Communication', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (346, 'ABCOMM 206', 'Developmental Journalism', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (347, 'ABCOMM 207', 'Communication Research 2', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (348, 'ABCOMM 208', 'Introduction to Film', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (349, 'PE 4', 'Team Sports and Recreation', 7, 2, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (350, 'ABCOMM 301', 'Communication and Culture', 7, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (351, 'ABCOMM 302', 'Radio and TV Production', 7, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (352, 'ABCOMM 303', 'Public Relations and Advertising', 7, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (353, 'ABCOMM 304', 'Online Journalism', 7, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (354, 'ABCOMM 305', 'Communication Research 3', 7, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (355, 'RIZAL', 'Life and Works of Rizal', 7, 3, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (356, 'ABCOMM 306', 'Integrated Marketing Communications', 7, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (357, 'ABCOMM 307', 'Development Broadcasting', 7, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (358, 'ABCOMM 308', 'Corporate Communication', 7, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (359, 'ABCOMM 309', 'Multimedia Communication', 7, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (360, 'ABCOMM 310', 'Communication Research 4', 7, 3, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (361, 'ABCOMM 401', 'Communication Seminar', 7, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (362, 'ABCOMM 402', 'Communication Internship 1', 7, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (363, 'ABCOMM 403', 'Communication Campaigns', 7, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (364, 'ABCOMM 404', 'International Communication', 7, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (365, 'FL', 'Foreign Language', 7, 4, '1st Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (366, 'ABCOMM 405', 'Communication Internship 2', 7, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;

INSERT INTO courses (id, subject_code, subject_name, program_id, year_level, semester, is_active)
VALUES (367, 'ABCOMM 406', 'Communication Thesis', 7, 4, '2nd Semester', TRUE)
ON CONFLICT (subject_code, program_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    year_level = EXCLUDED.year_level,
    semester = EXCLUDED.semester;


-- ================================================
-- RESET SEQUENCES
-- ================================================

SELECT setval('programs_id_seq', (SELECT MAX(id) FROM programs));
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Count programs
SELECT COUNT(*) as program_count, department
FROM programs
GROUP BY department
ORDER BY department;

-- Count courses per program
SELECT p.program_code, COUNT(c.id) as course_count
FROM programs p
LEFT JOIN courses c ON p.id = c.program_id
GROUP BY p.program_code
ORDER BY p.program_code;

-- Show sample courses
SELECT c.subject_code, c.subject_name, p.program_code, c.year_level, c.semester
FROM courses c
JOIN programs p ON c.program_id = p.id
LIMIT 10;