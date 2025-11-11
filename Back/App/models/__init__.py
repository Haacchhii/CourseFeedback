# Models package initialization
# Updated to use thesis_models.py (simplified schema for ML thesis)
from .thesis_models import (
    Base,
    User,
    Student,
    Course,
    ClassSection,
    Enrollment,
    Evaluation,
    Program
)

__all__ = [
    "Base",
    "User",
    "Student",
    "Course",
    "ClassSection",
    "Enrollment",
    "Evaluation",
    "Program"
]
