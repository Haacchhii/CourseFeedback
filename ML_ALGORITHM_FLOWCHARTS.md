# ML Algorithm Flowcharts - Course Feedback System

## SVM Sentiment Analysis Flowchart

```mermaid
flowchart TD
    Start([Start]) --> CollectData[Collect Evaluation Comments from Database]
    CollectData --> Preprocess[Preprocess Text: Tokenization, Lowercase, Remove Special Characters]
    Preprocess --> TF_IDF[Apply TF-IDF Vectorization: max_features=1000, ngrams=1-2]
    TF_IDF --> Split[Split Data: 80% Training, 20% Testing]
    Split --> SelectKernel[Select SVM Kernel: RBF kernel, C=1.0, gamma=scale]
    SelectKernel --> ConnectorA((A))
        
    ConnectorA((A)) --> TrainModel[Train SVM Model on Training Data]
    TrainModel --> Optimize[Find Optimal Hyperplane: Maximize Margin]
    Optimize --> Probability[Enable Probability Estimates: probability=True]
    Probability --> Evaluate[Evaluate Performance on Test Data]
    Evaluate --> CheckAccuracy{Accuracy > 70%?}
    CheckAccuracy -->|No| AdjustParams[Adjust Parameters: C, gamma, ngrams]
    AdjustParams --> TrainModel
    CheckAccuracy -->|Yes| SaveModel[Save Trained Model to models/ directory]
    SaveModel --> EndTrain([End Training])
    
    StartPredict([Start Prediction]) --> LoadModel[Load Trained SVM Model]
    LoadModel --> NewComment[Receive New Evaluation Comment]
    NewComment --> PreprocComment[Preprocess: Tokenization, TF-IDF Transform]
    PreprocComment --> Classify[SVM Classification: Predict Sentiment]
    Classify --> GetProba[Calculate Confidence: predict_proba]
    GetProba --> AssignSentiment[Assign Sentiment Label: Positive/Neutral/Negative]
    AssignSentiment --> StoreDB[Store Sentiment + Confidence in Database]
    StoreDB --> EndPredict([End Prediction])
```

---

## DBSCAN Anomaly Detection Flowchart

```mermaid
flowchart TD
    Start([Start]) --> CollectRatings[Collect Evaluation Ratings from Database]
    CollectRatings --> ExtractFeatures[Extract Features from Ratings]
    ExtractFeatures --> CalcStats[Calculate Statistics: Mean, Std, Min, Max, Median]
    CalcStats --> CountDist[Count Rating Distribution: 1s, 2s, 3s, 4s, 5s]
    CountDist --> DetectPatterns[Detect Patterns: Straight-lining, Alternating]
    DetectPatterns --> BuildVector[Build Feature Vector: 13+ features per evaluation]
    BuildVector --> Normalize[Normalize Features: StandardScaler fit_transform]
    
    Normalize --> SetParams[Set DBSCAN Parameters: eps=0.5, min_samples=5]
    SetParams --> Cluster[Apply DBSCAN Clustering Algorithm]
    Cluster --> IdentifyCore[Identify Core Points: density ≥ min_samples]
    IdentifyCore --> FormClusters[Form Clusters: Connect nearby core points]
    FormClusters --> MarkNoise[Mark Noise Points: label = -1]
    
    MarkNoise --> ConnectorB((B))
    ConnectorB((B)) --> Analyze[Analyze Clustering Results]
    Analyze --> CalcScore[Calculate Anomaly Score: 0.0 to 1.0]
    CalcScore --> CheckThreshold{Anomaly Score > 0.7?}
    CheckThreshold -->|Yes| FlagAnomalous[Flag as Anomalous: Store in Database]
    CheckThreshold -->|No| MarkNormal[Mark as Normal Evaluation]
    
    FlagAnomalous --> CheckType{Check Anomaly Type}
    CheckType -->|Straight-line| TypeStraight[Type: STRAIGHT_LINE - All same ratings]
    CheckType -->|Alternating| TypeAlternating[Type: ALTERNATING - Pattern detected]
    CheckType -->|Statistical| TypeStat[Type: STATISTICAL_OUTLIER - Unusual values]
    
    TypeStraight --> StoreResult[Store Anomaly Details in Database]
    TypeAlternating --> StoreResult
    TypeStat --> StoreResult
    MarkNormal --> StoreResult
    
    StoreResult --> NotifyAdmin{Anomaly Score > 0.8?}
    NotifyAdmin -->|Yes| SendAlert[Send Alert to Admin Dashboard]
    NotifyAdmin -->|No| LogOnly[Log in Audit Trail]
    SendAlert --> End([End])
    LogOnly --> End
```

---

## Feature Extraction for DBSCAN

**Features Extracted (13+ per evaluation):**
1. Mean rating (average of all ratings)
2. Standard deviation (spread of ratings)
3. Minimum rating
4. Maximum rating
5. Median rating
6. Count of rating value 1
7. Count of rating value 2
8. Count of rating value 3
9. Count of rating value 4
10. Count of rating value 5
11. Variance (rating spread)
12. Range (max - min)
13. Straight-lining indicator (1.0 if all same, 0.0 otherwise)
14. Alternating pattern score (0.0 to 1.0)
15+ Individual rating values for each question

---

## SVM Text Preprocessing Steps

**TF-IDF Vectorization:**
- Maximum features: 1000 most important terms
- N-grams: Unigrams (1-word) and Bigrams (2-word phrases)
- Min document frequency: 2 (term must appear in at least 2 documents)
- Max document frequency: 0.8 (ignore terms in >80% of documents)
- Stop words: Remove common English words (the, is, at, etc.)

**Example:**
- Input: "Prof. Garcia is excellent! Very engaging lectures."
- After preprocessing: "prof garcia excellent engaging lecture"
- TF-IDF vector: [0.45, 0.23, 0.67, 0.12, ...] (1000 dimensions)

---

## Key Differences from Reference Flowchart

**Our SVM Implementation:**
- Uses TF-IDF instead of generic preprocessing
- Includes probability estimation for confidence scores
- Auto-saves models for reuse
- 3-class classification (positive/neutral/negative) vs binary

**Our DBSCAN Implementation:**
- Extracts 13+ features (vs simpler approach)
- Includes pattern detection (straight-lining, alternating)
- Calculates continuous anomaly scores (0.0-1.0)
- Auto-categorizes anomaly types
- Integrates with admin alerting system

