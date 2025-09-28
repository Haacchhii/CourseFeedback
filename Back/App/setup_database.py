# Database Schema Creation Script
# Run this to create all necessary tables for the course feedback system

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import get_raw_connection

def create_schema():
    """Create complete database schema for course feedback system"""
    
    schema_sql = """
    -- Create database schema for Course Feedback System
    
    -- Programs table
    CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Users table (for authentication)
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('secretary', 'department_head', 'student')),
        firebase_uid VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Secretaries table
    CREATE TABLE IF NOT EXISTS secretaries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(50) NOT NULL,
        assigned_programs TEXT[], -- Array of program codes
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Department heads table
    CREATE TABLE IF NOT EXISTS department_heads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        department VARCHAR(50) NOT NULL,
        programs INTEGER[] DEFAULT '{}', -- Array of program IDs
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Students table
    CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        program_id INTEGER REFERENCES programs(id),
        year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Courses table
    CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(20) NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        class_code VARCHAR(30) UNIQUE NOT NULL,
        instructor VARCHAR(100) NOT NULL,
        semester VARCHAR(30) NOT NULL,
        program_id INTEGER REFERENCES programs(id),
        year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 4),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Evaluations table
    CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        course_id INTEGER REFERENCES courses(id),
        ratings JSONB NOT NULL, -- Store ratings as JSON
        comment TEXT,
        sentiment VARCHAR(20),
        anomaly BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Evaluation questions table
    CREATE TABLE IF NOT EXISTS evaluation_questions (
        id SERIAL PRIMARY KEY,
        question_set_name VARCHAR(100) NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('likert', 'text', 'multiple_choice')),
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_courses_program ON courses(program_id);
    CREATE INDEX IF NOT EXISTS idx_courses_year_level ON courses(year_level);
    CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_course ON evaluations(course_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_sentiment ON evaluations(sentiment);
    """
    
    try:
        conn = get_raw_connection()
        if not conn:
            print("❌ Failed to connect to database")
            return False
            
        cursor = conn.cursor()
        
        print("🏗️ Creating database schema...")
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Database schema created successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating schema: {e}")
        return False

def insert_sample_data():
    """Insert sample data for testing"""
    
    sample_data_sql = """
    -- Insert sample programs
    INSERT INTO programs (code, name, department) VALUES 
        ('BSIT', 'Bachelor of Science in Information Technology', 'Computer Science'),
        ('BSCS', 'Bachelor of Science in Computer Science', 'Computer Science'),
        ('BSCS-DS', 'Bachelor of Science in Computer Science - Data Science', 'Computer Science'),
        ('BS-CY', 'Bachelor of Science in Cybersecurity', 'Computer Science'),
        ('BMA', 'Bachelor of Multimedia Arts', 'Arts and Sciences')
    ON CONFLICT (code) DO NOTHING;
    
    -- Insert sample secretary user
    INSERT INTO users (email, password_hash, role) VALUES 
        ('secretary@lpubatangas.edu.ph', '$2b$12$sample_hash_for_secretary123', 'secretary')
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert secretary details
    INSERT INTO secretaries (user_id, name, department, assigned_programs)
    SELECT u.id, 'Ms. Patricia Cruz', 'Academic Affairs', ARRAY['BSIT', 'BSCS', 'BSCS-DS', 'BS-CY', 'BMA']
    FROM users u WHERE u.email = 'secretary@lpubatangas.edu.ph'
    ON CONFLICT DO NOTHING;
    
    -- Insert sample department head
    INSERT INTO users (email, password_hash, role) VALUES 
        ('melodydimaano@lpubatangas.edu.ph', '$2b$12$sample_hash_for_changeme', 'department_head')
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert department head details
    INSERT INTO department_heads (user_id, first_name, last_name, department, programs)
    SELECT u.id, 'Melody', 'Dimaano', 'Computer Science', ARRAY[1, 2, 3, 4]::INTEGER[]
    FROM users u WHERE u.email = 'melodydimaano@lpubatangas.edu.ph'
    ON CONFLICT DO NOTHING;
    
    -- Insert sample student
    INSERT INTO users (email, password_hash, role) VALUES 
        ('maria.santos.bsit1@lpubatangas.edu.ph', '$2b$12$sample_hash_for_changeme', 'student')
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert student details
    INSERT INTO students (user_id, student_id, first_name, last_name, program_id, year_level)
    SELECT u.id, '202101234', 'Maria', 'Santos', 1, 1
    FROM users u WHERE u.email = 'maria.santos.bsit1@lpubatangas.edu.ph'
    ON CONFLICT (student_id) DO NOTHING;
    
    -- Insert sample course
    INSERT INTO courses (course_code, course_name, class_code, instructor, semester, program_id, year_level)
    VALUES ('BSIT101', 'Introduction to Computing', 'ITCO-1001-A', 'Dr. Maria Santos', 'First Semester 2025', 1, 1)
    ON CONFLICT (class_code) DO NOTHING;
    """
    
    try:
        conn = get_raw_connection()
        if not conn:
            print("❌ Failed to connect to database")
            return False
            
        cursor = conn.cursor()
        
        print("📊 Inserting sample data...")
        cursor.execute(sample_data_sql)
        conn.commit()
        
        print("✅ Sample data inserted successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up Course Feedback Database...")
    
    if create_schema():
        if insert_sample_data():
            print("✅ Database setup complete!")
        else:
            print("⚠️ Schema created but sample data insertion failed")
    else:
        print("❌ Database setup failed")