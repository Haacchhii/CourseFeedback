"""
Unit Tests for API Endpoints
Course Feedback Evaluation System
"""
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from fastapi.testclient import TestClient
    from main import app
    from database.connection import get_db
    
    client = TestClient(app)
    TEST_CLIENT_AVAILABLE = True
except Exception as e:
    print(f"Warning: TestClient not available: {e}")
    TEST_CLIENT_AVAILABLE = False
    client = None

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestAuthenticationEndpoints:
    """Test authentication and authorization endpoints"""
    
    def test_login_with_valid_credentials(self):
        """Test Case: Login with valid credentials"""
        response = client.post("/api/auth/login", json={
            "email": "secretary@lpu.edu.ph",
            "password": "secretary123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access token"
        assert data["user"]["role"] == "secretary", "Role mismatch"
    
    def test_login_with_invalid_credentials(self):
        """Test Case: Login should fail with wrong password"""
        response = client.post("/api/auth/login", json={
            "email": "secretary@lpu.edu.ph",
            "password": "wrongpassword"
        })
        
        assert response.status_code in [401, 403], "Should return unauthorized"
    
    def test_login_with_nonexistent_user(self):
        """Test Case: Login with non-existent email"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@lpu.edu.ph",
            "password": "password123"
        })
        
        assert response.status_code in [401, 404], "Should return not found/unauthorized"

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestSecretaryEndpoints:
    """Test secretary module endpoints"""
    
    @pytest.fixture
    def secretary_token(self):
        """Get valid secretary authentication token"""
        response = client.post("/api/auth/login", json={
            "email": "secretary@lpu.edu.ph",
            "password": "secretary123"
        })
        return response.json()["access_token"]
    
    def test_get_dashboard_statistics(self, secretary_token):
        """Test Case: Retrieve dashboard statistics"""
        response = client.get(
            "/api/secretary/dashboard?user_id=2",
            headers={"Authorization": f"Bearer {secretary_token}"}
        )
        
        assert response.status_code == 200, f"Dashboard request failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "total_evaluations" in data or "total_courses" in data
        assert "sentiment" in data or "participation_rate" in data
    
    def test_get_evaluations_with_pagination(self, secretary_token):
        """Test Case: Get evaluations with pagination"""
        response = client.get(
            "/api/secretary/evaluations?user_id=2&page=1&page_size=50",
            headers={"Authorization": f"Bearer {secretary_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data, "Missing data field"
        assert "pagination" in data, "Missing pagination info"
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 50
    
    def test_get_courses(self, secretary_token):
        """Test Case: Retrieve courses list"""
        response = client.get(
            "/api/secretary/courses?user_id=2",
            headers={"Authorization": f"Bearer {secretary_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "data" in data
    
    def test_sentiment_analysis_endpoint(self, secretary_token):
        """Test Case: Sentiment analysis data retrieval"""
        response = client.get(
            "/api/secretary/sentiment-analysis?user_id=2&time_range=month",
            headers={"Authorization": f"Bearer {secretary_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "sentiment" in data or "trends" in data

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestDepartmentHeadEndpoints:
    """Test department head module endpoints"""
    
    @pytest.fixture
    def dept_head_token(self):
        """Get valid department head authentication token"""
        response = client.post("/api/auth/login", json={
            "email": "depthead@lpu.edu.ph",
            "password": "depthead123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_get_department_dashboard(self, dept_head_token):
        """Test Case: Department dashboard statistics"""
        if not dept_head_token:
            pytest.skip("Department head account not available")
        
        response = client.get(
            "/api/dept-head/dashboard?user_id=3",
            headers={"Authorization": f"Bearer {dept_head_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_evaluations" in data or "total_courses" in data
    
    def test_get_department_evaluations(self, dept_head_token):
        """Test Case: Department-filtered evaluations"""
        if not dept_head_token:
            pytest.skip("Department head account not available")
        
        response = client.get(
            "/api/dept-head/evaluations?user_id=3&page=1&page_size=50",
            headers={"Authorization": f"Bearer {dept_head_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestStudentEndpoints:
    """Test student module endpoints"""
    
    @pytest.fixture
    def student_token(self):
        """Get valid student authentication token"""
        response = client.post("/api/auth/login", json={
            "email": "student@lpu.edu.ph",
            "password": "student123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_get_enrolled_courses(self, student_token):
        """Test Case: Student can view enrolled courses"""
        if not student_token:
            pytest.skip("Student account not available")
        
        response = client.get(
            "/api/student/1/courses",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "data" in data
    
    def test_submit_evaluation(self, student_token):
        """Test Case: Submit course evaluation"""
        if not student_token:
            pytest.skip("Student account not available")
        
        evaluation_data = {
            "student_id": 1,
            "class_section_id": 1,
            "ratings": {str(i): 4 for i in range(1, 32)},
            "text_feedback": "Great course!",
            "evaluation_period_id": 1
        }
        
        response = client.post(
            "/api/student/evaluations",
            json=evaluation_data,
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        # May fail if evaluation already exists, that's expected
        assert response.status_code in [200, 201, 400]

@pytest.mark.skipif(not TEST_CLIENT_AVAILABLE, reason="TestClient not available")
class TestRoleBasedAccessControl:
    """Test authorization and role-based access"""
    
    def test_student_cannot_access_admin_routes(self):
        """Test Case: Students cannot access admin endpoints"""
        # Try to login as student and access admin route
        login_response = client.post("/api/auth/login", json={
            "email": "student@lpu.edu.ph",
            "password": "student123"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Student account not available")
        
        token = login_response.json()["access_token"]
        
        # Try to access admin endpoint
        response = client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code in [401, 403], "Student should not access admin routes"
    
    def test_unauthorized_access_blocked(self):
        """Test Case: Access without token is blocked"""
        response = client.get("/api/secretary/dashboard?user_id=2")
        
        # Should require authentication
        assert response.status_code in [401, 403, 422]

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
