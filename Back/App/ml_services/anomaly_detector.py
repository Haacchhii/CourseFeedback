"""
DBSCAN Anomaly Detector for Course Evaluations
Detects suspicious patterns in evaluation ratings
"""

import pickle
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    DBSCAN-based anomaly detector for course evaluation ratings
    
    Detects patterns like:
    - Straight-lining (all same ratings)
    - Response patterns (alternating ratings)
    - Statistical outliers
    - Category inconsistencies
    """
    
    def __init__(self, eps: float = 0.5, min_samples: int = 5):
        """
        Initialize anomaly detector
        
        Args:
            eps: Maximum distance between samples in a cluster
            min_samples: Minimum samples in a neighborhood for core point
        """
        self.eps = eps
        self.min_samples = min_samples
        self.scaler = StandardScaler()
        self.dbscan = DBSCAN(eps=eps, min_samples=min_samples)
        self.is_fitted = False
    
    def extract_features(self, ratings: Dict[str, int]) -> np.ndarray:
        """
        Extract numerical features from ratings dictionary
        
        Args:
            ratings: Dictionary of question_id -> rating (1-4)
            
        Returns:
            Numpy array of features
        """
        # Get all rating values
        rating_values = list(ratings.values())
        
        if not rating_values:
            return np.array([])
        
        features = []
        
        # Basic statistics
        features.append(np.mean(rating_values))  # Average rating
        features.append(np.std(rating_values))   # Standard deviation
        features.append(np.min(rating_values))   # Minimum rating
        features.append(np.max(rating_values))   # Maximum rating
        features.append(np.median(rating_values))  # Median rating
        
        # Pattern detection features
        features.append(rating_values.count(1))  # Count of 1s
        features.append(rating_values.count(2))  # Count of 2s
        features.append(rating_values.count(3))  # Count of 3s
        features.append(rating_values.count(4))  # Count of 4s
        
        # Variance (duplicate for emphasis on spread)
        features.append(np.var(rating_values))
        
        # Range
        features.append(np.max(rating_values) - np.min(rating_values))
        
        # Check for straight-lining (all same value)
        features.append(1.0 if len(set(rating_values)) == 1 else 0.0)
        
        # Check for alternating pattern
        alternating_score = self._check_alternating(rating_values)
        features.append(alternating_score)
        
        # Add all individual ratings as features
        features.extend(rating_values)
        
        return np.array(features)
    
    def _check_alternating(self, values: List[int]) -> float:
        """
        Check if ratings follow an alternating pattern
        
        Args:
            values: List of rating values
            
        Returns:
            Score between 0-1 indicating alternating pattern strength
        """
        if len(values) < 3:
            return 0.0
        
        alternations = 0
        for i in range(len(values) - 1):
            if values[i] != values[i + 1]:
                alternations += 1
        
        # High alternation rate suggests pattern
        return alternations / (len(values) - 1)
    
    def fit(self, ratings_list: List[Dict[str, int]]):
        """
        Fit the anomaly detector on a dataset of evaluations
        
        Args:
            ratings_list: List of rating dictionaries
        """
        logger.info(f"Fitting anomaly detector on {len(ratings_list)} evaluations...")
        
        # Extract features for all evaluations
        features_list = []
        for ratings in ratings_list:
            features = self.extract_features(ratings)
            if features.size > 0:
                features_list.append(features)
        
        if not features_list:
            raise ValueError("No valid features extracted")
        
        # Convert to numpy array
        X = np.array(features_list)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit DBSCAN
        self.dbscan.fit(X_scaled)
        self.is_fitted = True
        
        # Get cluster statistics
        labels = self.dbscan.labels_
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        n_anomalies = list(labels).count(-1)
        
        logger.info(f"Clustering complete: {n_clusters} clusters, {n_anomalies} anomalies detected")
        
        return {
            'n_clusters': n_clusters,
            'n_anomalies': n_anomalies,
            'anomaly_rate': n_anomalies / len(ratings_list) if ratings_list else 0
        }
    
    def detect(self, ratings: Dict[str, int]) -> Tuple[bool, float, str]:
        """
        Detect if a single evaluation is anomalous
        
        Args:
            ratings: Dictionary of question_id -> rating
            
        Returns:
            Tuple of (is_anomaly, anomaly_score, reason)
        """
        # Extract features
        features = self.extract_features(ratings)
        
        if features.size == 0:
            return False, 0.0, "No features to analyze"
        
        # Rule-based anomaly detection (works without fitting)
        is_anomaly, score, reason = self._rule_based_detection(ratings, features)
        
        return is_anomaly, score, reason

    # Compatibility alias used by integration tests
    def detect_anomaly(self, evaluation: Dict) -> Dict[str, float]:
        """
        Backward-compatible wrapper that returns a dict.
        Accepts evaluation dict with ratings and optional sentiment fields.
        """
        ratings = evaluation.get("ratings") or {}
        is_anomaly, score, reason = self.detect(ratings)
        return {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": float(score),
            "reason": reason
        }
    
    def _rule_based_detection(self, ratings: Dict[str, int], features: np.ndarray) -> Tuple[bool, float, str]:
        """
        Rule-based anomaly detection without requiring fitted model
        
        Args:
            ratings: Rating dictionary
            features: Extracted feature array
            
        Returns:
            Tuple of (is_anomaly, score, reason)
        """
        rating_values = list(ratings.values())
        
        # Rule 1: Straight-lining (all same values)
        if len(set(rating_values)) == 1:
            return True, 1.0, f"Straight-lining: All ratings are {rating_values[0]}"
        
        # Rule 2: All extreme values (all 1s or all 4s)
        if all(r == 1 for r in rating_values):
            return True, 0.95, "All minimum ratings (all 1s)"
        if all(r == 4 for r in rating_values):
            return True, 0.95, "All maximum ratings (all 4s)"
        
        # Rule 3: Very low variance (almost no variation)
        std_dev = np.std(rating_values)
        if std_dev < 0.3:
            return True, 0.8, f"Very low variance: {std_dev:.2f} (almost identical ratings)"
        
        # Rule 4: Alternating pattern
        alternating_score = self._check_alternating(rating_values)
        if alternating_score > 0.8:
            return True, 0.85, f"Alternating pattern detected: {alternating_score:.2f}"
        
        # Rule 5: Category inconsistency (check if provided in metadata)
        category_variance = self._check_category_inconsistency(ratings)
        if category_variance > 2.0:
            return True, 0.75, f"High category inconsistency: variance {category_variance:.2f}"
        
        # Rule 6: Suspicious speed (would need metadata - timestamp)
        # This would be implemented in the API layer
        
        return False, 0.0, "Normal pattern detected"
    
    def _check_category_inconsistency(self, ratings: Dict[str, int]) -> float:
        """
        Check for inconsistent ratings across categories
        
        Args:
            ratings: Rating dictionary with question IDs
            
        Returns:
            Variance score across categories
        """
        # Define category groupings based on question ID prefixes
        categories = {
            'relevance': [],
            'org': [],
            'teaching': [],
            'assessment': [],
            'environment': [],
            'counseling': []
        }
        
        # Group ratings by category
        for q_id, rating in ratings.items():
            for category_name in categories.keys():
                if q_id.startswith(category_name):
                    categories[category_name].append(rating)
                    break
        
        # Calculate average per category
        category_averages = []
        for cat_ratings in categories.values():
            if cat_ratings:
                category_averages.append(np.mean(cat_ratings))
        
        # Calculate variance across category averages
        if len(category_averages) > 1:
            return np.var(category_averages)
        
        return 0.0
    
    def detect_batch(self, ratings_list: List[Dict[str, int]]) -> List[Tuple[bool, float, str]]:
        """
        Detect anomalies in multiple evaluations
        
        Args:
            ratings_list: List of rating dictionaries
            
        Returns:
            List of (is_anomaly, score, reason) tuples
        """
        results = []
        for ratings in ratings_list:
            try:
                result = self.detect(ratings)
                results.append(result)
            except Exception as e:
                logger.error(f"Error detecting anomaly: {e}")
                results.append((False, 0.0, f"Error: {str(e)}"))
        
        return results
    
    def save_model(self, filename: str = "dbscan_anomaly_model.pkl"):
        """
        Save fitted model to disk
        
        Args:
            filename: Name of the file to save
        """
        model_dir = Path(__file__).parent / "models"
        model_dir.mkdir(exist_ok=True)
        model_path = model_dir / filename
        
        model_data = {
            'scaler': self.scaler,
            'dbscan': self.dbscan,
            'eps': self.eps,
            'min_samples': self.min_samples,
            'is_fitted': self.is_fitted
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {model_path}")
        return str(model_path)
    
    def load_model(self, path: str):
        """
        Load fitted model from disk
        
        Args:
            path: Path to the saved model file
        """
        model_path = Path(path)
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")
        
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.scaler = model_data['scaler']
        self.dbscan = model_data['dbscan']
        self.eps = model_data['eps']
        self.min_samples = model_data['min_samples']
        self.is_fitted = model_data['is_fitted']
        
        logger.info(f"Model loaded from {model_path}")


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Create detector
    detector = AnomalyDetector()
    
    # Test cases
    test_cases = [
        {
            'name': 'Normal evaluation',
            'ratings': {
                'relevance_subject_knowledge': 4,
                'relevance_practical_skills': 3,
                'org_curriculum': 4,
                'teaching_tlas_useful': 3,
                'assessment_start': 4,
                'environment_classrooms': 3
            }
        },
        {
            'name': 'Straight-lining (all 4s)',
            'ratings': {
                'relevance_subject_knowledge': 4,
                'relevance_practical_skills': 4,
                'org_curriculum': 4,
                'teaching_tlas_useful': 4,
                'assessment_start': 4,
                'environment_classrooms': 4
            }
        },
        {
            'name': 'All minimum ratings',
            'ratings': {
                'relevance_subject_knowledge': 1,
                'relevance_practical_skills': 1,
                'org_curriculum': 1,
                'teaching_tlas_useful': 1,
                'assessment_start': 1,
                'environment_classrooms': 1
            }
        },
        {
            'name': 'Alternating pattern',
            'ratings': {
                'relevance_subject_knowledge': 4,
                'relevance_practical_skills': 1,
                'org_curriculum': 4,
                'teaching_tlas_useful': 1,
                'assessment_start': 4,
                'environment_classrooms': 1
            }
        }
    ]
    
    print("\nAnomaly Detection Test Results:")
    print("=" * 60)
    
    for test in test_cases:
        is_anomaly, score, reason = detector.detect(test['ratings'])
        print(f"\nTest: {test['name']}")
        print(f"Anomaly: {is_anomaly}")
        print(f"Score: {score:.2f}")
        print(f"Reason: {reason}")
