"""
SVM Sentiment Analyzer for Course Evaluations
Uses TF-IDF vectorization and Support Vector Machine classification
"""

import pickle
import numpy as np
from pathlib import Path
from typing import Dict, Tuple
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """
    SVM-based sentiment analyzer for course evaluation text feedback
    
    Features:
    - TF-IDF text vectorization
    - RBF kernel SVM classifier
    - Confidence score calculation
    - Model persistence (save/load)
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize sentiment analyzer
        
        Args:
            model_path: Path to saved model file. If None, creates new model.
        """
        self.model_dir = Path(__file__).parent / "models"
        self.model_dir.mkdir(exist_ok=True)
        
        if model_path:
            self.load_model(model_path)
        else:
            # Initialize with default parameters
            self.vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),  # Unigrams and bigrams
                min_df=2,
                max_df=0.8,
                stop_words='english'
            )
            
            self.classifier = SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True,  # Enable probability estimates
                random_state=42
            )
            
            self.is_trained = False
    
    def train(self, texts: list, labels: list, test_size: float = 0.2) -> Dict:
        """
        Train the SVM classifier on labeled data
        
        Args:
            texts: List of text feedback strings
            labels: List of sentiment labels ('positive', 'neutral', 'negative')
            test_size: Proportion of data for testing
            
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training sentiment analyzer on {len(texts)} samples...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=test_size, random_state=42, stratify=labels
        )
        
        # Vectorize text
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        # Train classifier
        self.classifier.fit(X_train_vec, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.classifier.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        logger.info(f"Training complete. Accuracy: {accuracy:.4f}")
        
        return {
            'accuracy': accuracy,
            'report': report,
            'train_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    def predict(self, text: str) -> Tuple[str, float]:
        """
        Predict sentiment for a single text
        
        Args:
            text: Text feedback to analyze
            
        Returns:
            Tuple of (sentiment_label, confidence_score)
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Train the model or load a trained model first.")
        
        if not text or not text.strip():
            # Return neutral for empty text
            return 'neutral', 0.5
        
        # Vectorize
        text_vec = self.vectorizer.transform([text])
        
        # Predict
        sentiment = self.classifier.predict(text_vec)[0]
        probabilities = self.classifier.predict_proba(text_vec)[0]
        
        # Get confidence (probability of predicted class)
        class_idx = list(self.classifier.classes_).index(sentiment)
        confidence = probabilities[class_idx]
        
        return sentiment, float(confidence)
    
    def predict_batch(self, texts: list) -> list:
        """
        Predict sentiment for multiple texts
        
        Args:
            texts: List of text feedback strings
            
        Returns:
            List of tuples (sentiment, confidence)
        """
        if not self.is_trained:
            raise ValueError("Model not trained.")
        
        results = []
        for text in texts:
            try:
                sentiment, confidence = self.predict(text)
                results.append((sentiment, confidence))
            except Exception as e:
                logger.error(f"Error predicting sentiment: {e}")
                results.append(('neutral', 0.5))
        
        return results
    
    def save_model(self, filename: str = "svm_sentiment_model.pkl"):
        """
        Save trained model to disk
        
        Args:
            filename: Name of the file to save
        """
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        model_path = self.model_dir / filename
        
        model_data = {
            'vectorizer': self.vectorizer,
            'classifier': self.classifier,
            'is_trained': self.is_trained
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {model_path}")
        return str(model_path)
    
    def load_model(self, path: str):
        """
        Load trained model from disk
        
        Args:
            path: Path to the saved model file
        """
        model_path = Path(path)
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")
        
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.vectorizer = model_data['vectorizer']
        self.classifier = model_data['classifier']
        self.is_trained = model_data['is_trained']
        
        logger.info(f"Model loaded from {model_path}")
    
    def get_feature_importance(self, top_n: int = 20) -> Dict[str, list]:
        """
        Get most important features (words) for each sentiment class
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            Dictionary with top features per class
        """
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Get coefficients for each class
        importance_dict = {}
        
        for i, class_name in enumerate(self.classifier.classes_):
            if hasattr(self.classifier, 'coef_'):
                # For linear kernels
                coef = self.classifier.coef_[i]
            else:
                # For non-linear kernels, use feature importance approximation
                continue
            
            # Get top positive and negative features
            top_positive_idx = np.argsort(coef)[-top_n:][::-1]
            top_negative_idx = np.argsort(coef)[:top_n]
            
            importance_dict[class_name] = {
                'positive_features': [(feature_names[idx], coef[idx]) for idx in top_positive_idx],
                'negative_features': [(feature_names[idx], coef[idx]) for idx in top_negative_idx]
            }
        
        return importance_dict


def create_training_data() -> Tuple[list, list]:
    """
    Create initial training data for sentiment analysis
    This is a starter dataset - should be expanded with real evaluation data
    
    Returns:
        Tuple of (texts, labels)
    """
    training_data = [
        # Positive feedback
        ("Excellent course! The instructor was very knowledgeable and engaging.", "positive"),
        ("Great learning experience. Well organized content and helpful materials.", "positive"),
        ("Outstanding teaching methods. I learned so much from this course.", "positive"),
        ("The professor made complex topics easy to understand. Highly recommended!", "positive"),
        ("Very satisfied with the course structure and teaching quality.", "positive"),
        ("Fantastic instructor who really cares about student learning.", "positive"),
        ("The course exceeded my expectations. Very well done!", "positive"),
        ("Clear explanations and practical examples made learning enjoyable.", "positive"),
        ("Best course I've taken. The instructor was always available to help.", "positive"),
        ("Thorough coverage of topics with excellent teaching techniques.", "positive"),
        ("Really enjoyed this course. The materials were comprehensive and useful.", "positive"),
        ("Great feedback on assignments and very supportive instructor.", "positive"),
        ("The course was challenging but rewarding. Learned valuable skills.", "positive"),
        ("Excellent organization and clear learning outcomes.", "positive"),
        ("Very interactive and engaging teaching methods.", "positive"),
        
        # Neutral feedback
        ("The course was okay. Some parts were interesting, others not so much.", "neutral"),
        ("Average teaching. Nothing particularly good or bad.", "neutral"),
        ("The content was decent but could be improved.", "neutral"),
        ("It was a standard course with normal teaching methods.", "neutral"),
        ("Some topics were covered well, others needed more depth.", "neutral"),
        ("The course met basic expectations.", "neutral"),
        ("Acceptable learning experience overall.", "neutral"),
        ("The materials were adequate but nothing special.", "neutral"),
        ("Fair amount of content covered during the semester.", "neutral"),
        ("The assessment methods were reasonable.", "neutral"),
        ("Standard course structure with typical assignments.", "neutral"),
        ("The teaching was satisfactory but not exceptional.", "neutral"),
        ("Average interaction with the instructor.", "neutral"),
        ("The course fulfilled its requirements.", "neutral"),
        ("Neither particularly impressed nor disappointed.", "neutral"),
        
        # Negative feedback
        ("Poor teaching quality. Very disappointed with this course.", "negative"),
        ("The instructor was unprepared and disorganized.", "negative"),
        ("Terrible course structure. Nothing made sense.", "negative"),
        ("Waste of time. Learned very little from this course.", "negative"),
        ("The teaching methods were outdated and ineffective.", "negative"),
        ("Very poor communication from the instructor.", "negative"),
        ("Unsatisfactory experience. Would not recommend.", "negative"),
        ("The course was badly organized with unclear objectives.", "negative"),
        ("Disappointing. The content was irrelevant and poorly delivered.", "negative"),
        ("No feedback on assignments and poor availability.", "negative"),
        ("The instructor seemed uninterested in teaching.", "negative"),
        ("Horrible experience. The course needs major improvements.", "negative"),
        ("Very confusing lectures with no clear explanations.", "negative"),
        ("The materials were outdated and not helpful.", "negative"),
        ("Poor assessment methods that didn't test actual learning.", "negative"),
    ]
    
    texts = [text for text, _ in training_data]
    labels = [label for _, label in training_data]
    
    return texts, labels


if __name__ == "__main__":
    # Example usage and initial model training
    logging.basicConfig(level=logging.INFO)
    
    # Create analyzer
    analyzer = SentimentAnalyzer()
    
    # Get training data
    texts, labels = create_training_data()
    
    # Train model
    metrics = analyzer.train(texts, labels)
    print(f"\nTraining Metrics:")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Train samples: {metrics['train_samples']}")
    print(f"Test samples: {metrics['test_samples']}")
    
    # Save model
    model_path = analyzer.save_model()
    print(f"\nModel saved to: {model_path}")
    
    # Test predictions
    test_texts = [
        "This course was amazing! The instructor was excellent.",
        "The course was okay, nothing special.",
        "Terrible experience, very poor teaching."
    ]
    
    print("\nTest Predictions:")
    for text in test_texts:
        sentiment, confidence = analyzer.predict(text)
        print(f"Text: {text}")
        print(f"Sentiment: {sentiment} (confidence: {confidence:.4f})\n")
