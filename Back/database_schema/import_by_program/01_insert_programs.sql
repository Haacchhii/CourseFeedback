-- ===============================================
-- INSERT PROGRAMS
-- Generated: 2025-11-07 00:37:39
-- ===============================================

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

-- Verify programs
SELECT * FROM programs ORDER BY id;