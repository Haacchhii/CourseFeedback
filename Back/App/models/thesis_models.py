# Updated Database Models for Thesis Project
# Enhanced Sentiment Analysis and Anomaly Detection using SVM and DBSCAN
# Matching the new simplified schema

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Program(Base):
    """Academic Programs (BSCS-DS, BS-CYBER, BSIT, BSPSY, BAPSY, BMA, ABCOMM)"""
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    program_code = Column(String(50), unique=True, nullable=False)
    program_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    courses = relationship("Course", back_populates="program")
    students = relationship("Student", back_populates="program")

class Course(Base):
    """Courses with program, year level, and semester"""
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50), nullable=False)
    subject_name = Column(String(255), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    year_level = Column(Integer, nullable=True)  # 1-4
    semester = Column(String(20), nullable=True)  # 1st Semester, 2nd Semester, Summer, Midyear
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    program = relationship("Program", back_populates="courses")
    class_sections = relationship("ClassSection", back_populates="course")
    
    # Indexes
    __table_args__ = (
        Index('idx_courses_program', 'program_id'),
        Index('idx_courses_year_level', 'year_level'),
        Index('idx_courses_subject_code', 'subject_code'),
    )

class User(Base):
    """System users - student, instructor, secretary, admin"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # student, instructor, secretary, admin
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    students = relationship("Student", back_populates="user")
    class_sections = relationship("ClassSection", back_populates="instructor")
    
    # Indexes
    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_role', 'role'),
    )

class Student(Base):
    """Student profiles with program and year level"""
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_number = Column(String(50), unique=True, nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    year_level = Column(Integer, nullable=True)  # 1-4
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="students")
    program = relationship("Program", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")
    evaluations = relationship("Evaluation", back_populates="student")
    
    # Indexes
    __table_args__ = (
        Index('idx_students_user_id', 'user_id'),
        Index('idx_students_program', 'program_id'),
        Index('idx_students_number', 'student_number'),
    )

class ClassSection(Base):
    """Course sections taught by instructors"""
    __tablename__ = "class_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    class_code = Column(String(50), unique=True, nullable=False)
    semester = Column(String(20), nullable=False)
    academic_year = Column(String(20), nullable=False)  # e.g., '2024-2025'
    max_students = Column(Integer, default=40)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    course = relationship("Course", back_populates="class_sections")
    instructor = relationship("User", back_populates="class_sections")
    enrollments = relationship("Enrollment", back_populates="class_section")
    evaluations = relationship("Evaluation", back_populates="class_section")
    
    # Indexes
    __table_args__ = (
        Index('idx_class_sections_course', 'course_id'),
        Index('idx_class_sections_instructor', 'instructor_id'),
        Index('idx_class_sections_academic_year', 'academic_year'),
    )

class Enrollment(Base):
    """Student enrollments in class sections"""
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='active')  # active, dropped, completed
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    class_section = relationship("ClassSection", back_populates="enrollments")
    
    # Indexes
    __table_args__ = (
        Index('idx_enrollments_student', 'student_id'),
        Index('idx_enrollments_class_section', 'class_section_id'),
    )

class Evaluation(Base):
    """
    Course evaluations with ML features for thesis:
    - SVM Sentiment Analysis
    - DBSCAN Anomaly Detection
    
    Rating Scale (1-4):
    1 = Strongly Disagree
    2 = Disagree
    3 = Agree
    4 = Strongly Agree
    """
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Core evaluation data
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id", ondelete="CASCADE"), nullable=False)
    
    # Rating fields (1-4 scale: Strongly Disagree to Strongly Agree)
    rating_teaching = Column(Integer, nullable=False)      # 1-4
    rating_content = Column(Integer, nullable=False)       # 1-4
    rating_engagement = Column(Integer, nullable=False)    # 1-4
    rating_overall = Column(Integer, nullable=False)       # 1-4
    
    # Text feedback for SVM analysis
    text_feedback = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    
    # ML Analysis Results - SVM Sentiment Analysis
    sentiment = Column(String(20), nullable=True)          # positive, neutral, negative
    sentiment_score = Column(Float, nullable=True)         # 0-1
    sentiment_confidence = Column(Float, nullable=True)    # SVM confidence score
    
    # ML Analysis Results - DBSCAN Anomaly Detection
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    anomaly_reason = Column(Text, nullable=True)           # Why flagged as anomaly
    
    # Metadata
    submission_date = Column(DateTime, default=datetime.utcnow)
    submission_ip = Column(String(45), nullable=True)
    processing_status = Column(String(20), default='pending')  # pending, processed, flagged
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="evaluations")
    class_section = relationship("ClassSection", back_populates="evaluations")
    
    # Indexes for ML analysis queries
    __table_args__ = (
        Index('idx_evaluations_student', 'student_id'),
        Index('idx_evaluations_class_section', 'class_section_id'),
        Index('idx_evaluations_sentiment', 'sentiment'),
        Index('idx_evaluations_anomaly', 'is_anomaly'),
        Index('idx_evaluations_processing_status', 'processing_status'),
        Index('idx_evaluations_submission_date', 'submission_date'),
    )

# No more: Firebase sync, Audit logs, Secretary tables, Evaluation periods, System settings
# Clean and thesis-focused!
