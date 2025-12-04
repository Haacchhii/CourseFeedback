# Course Feedback Evaluation System - Test Suite

## Test Structure

### 1. Unit Tests (`test_*.py`)
- **test_sentiment_analysis.py**: SVM sentiment classifier tests
- **test_anomaly_detection.py**: DBSCAN clustering tests  
- **test_api_endpoints.py**: Individual API endpoint tests

### 2. Integration Tests (`test_integration.py`)
- Frontend ↔ Backend communication
- Backend ↔ ML models integration
- Backend ↔ Database relationships
- End-to-end workflows

## Running Tests

### Install Test Dependencies
```bash
cd Back/App
pip install -r tests/requirements-test.txt
```

### Run All Tests
```bash
pytest tests/ -v
```

### Run Specific Test Files
```bash
# Unit tests only
pytest tests/test_sentiment_analysis.py -v
pytest tests/test_anomaly_detection.py -v
pytest tests/test_api_endpoints.py -v

# Integration tests only
pytest tests/test_integration.py -v
```

### Run with Coverage Report
```bash
pytest tests/ --cov=. --cov-report=html
```

### Run Specific Test Cases
```bash
# Run single test class
pytest tests/test_api_endpoints.py::TestAuthenticationEndpoints -v

# Run single test method
pytest tests/test_sentiment_analysis.py::TestSentimentAnalyzer::test_positive_sentiment -v
```

## Test Coverage Areas

### White-Box Testing (Unit Tests)
✅ SVM Sentiment Analysis Module
- Positive/negative/neutral sentiment detection
- Batch processing
- Empty input handling
- Score range validation

✅ DBSCAN Anomaly Detection Module
- Low rating anomaly detection
- Inconsistent pattern detection
- Variance analysis
- Missing data handling

✅ API Endpoints
- Authentication & authorization
- Secretary endpoints
- Department head endpoints
- Student endpoints
- Role-based access control

### Integration Testing
✅ Frontend-Backend Integration
- Dashboard data flow
- Courses page aggregation
- Sentiment analysis pipeline

✅ Backend-ML Integration
- Evaluation submission with ML processing
- Batch evaluation processing

✅ Database Integration
- Student-enrollment relationships
- Evaluation-course chains
- Foreign key constraints

✅ End-to-End Workflows
- Complete evaluation submission workflow

## Test Results Documentation

After running tests, results will be displayed in the terminal showing:
- ✅ Passed tests
- ❌ Failed tests  
- ⚠️ Skipped tests (when preconditions not met)

Generate HTML coverage report:
```bash
pytest tests/ --cov=. --cov-report=html
# Opens htmlcov/index.html
```

## Notes for Thesis Documentation

- **Unit tests** demonstrate algorithm correctness (SVM, DBSCAN)
- **Integration tests** verify component interactions
- **Coverage reports** show tested vs untested code
- Test results can be included in thesis appendices
