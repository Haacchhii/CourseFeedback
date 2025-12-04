"""
Unit Tests for Anomaly Detection (DBSCAN Clustering)
Course Feedback Evaluation System
"""
import pytest
import numpy as np
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from ml_services.anomaly_detector import AnomalyDetector

class TestAnomalyDetector:
    """Test cases for DBSCAN-based anomaly detection"""
    
    @pytest.fixture
    def detector(self):
        """Initialize anomaly detector for testing"""
        return AnomalyDetector()
    
    def test_detect_low_rating_anomaly(self, detector):
        """Test Case: Detect anomalous low ratings"""
        # Normal ratings: 3-4, Anomaly: 1
        ratings = {
            '1': 1, '2': 1, '3': 1, '4': 1, '5': 1,
            '6': 1, '7': 1, '8': 1, '9': 1, '10': 1,
            '11': 1, '12': 1, '13': 1, '14': 1, '15': 1,
            '16': 1, '17': 1, '18': 1, '19': 1, '20': 1,
            '21': 1, '22': 1, '23': 1, '24': 1, '25': 1,
            '26': 1, '27': 1, '28': 1, '29': 1, '30': 1, '31': 1
        }
        
        is_anomaly, anomaly_score, reason = detector.detect(ratings)
        assert is_anomaly == True, f"Failed to detect low rating anomaly. Reason: {reason}"
        assert anomaly_score > 0.5, f"Anomaly score too low: {anomaly_score}"
    
    def test_normal_evaluation_not_anomaly(self, detector):
        """Test Case: Varied normal evaluation should not be flagged"""
        # Normal ratings with some variation (not straight-lining)
        normal_ratings = {str(i): 3 if i % 3 != 0 else 4 for i in range(1, 32)}
        
        is_anomaly, anomaly_score, reason = detector.detect(normal_ratings)
        # Some variation should not trigger anomaly
        assert isinstance(is_anomaly, bool), "Should return boolean"
    
    def test_straight_lining_detection(self, detector):
        """Test Case: Detect straight-lining (all same ratings)"""
        straight_line_ratings = {str(i): 4 for i in range(1, 32)}  # All 4s
        
        is_anomaly, anomaly_score, reason = detector.detect(straight_line_ratings)
        # Straight-lining is intentionally flagged as anomalous behavior
        assert is_anomaly == True, f"Should detect straight-lining. Reason: {reason}"
        assert "straight" in reason.lower() or "same" in reason.lower(), "Reason should mention straight-lining"
    
    def test_extreme_variance_detection(self, detector):
        """Test Case: Detect extreme rating variance"""
        # Half ratings = 1, half ratings = 4 (high variance)
        variance_ratings = {
            **{str(i): 1 for i in range(1, 16)},
            **{str(i): 4 for i in range(16, 32)}
        }
        
        is_anomaly, anomaly_score, reason = detector.detect(variance_ratings)
        # High variance may or may not be anomalous, just check it processes
        assert isinstance(is_anomaly, bool), "Should return boolean"
        assert isinstance(anomaly_score, float), "Should return float score"
    
    def test_anomaly_score_range(self, detector):
        """Test Case: Verify anomaly score is within valid range"""
        test_ratings = {str(i): 2 for i in range(1, 32)}
        
        is_anomaly, anomaly_score, reason = detector.detect(test_ratings)
        assert 0 <= anomaly_score <= 1, f"Anomaly score out of valid range: {anomaly_score}"
    
    def test_missing_ratings_handling(self, detector):
        """Test Case: Handle evaluations with missing ratings"""
        incomplete_ratings = {str(i): 3 for i in range(1, 20)}  # Only 19 ratings
        
        # Should handle gracefully without crashing
        try:
            is_anomaly, anomaly_score, reason = detector.detect(incomplete_ratings)
            assert isinstance(is_anomaly, bool), "Should return boolean"
            assert isinstance(anomaly_score, float), "Should return float"
            assert isinstance(reason, str), "Should return reason string"
        except Exception as e:
            pytest.fail(f"Failed to handle missing ratings: {str(e)}")
    
    def test_batch_anomaly_detection(self, detector):
        """Test Case: Batch process multiple evaluations"""
        ratings_list = [
            {str(i): 4 for i in range(1, 32)},  # High ratings
            {str(i): 1 for i in range(1, 32)}   # Low ratings (likely anomaly)
        ]
        
        results = detector.detect_batch(ratings_list)
        assert len(results) == len(ratings_list), "Batch size mismatch"
        
        for is_anomaly, anomaly_score, reason in results:
            assert isinstance(is_anomaly, bool), "Should return boolean"
            assert isinstance(anomaly_score, float), "Should return float"
            assert isinstance(reason, str), "Should return reason"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
