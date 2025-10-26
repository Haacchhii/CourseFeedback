# Course Evaluation Questionnaire System - Documentation

## Overview
This document describes the comprehensive course evaluation questionnaire system integrated into the Course Insight Guardian application. The system has been upgraded from a simple 3-category sentiment analysis (Positive/Neutral/Negative) to a detailed 27-question evaluation framework.

## New Features

### 1. Comprehensive Questionnaire Structure

The evaluation system now uses **6 major categories** with **27 detailed questions**:

#### **Category 1: Course Content and Organization** (4 questions)
- Clarity of learning objectives
- Content organization and structure
- Relevance and currency of materials
- Appropriate difficulty level

#### **Category 2: Instructor Effectiveness** (5 questions)
- Subject matter expertise
- Communication clarity
- Student engagement
- Teaching enthusiasm
- Class preparation

#### **Category 3: Teaching Methods and Learning Resources** (4 questions)
- Variety of teaching methods
- Technology utilization
- Quality of course materials
- Real-world examples and applications

#### **Category 4: Assessment and Feedback** (4 questions)
- Fair assessment practices
- Clear grading criteria
- Timely feedback delivery
- Helpful feedback quality

#### **Category 5: Interaction and Support** (4 questions)
- Instructor accessibility
- Responsiveness to questions
- Respectful interaction
- Encouragement of participation

#### **Category 6: Learning Outcomes and Satisfaction** (5 questions)
- Achievement of learning objectives
- Skill development
- Critical thinking enhancement
- Overall satisfaction
- Course recommendation likelihood

### 2. Enhanced Rating Scale

**5-Point Likert Scale:**
- **1** = Strongly Disagree
- **2** = Disagree
- **3** = Neutral
- **4** = Agree
- **5** = Strongly Agree

### 3. Performance Interpretation

**Rating Ranges:**
- **4.5 - 5.0**: Excellent
- **4.0 - 4.4**: Very Good
- **3.5 - 3.9**: Good
- **3.0 - 3.4**: Satisfactory
- **2.0 - 2.9**: Needs Improvement
- **1.0 - 1.9**: Poor

### 4. Automatic Sentiment Calculation

The system automatically calculates sentiment based on average ratings:
- **Average ≥ 4.0**: Positive
- **Average 3.0 - 3.9**: Neutral
- **Average < 3.0**: Negative

## File Structure

### Core Files Created/Modified

1. **`src/data/questionnaireConfig.js`** (NEW)
   - Contains all 27 questions organized by category
   - Rating scale definitions
   - Helper functions for calculations
   - Sentiment mapping logic

2. **`src/utils/evaluationDataTransformer.js`** (NEW)
   - Transforms legacy data to new format
   - Calculates category averages
   - Prepares data for visualization
   - Performance color/label helpers

3. **`src/components/CategoryMetricsDisplay.jsx`** (NEW)
   - Visual display component for category metrics
   - Bar chart visualization
   - Performance comparison widgets
   - Top/bottom performing areas

4. **`src/pages/student/StudentEvaluation.jsx`** (MODIFIED)
   - Updated to use new 27-question format
   - Improved UI with category sections
   - Interactive rating buttons
   - Real-time feedback

5. **`src/pages/admin/Dashboard.jsx`** (MODIFIED)
   - Integrated category metrics display
   - Shows detailed performance breakdown
   - Highlights areas of excellence and improvement

## Student Experience

### Evaluation Form
Students now see:
1. **Course Information** - Course details displayed prominently
2. **Instructions** - Clear 5-point scale explanation
3. **6 Category Sections** - Questions grouped logically
4. **Visual Rating Buttons** - Easy-to-use interactive interface
5. **Comments Section** - Optional detailed feedback

### User Interface Features
- **Color-coded ratings**: Selected ratings highlighted in LPU red
- **Progressive disclosure**: Questions organized in expandable sections
- **Real-time validation**: Ensures all questions are answered
- **Mobile-friendly**: Responsive design for all devices

## Admin/Department Head Experience

### Dashboard Enhancements

1. **Category Performance Chart**
   - Bar chart showing average rating per category
   - Color-coded by performance level
   - Displays response count per category

2. **Performance Highlights Widget**
   - Top 3 performing categories (green highlight)
   - Bottom 3 areas needing improvement (orange highlight)
   - Quick visual summary of strengths/weaknesses

3. **Detailed Metrics Table**
   - Category-by-category breakdown
   - Average ratings with performance labels
   - Response counts for statistical validity

4. **Category Legend**
   - Shows all 6 categories
   - Number of questions per category
   - Easy reference guide

## Data Visualization

### Chart Types

1. **Bar Chart** - Category Performance
   - X-axis: Category names
   - Y-axis: Average rating (0-5 scale)
   - Color: Performance-based (green to red)

2. **Performance Widgets**
   - Top performers: Green background
   - Needs improvement: Orange background
   - Quick actionable insights

### Color Coding
- **Excellent (≥4.5)**: Dark Green `#10b981`
- **Very Good (≥4.0)**: Lime `#84cc16`
- **Good (≥3.5)**: Amber `#f59e0b`
- **Satisfactory (≥3.0)**: Orange `#fb923c`
- **Needs Improvement (≥2.0)**: Red `#f87171`
- **Poor (<2.0)**: Dark Red `#dc2626`

## Data Structure

### Evaluation Response Object
```javascript
{
  id: 'e1',
  courseId: 'BSIT101',
  studentId: 'student@email.com',
  student: 'Student Name',
  responses: {
    content_clarity: 5,
    content_organization: 4,
    content_relevance: 5,
    // ... (all 27 questions)
  },
  categoryAverages: {
    course_content: { average: 4.5, count: 4 },
    instructor_effectiveness: { average: 4.8, count: 5 },
    // ... (all 6 categories)
  },
  overallAverage: 4.6,
  sentiment: 'positive',
  comments: 'Optional text feedback',
  semester: 'First Semester 2025',
  anomaly: false
}
```

## Backward Compatibility

The system maintains backward compatibility with legacy data:
- Old evaluations with 4 ratings (clarity, usefulness, engagement, organization)
- Automatic mapping to new 27-question structure
- Preserves existing sentiment classifications
- No data loss during transition

### Legacy Data Transformation
The `transformLegacyRatings()` function maps:
- **Clarity** → Content clarity, organization, communication
- **Usefulness** → Content relevance, materials, skill development
- **Engagement** → Instructor engagement, enthusiasm, participation
- **Organization** → Content structure, preparation, methods variety

## Benefits

### For Students
1. **More granular feedback** - Express opinions on specific aspects
2. **Fair evaluation** - Multiple questions reduce bias
3. **Better structure** - Logical organization of questions
4. **Clear scale** - Easy-to-understand rating system

### For Instructors
1. **Actionable insights** - Know exactly what to improve
2. **Category breakdown** - See strengths and weaknesses
3. **Trend analysis** - Track improvements over time
4. **Fair assessment** - Multiple questions provide balanced view

### For Administrators
1. **Data-driven decisions** - Rich analytics for course improvement
2. **Performance tracking** - Monitor teaching quality across programs
3. **Intervention identification** - Quickly spot problem areas
4. **Accreditation support** - Comprehensive evaluation data

## Future Enhancements

### Potential Additions
1. **Custom Questions** - Allow departments to add program-specific questions
2. **Question Banks** - Multiple question sets for different course types
3. **Comparative Analysis** - Compare across semesters/years
4. **Export Capabilities** - Generate PDF reports
5. **Email Notifications** - Alert instructors of completed evaluations
6. **Anonymous vs Named** - Toggle for anonymous evaluations
7. **Multi-language Support** - Questions in multiple languages

## Technical Notes

### Dependencies
- React 18+
- Recharts for visualization
- TailwindCSS for styling
- React Router for navigation

### Performance Considerations
- Efficient category average calculations
- Memoized data transformations
- Optimized chart rendering
- Responsive design patterns

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly interface

## Support and Maintenance

### Updating Questions
To modify questions, edit `src/data/questionnaireConfig.js`:
1. Update question text
2. Maintain question IDs for data consistency
3. Test with existing evaluation data
4. Consider backward compatibility

### Adding Categories
1. Add category to `questionnaireCategories` array
2. Update visualizations if needed
3. Test data transformers
4. Update documentation

## Conclusion

This comprehensive questionnaire system provides a robust framework for course evaluation, replacing the simple 3-category sentiment system with detailed, actionable feedback across 27 specific evaluation criteria. The system maintains the simplicity of sentiment classification while providing rich detailed data for continuous improvement.

---

**Version**: 1.0  
**Last Updated**: October 15, 2025  
**Author**: Course Insight Guardian Development Team
