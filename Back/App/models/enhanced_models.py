# Enhanced Database Models for Course Feedback System
# Matching your existing PostgreSQL schema with ML and Firebase enhancements

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, Index, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # Matches your existing column
    role = Column(String(50), nullable=False)  # student, instructor, department_head, admin
    first_name = Column(String(100), nullable=True)  # Enhanced field
    last_name = Column(String(100), nullable=True)   # Enhanced field
    department = Column(String(100), nullable=True)  # Enhanced field
    is_active = Column(Boolean, default=True)        # Enhanced field
    last_login = Column(DateTime, nullable=True)     # Enhanced field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    students = relationship("Student", back_populates="user")
    department_heads = relationship("DepartmentHead", back_populates="user")
    class_sections_taught = relationship("ClassSection", back_populates="instructor")

class Program(Base):
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    program_code = Column(String(50), unique=True, nullable=False)  # BSIT, BSCS, etc.
    program_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    students = relationship("Student", back_populates="program")
    courses = relationship("Course", back_populates="program")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_number = Column(String(50), unique=True, nullable=False)  # Fixed: was student_id
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    year_level = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="students")
    program = relationship("Program", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")
    evaluations = relationship("Evaluation", back_populates="student")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(50), unique=False, nullable=False)  # Changed to 50 to match DB
    subject_name = Column(String(255), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    year_level = Column(Integer, nullable=True)  # Made nullable to match DB
    semester = Column(Integer, nullable=True)  # FIXED: INTEGER to match upgraded database schema
    units = Column(Float, nullable=True)  # ADDED: units column from schema upgrade
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Note: updated_at column does not exist in database schema
    
    # Relationships
    program = relationship("Program", back_populates="courses")
    class_sections = relationship("ClassSection", back_populates="course")

class ClassSection(Base):
    __tablename__ = "class_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_code = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)  # Fixed: INTEGER to match database schema
    academic_year = Column(String(20), nullable=False)  # "2024-2025"
    max_students = Column(Integer, default=40)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    course = relationship("Course", back_populates="class_sections")
    instructor = relationship("User", back_populates="class_sections_taught")
    enrollments = relationship("Enrollment", back_populates="class_section")
    evaluations = relationship("Evaluation", back_populates="class_section")
    analysis_results = relationship("AnalysisResult", back_populates="class_section")

class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='active')  # active, dropped, completed
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    class_section = relationship("ClassSection", back_populates="enrollments")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    
    # Basic rating fields (must match actual database columns)
    rating_teaching = Column(Integer, nullable=True)     # 1-4
    rating_content = Column(Integer, nullable=True)      # 1-4 (was rating_knowledge)
    rating_engagement = Column(Integer, nullable=True)   # 1-4
    rating_overall = Column(Integer, nullable=True)      # 1-4
    
    # Text feedback fields
    text_feedback = Column(Text, nullable=True)
    suggestions = Column(Text, nullable=True)
    
    # JSONB field for extended ratings (if needed)
    ratings = Column(JSONB, nullable=True)  # Stores additional ratings: {"1": 4, "2": 3, ...}
    
    # Sentiment analysis fields
    sentiment = Column(String(20), nullable=True)  # positive, neutral, negative
    sentiment_score = Column(Float, nullable=True)
    sentiment_confidence = Column(Float, nullable=True)  # Matches DB column
    
    # Anomaly detection fields
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    anomaly_reason = Column(Text, nullable=True)
    
    # Metadata field - 'metadata' is reserved in SQLAlchemy, so we map it
    evaluation_metadata = Column('metadata', JSONB, nullable=True)
    
    # Processing status fields
    processing_status = Column(String(50), default='pending')
    processed_at = Column(DateTime, nullable=True)
    
    # Timestamp fields
    submission_date = Column(DateTime, default=datetime.utcnow)
    submission_ip = Column(String(50), nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="evaluations")
    class_section = relationship("ClassSection", back_populates="evaluations")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_evaluations_ratings', 'ratings', postgresql_using='gin'),
        Index('idx_evaluations_sentiment', 'sentiment', 'sentiment_score'),
        Index('idx_evaluations_anomaly', 'is_anomaly', 'anomaly_score'),
        Index('idx_evaluations_processing', 'processing_status', 'processed_at'),
    )

class DepartmentHead(Base):
    __tablename__ = "department_heads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    department = Column(String(255), nullable=True)
    programs = Column(ARRAY(Integer), nullable=True)  # Array of program IDs they oversee
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="department_heads")

class Secretary(Base):
    __tablename__ = "secretaries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    programs = Column(ARRAY(Integer), nullable=True)  # Array of program IDs they manage
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

class Instructor(Base):
    __tablename__ = "instructors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

class EvaluationPeriod(Base):
    __tablename__ = "evaluation_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    semester = Column(String(50), nullable=False)  # "First Semester", "Second Semester"
    academic_year = Column(String(20), nullable=False)  # "2024-2025"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(20), default='draft')  # draft, active, closed
    total_students = Column(Integer, default=0)
    completed_evaluations = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_evaluation_periods_status', 'status', 'start_date', 'end_date'),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # USER_CREATED, LOGIN, SETTINGS_CHANGED, etc.
    category = Column(String(50), nullable=False)  # User Management, Authentication, System Settings, etc.
    severity = Column(String(20), default='Info')  # Info, Warning, Critical
    status = Column(String(20), default='Success')  # Success, Failed, Blocked
    ip_address = Column(String(45), nullable=True)
    details = Column(JSONB, nullable=True)  # Additional context in JSON
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_logs_action', 'action', 'created_at'),
        Index('idx_audit_logs_user', 'user_id', 'created_at'),
        Index('idx_audit_logs_severity', 'severity', 'status'),
    )

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, unique=True)  # general, email, security, backup
    settings = Column(JSONB, nullable=False)  # All settings for that category in JSON
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    updater = relationship("User")

# New tables for ML and analytics
class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    analysis_type = Column(String(50), nullable=False)  # sentiment, anomaly, trend
    
    # Aggregated statistics
    total_evaluations = Column(Integer, default=0)
    positive_count = Column(Integer, default=0)
    neutral_count = Column(Integer, default=0)
    negative_count = Column(Integer, default=0)
    anomaly_count = Column(Integer, default=0)
    
    # Statistical measures
    avg_overall_rating = Column(Float, nullable=True)
    avg_sentiment_score = Column(Float, nullable=True)
    confidence_interval = Column(Float, nullable=True)
    
    # Detailed results in JSON format
    detailed_results = Column(JSONB, nullable=True)
    
    # Metadata
    analysis_date = Column(DateTime, default=datetime.utcnow)
    model_version = Column(String(20), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    # Relationships
    class_section = relationship("ClassSection", back_populates="analysis_results")
    
    # Indexes
    __table_args__ = (
        Index('idx_analysis_results_class_type', 'class_section_id', 'analysis_type'),
        Index('idx_analysis_results_date', 'analysis_date'),
    )

class NotificationQueue(Base):
    __tablename__ = "notification_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notification_type = Column(String(50), nullable=False)  # anomaly_alert, evaluation_complete, dashboard_update
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)  # Additional notification data
    status = Column(String(20), default='pending')  # pending, sent, failed
    scheduled_for = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_notifications_user', 'user_id', 'status'),
    )