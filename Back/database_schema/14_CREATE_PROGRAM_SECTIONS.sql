-- Migration 14: Create program_sections and section_students tables
-- Purpose: Allow admins to create block sections and assign students

-- Create program_sections table
CREATE TABLE IF NOT EXISTS program_sections (
    id SERIAL PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 3),
    school_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section_name, program_id, year_level, semester, school_year)
);

-- Create section_students junction table
CREATE TABLE IF NOT EXISTS section_students (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES program_sections(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_program_sections_program_id ON program_sections(program_id);
CREATE INDEX IF NOT EXISTS idx_program_sections_year_level ON program_sections(year_level);
CREATE INDEX IF NOT EXISTS idx_program_sections_is_active ON program_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_section_students_section_id ON section_students(section_id);
CREATE INDEX IF NOT EXISTS idx_section_students_student_id ON section_students(student_id);

-- Add comments for documentation
COMMENT ON TABLE program_sections IS 'Stores program sections (block sections) for organizing students';
COMMENT ON TABLE section_students IS 'Junction table linking students to program sections';
COMMENT ON COLUMN program_sections.section_name IS 'Name of the section (e.g., BSIT 3A, BSCS 2B)';
COMMENT ON COLUMN program_sections.year_level IS 'Year level: 1 = First Year, 2 = Second Year, 3 = Third Year, 4 = Fourth Year';
COMMENT ON COLUMN program_sections.semester IS 'Semester: 1 = First Semester, 2 = Second Semester, 3 = Summer';
COMMENT ON COLUMN program_sections.school_year IS 'Academic year (e.g., 2024-2025)';
