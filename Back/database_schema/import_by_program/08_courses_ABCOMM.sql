-- ===============================================
-- INSERT COURSES FOR ABCOMM
-- Program: Bachelor of Arts in Communication
-- Total Courses: 50
-- Generated: 2025-11-07 00:37:40
-- ===============================================

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

-- Verify ABCOMM courses
SELECT c.id, c.subject_code, c.subject_name, p.program_code, c.year_level, c.semester
FROM courses c
JOIN programs p ON c.program_id = p.id
WHERE p.program_code = 'ABCOMM'
ORDER BY c.year_level, c.semester, c.subject_code;