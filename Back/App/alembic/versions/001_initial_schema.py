# Database Migration Setup with Alembic
# For PostgreSQL schema management and version control

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

"""Create initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-09-26 12:00:00.000000

"""

# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Create all tables following 3NF normalization"""
    
    # Create departments table
    op.create_table('departments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_departments_id'), 'departments', ['id'], unique=False)

    # Create programs table
    op.create_table('programs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_programs_id'), 'programs', ['id'], unique=False)

    # Create roles table
    op.create_table('roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('permissions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('firebase_uid', sa.String(length=255), nullable=True),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('firebase_uid'),
        sa.UniqueConstraint('username')
    )
    op.create_index('idx_user_email_active', 'users', ['email', 'is_active'], unique=False)
    op.create_index('idx_user_role_dept', 'users', ['role_id', 'department_id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)

    # Create courses table
    op.create_table('courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('program_id', sa.Integer(), nullable=False),
        sa.Column('year_level', sa.Integer(), nullable=False),
        sa.Column('semester', sa.String(length=20), nullable=False),
        sa.Column('academic_year', sa.String(length=20), nullable=False),
        sa.Column('instructor_id', sa.Integer(), nullable=False),
        sa.Column('enrolled_students', sa.Integer(), nullable=True),
        sa.Column('units', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['instructor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['program_id'], ['programs.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_course_instructor_active', 'courses', ['instructor_id', 'is_active'], unique=False)
    op.create_index('idx_course_program_year', 'courses', ['program_id', 'year_level', 'semester'], unique=False)
    op.create_index(op.f('ix_courses_code'), 'courses', ['code'], unique=False)
    op.create_index(op.f('ix_courses_id'), 'courses', ['id'], unique=False)

    # Create analysis_results table
    op.create_table('analysis_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('analysis_type', sa.String(length=50), nullable=False),
        sa.Column('total_evaluations', sa.Integer(), nullable=True),
        sa.Column('positive_count', sa.Integer(), nullable=True),
        sa.Column('neutral_count', sa.Integer(), nullable=True),
        sa.Column('negative_count', sa.Integer(), nullable=True),
        sa.Column('anomaly_count', sa.Integer(), nullable=True),
        sa.Column('avg_overall_rating', sa.Float(), nullable=True),
        sa.Column('avg_sentiment_score', sa.Float(), nullable=True),
        sa.Column('confidence_interval', sa.Float(), nullable=True),
        sa.Column('detailed_results', sa.Text(), nullable=True),
        sa.Column('analysis_date', sa.DateTime(), nullable=True),
        sa.Column('model_version', sa.String(length=20), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_analysis_course_type', 'analysis_results', ['course_id', 'analysis_type'], unique=False)
    op.create_index('idx_analysis_date', 'analysis_results', ['analysis_date'], unique=False)
    op.create_index(op.f('ix_analysis_results_id'), 'analysis_results', ['id'], unique=False)

    # Create evaluations table
    op.create_table('evaluations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('firebase_doc_id', sa.String(length=255), nullable=True),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('overall_rating', sa.Float(), nullable=False),
        sa.Column('content_quality', sa.Float(), nullable=False),
        sa.Column('teaching_effectiveness', sa.Float(), nullable=False),
        sa.Column('course_organization', sa.Float(), nullable=False),
        sa.Column('learning_resources', sa.Float(), nullable=False),
        sa.Column('assessment_fairness', sa.Float(), nullable=False),
        sa.Column('text_feedback', sa.Text(), nullable=True),
        sa.Column('suggestions', sa.Text(), nullable=True),
        sa.Column('sentiment', sa.String(length=20), nullable=True),
        sa.Column('sentiment_score', sa.Float(), nullable=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=True),
        sa.Column('anomaly_score', sa.Float(), nullable=True),
        sa.Column('submission_ip', sa.String(length=45), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_eval_anomaly', 'evaluations', ['is_anomaly', 'anomaly_score'], unique=False)
    op.create_index('idx_eval_course_date', 'evaluations', ['course_id', 'submitted_at'], unique=False)
    op.create_index('idx_eval_sentiment', 'evaluations', ['sentiment', 'sentiment_score'], unique=False)
    op.create_index(op.f('ix_evaluations_id'), 'evaluations', ['id'], unique=False)

    # Insert default roles
    op.execute("""
        INSERT INTO roles (name, description, permissions) VALUES 
        ('admin', 'System Administrator', '["all"]'),
        ('department_head', 'Department Head', '["view_department", "manage_courses", "view_analytics"]'),
        ('instructor', 'Course Instructor', '["view_own_courses", "view_evaluations"]'),
        ('student', 'Student', '["submit_evaluation", "view_own_submissions"]')
    """)

def downgrade():
    """Drop all tables"""
    op.drop_table('evaluations')
    op.drop_table('analysis_results')
    op.drop_table('courses')
    op.drop_table('users')
    op.drop_table('roles')
    op.drop_table('programs')
    op.drop_table('departments')