"""
Test Configuration and Setup
"""
import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

@pytest.fixture(scope="session")
def test_database():
    """Setup test database"""
    # Use existing database for integration tests
    # For true unit tests, you'd want a separate test database
    pass

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment"""
    print("\n" + "="*70)
    print("COURSE FEEDBACK EVALUATION SYSTEM - TEST SUITE")
    print("="*70)
    yield
    print("\n" + "="*70)
    print("TEST SUITE COMPLETED")
    print("="*70)
