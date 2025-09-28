# Course Feedback System Backend

A FastAPI-based backend for course evaluation and sentiment analysis using SVM machine learning.

## Features

- **FastAPI REST API** with automatic OpenAPI documentation
- **SVM Sentiment Analysis** with spaCy preprocessing and scikit-learn
- **JWT Authentication** with role-based access control
- **PostgreSQL Database** with SQLAlchemy ORM
- **Real-time Analytics** and dashboard statistics
- **Comprehensive Logging** and error handling

## Architecture

```
Back/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── models/              # Database models (SQLAlchemy)
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── dashboard.py     # Dashboard statistics
│   │   ├── courses.py       # Course management
│   │   ├── evaluations.py   # Evaluation management
│   │   └── analytics.py     # Sentiment analysis endpoints
│   ├── services/            # Business logic
│   │   └── svm_sentiment.py # SVM sentiment analysis service
│   ├── utils/               # Utility functions
│   │   └── database.py      # Database connection and session management
│   └── data/                # Training data and model storage
├── requirements.txt         # Python dependencies
└── setup.py                # Setup script
```

## Setup Instructions

### 1. Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Git

### 2. Installation

```bash
# Clone and navigate to backend directory
cd "Back"

# Run setup script (installs dependencies and downloads models)
python setup.py

# Alternative manual setup:
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3. Configuration

```bash
# Copy environment template
cp app/.env.example app/.env

# Edit .env with your configuration
DATABASE_URL=postgresql://username:password@localhost:5432/course_feedback_db
SECRET_KEY=your-super-secret-key
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb course_feedback_db

# The application will automatically create tables on first run
```

### 5. Running the Application

```bash
# Navigate to app directory
cd app

# Start development server
uvicorn main:app --reload --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Analytics
- `POST /api/analytics/sentiment/analyze` - Analyze single text sentiment
- `POST /api/analytics/sentiment/batch` - Batch sentiment analysis
- `GET /api/analytics/sentiment/statistics` - Get sentiment statistics

### Courses & Evaluations
- `GET /api/courses/` - List courses with filtering
- `GET /api/evaluations/` - List evaluations with filtering

## SVM Sentiment Analysis

The sentiment analysis system implements a complete SVM pipeline:

### Features
- **Text Preprocessing**: spaCy-based tokenization, lemmatization, stop word removal
- **Feature Extraction**: TF-IDF vectorization with n-grams
- **Model Training**: SVM with hyperparameter tuning via GridSearchCV
- **Prediction**: Real-time sentiment classification with confidence scores

### Sentiment Classes
- **Positive**: Favorable feedback
- **Neutral**: Balanced or factual feedback  
- **Negative**: Critical or unfavorable feedback

### Model Performance
- Hyperparameter optimization for optimal accuracy
- Cross-validation for robust model evaluation
- Feature importance analysis for interpretability

## API Documentation

Once running, access interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Project Structure
- **Modular Design**: Separate concerns into models, routers, services
- **Async Support**: Full asynchronous operation support
- **Error Handling**: Comprehensive exception handling
- **Logging**: Structured logging throughout the application

### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Production Deployment

### Environment Variables
Set production values for:
- `DATABASE_URL`: Production database connection
- `SECRET_KEY`: Strong secret key for JWT
- `BACKEND_CORS_ORIGINS`: Frontend URLs

### Security Considerations
- Use strong SECRET_KEY
- Enable HTTPS in production
- Configure proper CORS origins
- Set up database connection pooling
- Implement rate limiting

## Troubleshooting

### Common Issues

1. **spaCy Model Not Found**
   ```bash
   python -m spacy download en_core_web_sm
   ```

2. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

3. **Import Errors**
   - Verify all requirements are installed
   - Check Python path and virtual environment

### Logs
Application logs are available in the console and can be configured for file output in production.

## License

This project is part of a thesis project for course feedback system with sentiment analysis capabilities.