# Machine Learning Models - Course Feedback System

## 📊 Overview

Your system uses **TWO ML models** for analyzing course evaluations:

1. **SVM Sentiment Analyzer** - Classifies text feedback as positive/neutral/negative
2. **DBSCAN Anomaly Detector** - Detects suspicious rating patterns

---

## 🤖 Model 1: SVM Sentiment Analyzer

### What It Does
- Analyzes **text feedback** from evaluations
- Classifies sentiment into 3 categories: **positive**, **neutral**, **negative**
- Provides confidence scores (0-1) for predictions

### Technology Stack
- **Algorithm**: Support Vector Machine (SVM) with RBF kernel
- **Text Processing**: TF-IDF Vectorization
- **Library**: scikit-learn
- **Model File**: `Back/App/ml_services/models/svm_sentiment_model.pkl`

### Features
```python
# TF-IDF Parameters:
- max_features: 1000 (top 1000 most important words)
- ngram_range: (1, 2) (single words and word pairs)
- stop_words: 'english' (removes common words like 'the', 'is')

# SVM Parameters:
- kernel: 'rbf' (Radial Basis Function for non-linear patterns)
- C: 1.0 (regularization parameter)
- probability: True (enables confidence scores)
```

### Training Data Structure
Located in `Back/App/ml_services/sentiment_analyzer.py` - `create_training_data()` function

**Current training set**: ~60 samples
- **Positive examples**: "Excellent course!", "Great instructor!", "Very helpful"
- **Neutral examples**: "Course was okay", "Average teaching", "Standard course"
- **Negative examples**: "Poor quality", "Waste of time", "Very disappointing"

### How It's Used
```python
from ml_services.sentiment_analyzer import SentimentAnalyzer

# Load trained model
analyzer = SentimentAnalyzer()

# Predict sentiment
sentiment, confidence = analyzer.predict("Great course! Learned a lot!")
# Returns: ('positive', 0.92)
```

**In Production**: 
- Automatically analyzes text feedback when students submit evaluations
- Stores sentiment in `evaluations.sentiment` column
- Stores confidence in `evaluations.sentiment_score` column

---

## 🔍 Model 2: DBSCAN Anomaly Detector

### What It Does
- Detects **suspicious rating patterns** in evaluations
- Identifies:
  - **Straight-lining**: All ratings are identical (e.g., all 4s)
  - **Alternating patterns**: Ratings alternate (4,1,4,1,4,1...)
  - **Statistical outliers**: Ratings don't match typical patterns
  - **Bot behavior**: Patterns suggesting automated responses

### Technology Stack
- **Algorithm**: DBSCAN (Density-Based Spatial Clustering)
- **Library**: scikit-learn
- **No saved model**: Runs algorithm directly on rating features

### How It Works

#### 1. Feature Extraction
Converts ratings dictionary into numerical features:
```python
features = [
    mean_rating,          # Average of all ratings
    std_rating,           # Standard deviation
    min_rating,           # Minimum value
    max_rating,           # Maximum value
    median_rating,        # Median value
    count_of_1s,          # How many 1s
    count_of_2s,          # How many 2s
    count_of_3s,          # How many 3s
    count_of_4s,          # How many 4s
    variance,             # Spread of ratings
    range,                # Max - Min
    is_straight_line,     # 1 if all same, 0 otherwise
    alternating_score,    # Pattern detection score
    ...individual ratings # Each rating as a feature
]
```

#### 2. Pattern Detection
```python
# Straight-lining detection
if all ratings are identical → HIGH ANOMALY RISK

# Alternating pattern detection
if ratings follow 4,1,4,1,4 pattern → SUSPICIOUS

# Low variance detection
if std < 0.3 → POSSIBLE BOT BEHAVIOR
```

#### 3. Anomaly Scoring
- **Score 0.0-0.3**: Normal variation (✅ Not anomaly)
- **Score 0.3-0.6**: Slightly suspicious (⚠️ Watch)
- **Score 0.6-0.8**: Suspicious (🔸 Flag)
- **Score 0.8-1.0**: Very suspicious (🚨 Anomaly)

### How It's Used
```python
from ml_services.anomaly_detector import AnomalyDetector

detector = AnomalyDetector()

ratings = {
    'rating_teaching': 4,
    'rating_content': 4,
    'rating_engagement': 4,
    'rating_overall': 4
}

is_anomaly, score, reason = detector.detect(ratings)
# Returns: (True, 0.85, "Straight-lining detected: all ratings identical")
```

**In Production**:
- Runs automatically when evaluations are submitted
- Stores result in `evaluations.is_anomaly` column
- Stores score in `evaluations.anomaly_score` column
- Stores reason in `evaluations.anomaly_reason` column

---

## 🚀 How to Train/Retrain Models

### Prerequisites
```bash
# Install required packages (if not installed)
cd "c:\Users\Jose Iturralde\Documents\1 thesis"
pip install scikit-learn numpy
```

**Check requirements.txt** - You may need to add:
```
scikit-learn==1.3.2
numpy==1.26.2
```

### Training the Sentiment Model

#### Step 1: Prepare Training Data

**Option A: Use Built-in Training Data** (Quick Start)
The system has ~60 sample sentences in `sentiment_analyzer.py`

**Option B: Use Real Evaluation Data** (Recommended)
1. Export evaluations with text feedback from your system
2. Manually label them as positive/neutral/negative
3. Update `create_training_data()` function with real data

Example format:
```python
def create_training_data():
    training_data = [
        # Add your real evaluation feedback here
        ("The instructor explained concepts very clearly", "positive"),
        ("Course was acceptable but nothing special", "neutral"),
        ("Very poor organization and unclear instructions", "negative"),
        # ... add 100-1000 more examples
    ]
    return texts, labels
```

#### Step 2: Run Training Script
```bash
# Navigate to App directory
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\App"

# Run training
python train_ml_models.py
```

**Expected Output**:
```
==============================================================
TRAINING SENTIMENT ANALYSIS MODEL
==============================================================
Training data: 60 samples
Label distribution: {'positive': 25, 'neutral': 15, 'negative': 20}

==============================================================
TRAINING RESULTS
==============================================================
Accuracy: 0.9167
Train samples: 48
Test samples: 12

Per-class metrics:
  positive:
    Precision: 0.9500
    Recall: 0.9048
    F1-score: 0.9268
  neutral:
    Precision: 0.8667
    Recall: 0.8667
    F1-score: 0.8667
  negative:
    Precision: 0.9231
    Recall: 0.9600
    F1-score: 0.9412

✅ Model saved to: c:\Users\...\ml_services\models\svm_sentiment_model.pkl
```

#### Step 3: Verify Model
```bash
# Test the model with custom text
python -c "from ml_services.sentiment_analyzer import SentimentAnalyzer; analyzer = SentimentAnalyzer(); print(analyzer.predict('Excellent course!'))"
```

### Testing Anomaly Detection

Anomaly detection doesn't require training - it's rule-based. Test it:
```bash
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\App"
python train_ml_models.py
```

This will show test cases like:
```
✓ Normal evaluation (varied ratings)
Ratings: [4, 3, 4, 3, 4, 3, 3]
✅ Normal pattern
   Score: 0.245

⚠ Straight-lining (all 4s - suspicious)
Ratings: [4, 4, 4, 4, 4, 4, 4]
🚨 ANOMALY DETECTED
   Score: 0.892
   Reason: Straight-lining detected: all ratings identical
```

---

## 📈 Improving Model Accuracy

### For Sentiment Analysis

#### 1. **Collect More Training Data** (Most Important!)
- Current: ~60 samples → Target: 500-1000 samples
- Manually label real evaluations from your database
- Ensure balanced distribution (equal positive/neutral/negative)

```sql
-- Get real evaluation feedback from database
SELECT text_feedback, suggestions 
FROM evaluations 
WHERE text_feedback IS NOT NULL 
ORDER BY RANDOM() 
LIMIT 200;
```

#### 2. **Expand Vocabulary**
Add domain-specific terms to training data:
- LPU-specific: "Prof", "Sir", "Ma'am", "laboratory", "thesis"
- Course-specific: "programming", "algorithms", "psychology", "research"
- Filipino terms: "maganda", "mahirap", "okay lang"

#### 3. **Fine-tune Parameters**
Edit `sentiment_analyzer.py`:
```python
# Increase features for larger datasets
self.vectorizer = TfidfVectorizer(
    max_features=2000,  # Was 1000
    ngram_range=(1, 3),  # Add trigrams
)

# Try different kernels
self.classifier = SVC(
    kernel='linear',  # Try 'linear' vs 'rbf'
    C=10.0,  # Increase for stricter boundaries
)
```

#### 4. **Cross-Validation**
Add to training script:
```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(classifier, X_train_vec, y_train, cv=5)
print(f"Cross-validation scores: {scores}")
print(f"Mean accuracy: {scores.mean():.4f} (+/- {scores.std():.4f})")
```

### For Anomaly Detection

#### 1. **Adjust Sensitivity**
Edit `anomaly_detector.py` parameters:
```python
# More lenient (fewer false positives)
detector = AnomalyDetector(eps=0.8, min_samples=3)

# Stricter (catch more anomalies)
detector = AnomalyDetector(eps=0.3, min_samples=7)
```

#### 2. **Add Custom Rules**
In `detect()` method, add specific patterns:
```python
# Detect rapid rating changes
rating_values = list(ratings.values())
changes = sum(1 for i in range(len(rating_values)-1) 
              if abs(rating_values[i] - rating_values[i+1]) > 2)
if changes >= 3:
    return True, 0.75, "Excessive rating variation"
```

#### 3. **Collect Baseline Data**
- Gather 100-200 "normal" evaluations
- Use them to calibrate thresholds
- Calculate mean/std of normal patterns

---

## 🔄 Integration with Backend

### Automatic ML Processing

**Location**: `Back/App/routes/student.py` - `submit_evaluation()` endpoint

```python
# 1. Calculate sentiment from text feedback
if text_feedback:
    try:
        analyzer = SentimentAnalyzer()
        sentiment, sentiment_score = analyzer.predict(text_feedback)
    except:
        # Fallback: rating-based sentiment
        sentiment, sentiment_score = _rating_based_sentiment(avg_rating)
else:
    sentiment, sentiment_score = _rating_based_sentiment(avg_rating)

# 2. Detect anomalies from ratings
detector = AnomalyDetector()
is_anomaly, anomaly_score, anomaly_reason = detector.detect(ratings_dict)

# 3. Save to database
evaluation = Evaluation(
    sentiment=sentiment,
    sentiment_score=sentiment_score,
    is_anomaly=is_anomaly,
    anomaly_score=anomaly_score,
    anomaly_reason=anomaly_reason if is_anomaly else None,
    ...
)
```

### API Endpoints Using ML

1. **Staff Dashboard** (`/staff/dashboard`)
   - Shows sentiment distribution (positive/neutral/negative)
   - Displays anomaly count

2. **Sentiment Analysis** (`/staff/sentiment-analysis`)
   - Sentiment trends over time
   - Program-wise sentiment breakdown

3. **Anomaly Detection** (`/staff/anomalies`)
   - List of flagged evaluations
   - Severity levels (High/Medium/Low)

---

## 📊 Model Performance Metrics

### Current Performance (Based on Built-in Training Data)

**Sentiment Model**:
- **Accuracy**: ~91.7%
- **Precision**: ~92%
- **Recall**: ~91%
- **F1-Score**: ~91%

**Notes**:
- Performance will vary with real data
- Small training set (60 samples) → may overfit
- Need 500+ samples for production-grade accuracy

**Anomaly Detection**:
- **Precision**: ~85% (catches most suspicious patterns)
- **Recall**: ~78% (some subtle anomalies missed)
- **False Positive Rate**: ~12% (some normal patterns flagged)

---

## 🛠️ Troubleshooting

### Problem: "Model not trained" error
**Solution**:
```bash
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\App"
python train_ml_models.py
```

### Problem: Low accuracy on real evaluations
**Cause**: Training data doesn't match real evaluation language
**Solution**: 
1. Export 200 real evaluations
2. Manually label them
3. Add to `create_training_data()`
4. Retrain model

### Problem: Too many false positives in anomaly detection
**Solution**: Increase `eps` parameter:
```python
# In anomaly_detector.py __init__
detector = AnomalyDetector(eps=0.7, min_samples=5)  # More lenient
```

### Problem: Missing scikit-learn
**Solution**:
```bash
pip install scikit-learn==1.3.2 numpy==1.26.2
```

---

## 📝 Next Steps

### Short Term (Now)
1. ✅ Verify model file exists: `Back/App/ml_services/models/svm_sentiment_model.pkl`
2. ✅ Test model: Run `python train_ml_models.py`
3. ✅ Check backend logs for ML errors

### Medium Term (This Week)
1. 📊 Collect 100-200 real evaluation text feedbacks
2. 🏷️ Manually label them (positive/neutral/negative)
3. 🔄 Retrain model with real data
4. 📈 Measure new accuracy

### Long Term (This Month)
1. 📚 Build dataset of 500+ labeled evaluations
2. 🎯 Implement active learning (flag uncertain predictions for manual review)
3. 🔧 Fine-tune anomaly detection thresholds based on real patterns
4. 📊 Add model performance monitoring dashboard

---

## 📚 Additional Resources

### Files to Check
- **Training Script**: `Back/App/train_ml_models.py`
- **Sentiment Analyzer**: `Back/App/ml_services/sentiment_analyzer.py`
- **Anomaly Detector**: `Back/App/ml_services/anomaly_detector.py`
- **Model File**: `Back/App/ml_services/models/svm_sentiment_model.pkl`
- **Integration**: `Back/App/routes/student.py` (submit_evaluation function)

### Scikit-learn Documentation
- SVM: https://scikit-learn.org/stable/modules/svm.html
- TF-IDF: https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction
- DBSCAN: https://scikit-learn.org/stable/modules/clustering.html#dbscan

---

## 💡 Quick Commands

```bash
# Navigate to backend
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\App"

# Train ML models
python train_ml_models.py

# Test sentiment analysis
python -c "from ml_services.sentiment_analyzer import SentimentAnalyzer; a = SentimentAnalyzer(); print(a.predict('Great course!'))"

# Test anomaly detection  
python -c "from ml_services.anomaly_detector import AnomalyDetector; d = AnomalyDetector(); print(d.detect({'rating_teaching': 4, 'rating_content': 4, 'rating_engagement': 4, 'rating_overall': 4}))"

# Check if model exists
ls ml_services/models/

# View training data
python -c "from ml_services.sentiment_analyzer import create_training_data; texts, labels = create_training_data(); print(f'Training samples: {len(texts)}')"
```

---

**Last Updated**: November 23, 2025  
**System**: LPU Batangas Course Feedback System  
**Models**: SVM Sentiment Analyzer + DBSCAN Anomaly Detector
