# LPU Batangas Course Evaluation Form Structure

## Overview
This document outlines the exact structure of the course evaluation questionnaire implemented in the system, based on the official LPU Batangas Course Evaluation Form.

**Total Questions**: 31  
**Categories**: 6  
**Rating Scale**: 1-4 (Strongly Disagree → Strongly Agree)

---

## Category Breakdown

### I. Relevance of Course (6 questions)
Evaluates how the course contributed to various skill developments.

1. `relevance_subject_knowledge` - The course helped me to develop relevant subject knowledge
2. `relevance_practical_skills` - The course helped me to develop related practical skills
3. `relevance_team_work` - The course helped me to develop team work
4. `relevance_leadership` - The course helped me to develop leadership skills
5. `relevance_communication` - The course helped me to develop communication skills
6. `relevance_positive_attitude` - The course helped me to develop positive attitude on my program of study

---

### II. Course Organization and ILOs (5 questions)
Evaluates course structure and Intended Learning Outcomes clarity.

7. `org_curriculum` - The course was implemented according to the approved curriculum
8. `org_ilos_known` - Intended Learning Outcomes (ILOs) of the course were made known from the beginning
9. `org_ilos_clear` - Targeted Learning Outcomes (ILOs) of the course were clear
10. `org_ilos_relevant` - Intended Learning Outcomes (ILOs) of the course were relevant
11. `org_no_overlapping` - There were no overlapping of contents within a course

---

### III. Teaching - Learning (7 questions)
Evaluates teaching methods, learning activities, and instructor engagement.

12. `teaching_tlas_useful` - Teaching - Learning Activities (TLAs) such as practical, educational tour etc. were useful and relevant
13. `teaching_ila_useful` - Independent Learning (ILA) activities such as journal reading, research work, project, etc. were useful and relevant
14. `teaching_tlas_sequenced` - The TLAs within a course were sequenced in a logical manner
15. `teaching_applicable` - Team teaching is done as applicable
16. `teaching_motivated` - The teachers motivated the students to learn
17. `teaching_team_work` - The teachers provided adequate opportunities for team work
18. `teaching_independent` - The teachers provided adequate opportunities for independent learning

---

### IV. Assessment (6 questions)
Evaluates assessment methods, distribution, and feedback quality.

19. `assessment_start` - Assessments tasks were held at the beginning of the course
20. `assessment_all_topics` - Assessments covered all the main topics taught in the course
21. `assessment_number` - The number of assessments was appropriate and adequate
22. `assessment_distribution` - Distribution of assessments over a semester was appropriate
23. `assessment_allocation` - Allocation of marks/grade among assessments was satisfactory
24. `assessment_feedback` - The teachers provided timely feedback on student performance

---

### V. Learning Environment (6 questions)
Evaluates facilities, resources, and learning infrastructure.

25. `environment_classrooms` - Available facilities in the classrooms were satisfactory
26. `environment_library` - Available library facilities were adequate
27. `environment_laboratory` - Available laboratory facilities were adequate
28. `environment_computer` - Access to computer facilities were sufficient
29. `environment_internet` - There was sufficient access to internet and electronic databases
30. `environment_facilities_availability` - Availability of facilities for learning was satisfactory

---

### VI. Counseling (1 question)
Evaluates instructor availability for consultation.

31. `counseling_available` - The teachers were available for consultation whenever needed

---

## Rating Scale

| Value | Label | Sentiment |
|-------|-------|-----------|
| 4 | Strongly Agree | Positive |
| 3 | Agree | Positive |
| 2 | Disagree | Negative |
| 1 | Strongly Disagree | Negative |

---

## Database Storage Format

### JSONB Structure
```json
{
  "relevance_subject_knowledge": 4,
  "relevance_practical_skills": 4,
  "relevance_team_work": 3,
  "relevance_leadership": 3,
  "relevance_communication": 4,
  "relevance_positive_attitude": 4,
  "org_curriculum": 4,
  "org_ilos_known": 3,
  "org_ilos_clear": 4,
  "org_ilos_relevant": 4,
  "org_no_overlapping": 3,
  "teaching_tlas_useful": 4,
  "teaching_ila_useful": 4,
  "teaching_tlas_sequenced": 3,
  "teaching_applicable": 3,
  "teaching_motivated": 4,
  "teaching_team_work": 3,
  "teaching_independent": 4,
  "assessment_start": 3,
  "assessment_all_topics": 4,
  "assessment_number": 3,
  "assessment_distribution": 4,
  "assessment_allocation": 4,
  "assessment_feedback": 3,
  "environment_classrooms": 4,
  "environment_library": 3,
  "environment_laboratory": 3,
  "environment_computer": 4,
  "environment_internet": 4,
  "environment_facilities_availability": 3,
  "counseling_available": 4
}
```

---

## Category Averages Calculation

The system automatically calculates:
1. **Per-Category Average** - Average of all questions within a category
2. **Overall Average** - Average of all 31 questions
3. **Sentiment** - Derived from overall average:
   - Average ≥ 3.5 → Positive
   - 2.5 ≤ Average < 3.5 → Neutral
   - Average < 2.5 → Negative

### Example Calculation
```javascript
// Category: Relevance of Course (6 questions)
// Ratings: [4, 4, 3, 3, 4, 4]
categoryAverage = (4+4+3+3+4+4) / 6 = 3.67

// Overall (31 questions)
// Sum of all ratings: 110
overallAverage = 110 / 31 = 3.55
sentiment = "positive" // Since 3.55 ≥ 3.5
```

---

## Frontend Implementation

### Component Structure
```jsx
<EvaluateCourse>
  <ProgressBar totalQuestions={31} answered={answeredCount} />
  
  <CategoryTabs>
    <Tab name="I. Relevance" progress="4/6" />
    <Tab name="II. Organization" progress="3/5" />
    <Tab name="III. Teaching" progress="5/7" />
    <Tab name="IV. Assessment" progress="4/6" />
    <Tab name="V. Environment" progress="6/6" />
    <Tab name="VI. Counseling" progress="1/1" />
  </CategoryTabs>
  
  <QuestionList category={currentCategory}>
    {questions.map(q => 
      <RatingQuestion 
        id={q.id} 
        text={q.text}
        value={responses[q.id]}
        scale={[1,2,3,4]}
      />
    )}
  </QuestionList>
  
  <Navigation>
    <PreviousButton />
    <NextButton /> or <SubmitButton />
  </Navigation>
</EvaluateCourse>
```

---

## ML Analysis Features

### 1. Multi-Dimensional Feature Vector
Each evaluation provides a **31-dimensional feature vector** for analysis:
```python
feature_vector = [
    rating_1, rating_2, ..., rating_31,  # 31 numerical features
    text_feedback,                        # 1 text feature
    avg_rating,                           # 1 derived feature
    category_avg_1, ..., category_avg_6   # 6 category features
]
```

### 2. Category-Based Insights
```python
# Analyze by category
categories = {
    'relevance': [1, 2, 3, 4, 5, 6],        # Questions 1-6
    'organization': [7, 8, 9, 10, 11],      # Questions 7-11
    'teaching': [12, 13, 14, 15, 16, 17, 18], # Questions 12-18
    'assessment': [19, 20, 21, 22, 23, 24],   # Questions 19-24
    'environment': [25, 26, 27, 28, 29, 30],  # Questions 25-30
    'counseling': [31]                        # Question 31
}
```

### 3. Anomaly Detection Patterns
DBSCAN can identify:
- **Straight-lining**: All ratings identical (e.g., all 4s)
- **Category inconsistency**: High teaching but low assessment scores
- **Response patterns**: Alternating ratings (4,1,4,1...)
- **Speed-based**: Metadata shows completion time < 30 seconds

### 4. Sentiment Analysis Enhancement
```python
# Combine text + ratings for better sentiment prediction
features = {
    'text_tfidf': vectorizer.transform([text_feedback]),
    'avg_rating': overall_avg,
    'category_variances': [var(cat) for cat in categories],
    'extreme_count': count_of_1s_and_4s
}

sentiment = svm_classifier.predict(features)
confidence = svm_classifier.predict_proba(features)
```

---

## Quality Metrics

### Completion Metrics
- **Full Completion Rate**: % of students who answer all 31 questions
- **Category Completion**: Track which categories have highest abandonment
- **Average Time per Question**: Identify rushed submissions

### Response Quality
- **Variance per Category**: Low variance may indicate disengagement
- **Response Distribution**: Check if ratings cluster around middle (2-3)
- **Text Feedback Correlation**: Does text sentiment match rating sentiment?

### Institutional Insights
- **Weakest Category**: Identify areas needing improvement
- **Instructor Comparison**: Compare same course across different instructors
- **Trend Analysis**: Track improvements over multiple semesters

---

## API Endpoints

### Submit Evaluation
```
POST /api/student/evaluate
```

**Request Body**:
```json
{
  "student_id": 1,
  "class_section_id": 5,
  "ratings": {
    "relevance_subject_knowledge": 4,
    "relevance_practical_skills": 4,
    // ... all 31 questions
    "counseling_available": 4
  },
  "comment": "Text feedback here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Evaluation submitted successfully",
  "data": {
    "average_rating": 3.68,
    "sentiment": "positive",
    "sentiment_score": 0.872,
    "total_questions": 31,
    "category_averages": {
      "relevance_of_course": 3.67,
      "course_organization": 3.60,
      "teaching_learning": 3.71,
      "assessment": 3.50,
      "learning_environment": 3.67,
      "counseling": 4.00
    }
  }
}
```

---

## Testing Checklist

- [ ] All 31 questions load correctly
- [ ] Each category shows correct question count (6,5,7,6,6,1)
- [ ] Progress bar updates as questions are answered
- [ ] Cannot submit until all questions + comment completed
- [ ] Ratings stored in JSONB format in database
- [ ] Category averages calculated correctly
- [ ] Overall sentiment determined accurately
- [ ] Metadata tracks submission details
- [ ] Previous/Next navigation works smoothly
- [ ] Submit button only appears on last category

---

## Alignment with LPU Standards

This implementation follows the official LPU Batangas Course Evaluation Form structure, ensuring:
- ✅ Institutional compliance
- ✅ Standardized metrics across departments
- ✅ Comparable data for quality assurance
- ✅ Integration with existing administrative processes
- ✅ Support for accreditation requirements

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Based On**: LPU Batangas Official Course Evaluation Form
