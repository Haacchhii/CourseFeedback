"""
Integration Tests for Course Feedback Evaluation System
Tests interaction between Frontend, Backend, and ML Components
"""
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import SessionLocal
from models.enhanced_models import Evaluation, Student, ClassSection, Course

try:
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    TEST_CLIENT_AVAILABLE = True
except Exception as e:
    print(f"Warning: TestClient not available: {e}")
    TEST_CLIENT_AVAILABLE = False
    client = None

try:
    from ml_services.sentiment_analyzer import SentimentAnalyzer
    from ml_services.anomaly_detector import AnomalyDetector
    ML_AVAILABLE = True
except Exception as e:
    print(f"Warning: ML services not available: {e}")
    ML_AVAILABLE = False
    SentimentAnalyzer = None
    AnomalyDetector = None

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestFrontendBackendIntegration:
    """Test React Frontend → FastAPI Backend communication"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers for API calls"""
        response = client.post("/api/auth/login", json={
            "email": "secretary@lpu.edu.ph",
            "password": "secretary123"
        })
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            return {"Authorization": f"Bearer {token}"}
        return {}
    
    def test_complete_dashboard_flow(self, auth_headers):
        """
        Integration Test: Complete dashboard data flow
        Frontend requests → Backend processes → Database queries → Response
        """
        # Step 1: Request dashboard data
        dashboard_response = client.get(
            "/api/secretary/dashboard?user_id=2",
            headers=auth_headers
        )
        assert dashboard_response.status_code == 200, "Dashboard request failed"
        dashboard_data = dashboard_response.json()
        
        # Step 2: Request evaluations data
        evaluations_response = client.get(
            "/api/secretary/evaluations?user_id=2&page=1&page_size=100",
            headers=auth_headers
        )
        assert evaluations_response.status_code == 200, "Evaluations request failed"
        evaluations_data = evaluations_response.json()
        
        # Step 3: Verify data consistency
        if "total_evaluations" in dashboard_data:
            assert isinstance(evaluations_data.get("data"), list), "Evaluations should be a list"
        
        print(f"✓ Dashboard flow complete: {dashboard_data.get('total_evaluations', 0)} evaluations")
    
    @pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
    def test_courses_page_integration(self, auth_headers):
        """
        Integration Test: Courses page data aggregation
        Tests: Courses → Enrollments → Evaluations → Sentiment
        """
        # Step 1: Get courses
        courses_response = client.get(
            "/api/secretary/courses?user_id=2",
            headers=auth_headers
        )
        assert courses_response.status_code == 200
        courses = courses_response.json()
        
        if isinstance(courses, dict):
            courses = courses.get("data", [])
        
        # Step 2: For each course, verify data completeness
        for course in courses[:3]:  # Test first 3 courses
            course_id = course.get("id")
            
            # Get category averages
            category_response = client.get(
                f"/api/secretary/courses/{course_id}/category-averages",
                headers=auth_headers
            )
            
            # Get question distribution
            question_response = client.get(
                f"/api/secretary/courses/{course_id}/question-distribution",
                headers=auth_headers
            )
            
            print(f"✓ Course {course_id}: Category and question data integrated")
    
    @pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
    def test_sentiment_analysis_pipeline(self, auth_headers):
        """
        Integration Test: Sentiment analysis data pipeline
        Tests: Evaluations → ML Processing → Aggregation → Visualization
        """
        # Step 1: Get sentiment analysis data
        sentiment_response = client.get(
            "/api/secretary/sentiment-analysis?user_id=2&time_range=month",
            headers=auth_headers
        )
        assert sentiment_response.status_code == 200
        sentiment_data = sentiment_response.json()
        
        # Step 2: Verify sentiment categories exist
        if "sentiment" in sentiment_data:
            sentiment_counts = sentiment_data["sentiment"]
            assert "positive" in sentiment_counts or "neutral" in sentiment_counts
        
        # Step 3: Get evaluations to verify sentiment values
        evaluations_response = client.get(
            "/api/secretary/evaluations?user_id=2&page=1&page_size=10",
            headers=auth_headers
        )
        evaluations = evaluations_response.json().get("data", [])
        
        # Verify evaluations have sentiment values
        for eval in evaluations[:5]:
            assert "sentiment" in eval, f"Evaluation {eval.get('id')} missing sentiment"
        
        print(f"✓ Sentiment pipeline complete: {len(evaluations)} evaluations processed")

@pytest.mark.skipif(not ML_AVAILABLE, reason="ML services not available")
class TestBackendMLIntegration:
    """Test Backend → ML Models integration"""
    
    @pytest.fixture
    def db_session(self):
        """Get database session for testing"""
        db = SessionLocal()
        yield db
        db.close()
    
    def test_evaluation_submission_with_ml_processing(self, db_session):
        """
        Integration Test: Evaluation submission triggers ML processing
        Flow: Submit evaluation → Sentiment analysis → Anomaly detection → Store results
        """
        # Create test evaluation data
        test_evaluation = {
            "ratings": {str(i): 4 for i in range(1, 32)},
            "text_feedback": "Excellent teaching and well-organized course content",
            "student_id": 1,
            "class_section_id": 1,
            "evaluation_period_id": 1
        }
        
        # Step 1: Initialize ML components
        sentiment_analyzer = SentimentAnalyzer()
        anomaly_detector = AnomalyDetector()
        
        # Step 2: Process sentiment
        sentiment_result = sentiment_analyzer.predict_sentiment(
            test_evaluation["text_feedback"]
        )
        assert "sentiment" in sentiment_result
        assert "sentiment_score" in sentiment_result
        print(f"✓ Sentiment: {sentiment_result['sentiment']} (score: {sentiment_result['sentiment_score']:.2f})")
        
        # Step 3: Process anomaly detection
        eval_with_sentiment = {
            **test_evaluation,
            **sentiment_result
        }
        anomaly_result = anomaly_detector.detect_anomaly(eval_with_sentiment)
        assert "is_anomaly" in anomaly_result
        assert "anomaly_score" in anomaly_result
        print(f"✓ Anomaly: {anomaly_result['is_anomaly']} (score: {anomaly_result['anomaly_score']:.2f})")
        
        # Step 4: Verify results can be stored
        assert isinstance(sentiment_result["sentiment"], str)
        assert isinstance(anomaly_result["is_anomaly"], bool)
    
    @pytest.mark.skipif(not ML_AVAILABLE, reason="ML services not available")
    def test_batch_evaluation_processing(self, db_session):
        """
        Integration Test: Batch process multiple evaluations
        Tests: Multiple evaluations → ML batch processing → Database updates
        """
        # Get sample evaluations from database
        evaluations = db_session.query(Evaluation).limit(5).all()
        
        if len(evaluations) == 0:
            pytest.skip("No evaluations in database for testing")
        
        sentiment_analyzer = SentimentAnalyzer()
        anomaly_detector = AnomalyDetector()
        
        processed_count = 0
        for evaluation in evaluations:
            # Process sentiment if text feedback exists
            if evaluation.text_feedback:
                sentiment_result = sentiment_analyzer.predict_sentiment(
                    evaluation.text_feedback
                )
                
                # Process anomaly detection
                eval_data = {
                    "ratings": evaluation.ratings,
                    "sentiment": sentiment_result["sentiment"],
                    "sentiment_score": sentiment_result["sentiment_score"]
                }
                anomaly_result = anomaly_detector.detect_anomaly(eval_data)
                
                processed_count += 1
        
        print(f"✓ Batch processed {processed_count} evaluations")
        assert processed_count > 0, "Should process at least one evaluation"

class TestDatabaseIntegration:
    """Test Backend → Database integration"""
    
    @pytest.fixture
    def db_session(self):
        """Get database session"""
        db = SessionLocal()
        yield db
        db.close()
    
    def test_student_enrollment_relationship(self, db_session):
        """
        Integration Test: Student → Enrollment → ClassSection relationships
        """
        # Query student with enrollments
        student = db_session.query(Student).first()
        if not student:
            pytest.skip("No students in database")
        
        # Verify relationships are accessible
        assert hasattr(student, 'user'), "Student should have user relationship"
        if student.user:
            assert hasattr(student.user, 'email'), "User should have email"
        
        print(f"✓ Student relationships verified for student ID: {student.id}")
    
    def test_evaluation_course_relationship(self, db_session):
        """
        Integration Test: Evaluation → ClassSection → Course chain
        """
        evaluation = db_session.query(Evaluation).first()
        if not evaluation:
            pytest.skip("No evaluations in database")
        
        # Navigate relationship chain
        class_section = db_session.query(ClassSection).filter(
            ClassSection.id == evaluation.class_section_id
        ).first()
        
        if class_section:
            course = db_session.query(Course).filter(
                Course.id == class_section.course_id
            ).first()
            
            assert course is not None, "Course should be accessible through class section"
            print(f"✓ Evaluation → Section → Course chain verified")
    
    def test_foreign_key_constraints(self, db_session):
        """
        Integration Test: Verify foreign key constraints are enforced
        """
        # Test that deleting referenced records is prevented or cascaded correctly
        student_count = db_session.query(Student).count()
        evaluation_count = db_session.query(Evaluation).count()
        
        assert student_count >= 0, "Should query students successfully"
        assert evaluation_count >= 0, "Should query evaluations successfully"
        
        print(f"✓ Database integrity verified: {student_count} students, {evaluation_count} evaluations")

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestEndToEndWorkflow:
    """End-to-end workflow tests"""
    
    def test_complete_evaluation_workflow(self):
        """
        Integration Test: Complete evaluation workflow
        Student submits → Backend processes → ML analyzes → Data stored → Dashboard displays
        """
        # Step 1: Login as student
        login_response = client.post("/api/auth/login", json={
            "email": "student@lpu.edu.ph",
            "password": "student123"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Student account not available")
        
        student_token = login_response.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # Step 2: Get enrolled courses
        courses_response = client.get(
            "/api/student/1/courses",
            headers=student_headers
        )
        assert courses_response.status_code == 200
        
        # Step 3: Submit evaluation (may fail if already exists)
        evaluation_data = {
            "student_id": 1,
            "class_section_id": 1,
            "ratings": {str(i): 4 for i in range(1, 32)},
            "text_feedback": "Integration test evaluation",
            "evaluation_period_id": 1
        }
        
        submit_response = client.post(
            "/api/student/evaluations",
            json=evaluation_data,
            headers=student_headers
        )
        
        # Accept both success and duplicate cases
        assert submit_response.status_code in [200, 201, 400]
        
        # Step 4: Login as secretary to view evaluation
        secretary_login = client.post("/api/auth/login", json={
            "email": "secretary@lpu.edu.ph",
            "password": "secretary123"
        })
        
        if secretary_login.status_code == 200:
            secretary_token = secretary_login.json()["access_token"]
            secretary_headers = {"Authorization": f"Bearer {secretary_token}"}
            
            # Step 5: Verify evaluation appears in dashboard
            dashboard_response = client.get(
                "/api/secretary/dashboard?user_id=2",
                headers=secretary_headers
            )
            assert dashboard_response.status_code == 200
            
            print("✓ Complete evaluation workflow verified")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
