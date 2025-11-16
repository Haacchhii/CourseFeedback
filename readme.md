# LPU Batangas Course Feedback System

**Status:** ✅ Production Ready  
**Branch:** `feature/secretary-depthead-overhaul`  
**Last Updated:** November 17, 2025

## 🎓 About

A comprehensive course evaluation system designed for Lyceum of the Philippines University - Batangas with integrated machine learning for sentiment analysis and anomaly detection.

**Developer:** Jose Iturralde  
**Institution:** Lyceum of the Philippines University - Batangas

---

## 📋 Overview

A modern web-based course evaluation system featuring automated enrollment, real-time analytics, and machine learning capabilities for educational feedback management.

### Core Features:
- ✅ **Automated Student Enrollment** - Auto-enroll students by program section
- ✅ **Course Evaluation System** - Comprehensive evaluation form
- ✅ **SVM Sentiment Analysis** - Machine learning-powered sentiment detection
- ✅ **Anomaly Detection** - DBSCAN-based response pattern analysis
- ✅ **Program Section Management** - Organize students by program and year
- ✅ **Role-Based Access Control** - Admin, Student, Department Head, Secretary, Instructor
- ✅ **Audit Logging** - Complete activity tracking
- ✅ **Responsive Design** - Optimized for all screen sizes

---

## 🛠 Tech Stack

### Frontend:
- **Framework:** React 18.3 with Vite 5.x
- **Routing:** React Router v6
- **Styling:** Tailwind CSS 3.x
- **HTTP Client:** Axios
- **State Management:** React Hooks (useState, useEffect)

### Backend:
- **Framework:** FastAPI (Python 3.13)
- **Database:** PostgreSQL via Supabase
- **ORM:** SQLAlchemy 2.0.44
- **Authentication:** JWT tokens with bcrypt hashing
- **ML Libraries:** scikit-learn, numpy, pandas, scipy

### Machine Learning:
- **Sentiment Analysis:** SVM (Support Vector Machine) with TF-IDF vectorization
- **Anomaly Detection:** DBSCAN-based pattern detection
- **Model Persistence:** pickle/joblib
- **Real-time Processing:** Automatic ML analysis on evaluation submission

---

## 📁 Project Structure

```
thesis/
├── readme.md                                  # This file
├── THESIS_PROJECT_COMPLETE.md                 # 📊 Complete project summary
├── SETUP_GUIDE.md                            # 🔧 Installation instructions
├── ARCHITECTURE.md                           # 🏗️ System architecture
├── LPU_EVALUATION_FORM_STRUCTURE.md          # 📝 31-question structure
├── EMAIL_NOTIFICATION_SYSTEM_COMPLETE.md     # 📧 Email system docs
├── COURSE_MANAGEMENT_CRUD_COMPLETE.md        # 📚 Course management docs
├──
├── Back/                                     # Backend (FastAPI)
│   ├── .env.example                         # Configuration template
│   ├── requirements.txt                     # Python dependencies
│   ├── App/
│   │   ├── main.py                         # FastAPI entry point
│   │   ├── config.py                       # Configuration (SMTP, JWT, DB)
│   │   ├── train_ml_models.py              # ML training script
│   │   ├── database/
│   │   │   └── connection.py               # PostgreSQL connection
│   │   ├── models/
│   │   │   ├── enhanced_models.py          # SQLAlchemy models
│   │   │   └── thesis_models.py
│   │   ├── routes/
│   │   │   ├── auth.py                     # Authentication
│   │   │   ├── student.py                  # Student evaluation (ML integrated)
│   │   │   ├── system_admin.py             # Admin routes (email endpoints)
│   │   │   ├── instructor.py
│   │   │   ├── secretary.py
│   │   │   └── department_head.py
│   │   ├── services/
│   │   │   └── email_service.py            # ✅ Email notification service
│   │   └── ml_services/
│   │       ├── sentiment_analyzer.py       # ✅ SVM sentiment analysis
│   │       ├── anomaly_detector.py         # ✅ DBSCAN anomaly detection
│   │       └── models/
│   │           └── svm_sentiment_model.pkl # Trained SVM model
│   └── database_schema/
│       └── DATABASE_COMPLETE_SETUP.sql     # Full database schema
│
└── New/capstone/                            # Frontend (React)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.cjs
    ├── sample_courses_import.csv            # Sample CSV for bulk import
    └── src/
        ├── App.jsx                          # Main routing
        ├── main.jsx                         # Entry point
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   └── Header.jsx
        ├── pages/
        │   ├── admin/
        │   │   ├── AdminDashboard.jsx
        │   │   ├── UserManagement.jsx
        │   │   ├── EnhancedCourseManagement.jsx  # CRUD + CSV + Batch
        │   │   ├── EvaluationPeriodManagement.jsx
        │   │   ├── EmailNotifications.jsx         # ✅ Email admin panel
        │   │   ├── SystemSettings.jsx
        │   │   ├── AuditLogViewer.jsx
        │   │   └── DataExportCenter.jsx
        │   ├── staff/
        │   │   ├── Dashboard.jsx
        │   │   ├── SentimentAnalysis.jsx          # ✅ ML sentiment display
        │   │   ├── AnomalyDetection.jsx           # ✅ ML anomaly display
        │   │   └── Courses.jsx
        │   ├── student/
        │   │   └── StudentEvaluation.jsx          # 31-question form
        │   └── common/
        │       ├── Login.jsx
        │       └── Index.jsx
        ├── services/
        │   └── api.js                       # API client (with email endpoints)
        ├── data/
        │   └── questionnaireConfig.js       # ✅ 31 LPU questions
        └── utils/
            └── roleUtils.js
```

---

## 🚀 Quick Start

### Prerequisites:
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone Repository:
```bash
git clone https://github.com/Haacchhii/CourseFeedback.git
cd CourseFeedback
git checkout final-version
```

### 2. Backend Setup:
```powershell
cd Back\App

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure config.py with your Supabase credentials
# SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, etc.

# Initialize database (run in Supabase SQL Editor)
# database_schema/DATABASE_COMPLETE_SETUP.sql

# Train ML models
python train_ml_models.py

# Start server
python main.py
# Backend runs on http://localhost:8000
```

### 3. Frontend Setup:
```powershell
cd New\capstone

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Access Application:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 👥 Default User Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| System Admin | admin@lpu.edu.ph | admin123 | Full system access |
| Student | student1@lpu.edu.ph | student123 | Evaluation submission |
| Instructor | instructor@lpu.edu.ph | instructor123 | View evaluations |
| Secretary | secretary@lpu.edu.ph | secretary123 | Manage periods |
| Dept Head | depthead@lpu.edu.ph | depthead123 | Department analytics |

---

## 🧪 Machine Learning Features

### Automated Training & Loading:
```powershell
# Navigate to backend
cd Back\App

# Train both models
python train_ml_models.py

# Models saved to ml_services/models/
# - svm_sentiment_model.pkl (SVM with TF-IDF)
# - Automatically loads on server start
```

### Sentiment Analysis (SVM):
- TF-IDF vectorization of text comments
- Classifies feedback as Positive/Negative/Neutral
- Real-time classification on evaluation submission
- Results stored in evaluations.ml_sentiment

### Anomaly Detection (DBSCAN):
- Detects straight-lining patterns (all same ratings)
- Identifies suspicious response patterns
- Detects low variance responses
- Flags alternating/sequential patterns
- Results stored in evaluations.ml_anomaly_score
- Real-time detection on submission

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | 🔧 Complete installation and setup instructions |
| readme.md | 📖 This file - project overview and quick start |

---

## 🎯 Key Features

### 1. Automated Enrollment System:
- ✅ Quick Bulk Enrollment by program section
- ✅ Auto-enrollment of students when creating class sections
- ✅ Program-based student filtering
- ✅ Batch section creation with automatic student assignment

### 2. Machine Learning Integration:
- ✅ SVM sentiment analysis with TF-IDF vectorization
- ✅ DBSCAN anomaly detection for response patterns
- ✅ Real-time ML processing on submission
- ✅ Persistent model storage
- ✅ Analytics dashboard with ML insights

### 3. Course & Section Management:
- ✅ Program section organization (e.g., BSCS-DS-3A)
- ✅ Class section creation with auto-enrollment
- ✅ Individual student enrollment management
- ✅ Section overview with enrolled counts
- ✅ No instructor requirement (evaluation-only system)

### 4. System Administration:
- ✅ User management across 5 roles
- ✅ Program section management
- ✅ Evaluation period management
- ✅ Audit logging for all critical actions
- ✅ System settings and configuration

---

## 📊 System Capabilities

### Enrollment & Management:
- Automated student enrollment by program section
- Quick bulk section creation with auto-enrollment
- Individual enrollment management
- Program section tracking (e.g., BSCS-DS-3A, BSIT-2B)

### Machine Learning:
- SVM sentiment analysis with TF-IDF (Positive/Negative/Neutral)
- DBSCAN anomaly detection for response patterns
- Real-time processing on evaluation submission
- Persistent model storage and loading

### Administration:
- 5 role-based access levels (System Admin, Admin, Secretary, Dept Head, Student)
- Evaluation period management
- User management and program section assignment
- Audit logging for critical actions

### Analytics:
- ML-powered insights dashboard
- Sentiment distribution analysis
- Anomaly detection reports
- Export functionality (JSON/CSV)

---

## 📊 Project Statistics

- **Backend Files:** 15+ Python modules
- **Frontend Components:** 25+ React components
- **API Endpoints:** 50+ RESTful endpoints
- **Database Tables:** 12+ tables with migrations
- **ML Models:** 2 (SVM with TF-IDF, DBSCAN Anomaly Detection)
- **Lines of Code:** ~15,000+

---

## 📞 Contact

**Developer:** Jose Iturralde  
**Institution:** Lyceum of the Philippines University - Batangas  
**Project:** Thesis - Course Feedback System with ML Integration  
**Repository:** https://github.com/Haacchhii/CourseFeedback  
**Branch:** final-version  

---

## 📄 License

This project is developed for academic purposes as part of a thesis requirement.

---

**Status:** ✅ **PROJECT COMPLETE - READY FOR THESIS DEFENSE**

Last Updated: November 13, 2025
