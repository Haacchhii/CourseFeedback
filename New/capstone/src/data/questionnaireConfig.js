/**
 * Course Evaluation Questionnaire Configuration
 * Based on standard academic course evaluation frameworks
 * 
 * Rating Scale: 1-4 (Likert Scale)
 * 1 = Strongly Disagree
 * 2 = Disagree
 * 3 = Agree
 * 4 = Strongly Agree
 */

export const questionnaireCategories = [
  {
    id: 'course_content',
    name: 'Course Content and Organization',
    description: 'Evaluation of the course structure, materials, and relevance',
    questions: [
      {
        id: 'content_clarity',
        text: 'The course objectives and learning outcomes were clearly defined',
        shortLabel: 'Clarity of Objectives'
      },
      {
        id: 'content_organization',
        text: 'The course content was well-organized and logically structured',
        shortLabel: 'Content Organization'
      },
      {
        id: 'content_relevance',
        text: 'The course content was relevant and up-to-date',
        shortLabel: 'Content Relevance'
      },
      {
        id: 'content_difficulty',
        text: 'The difficulty level of the course was appropriate for my level',
        shortLabel: 'Appropriate Difficulty'
      }
    ]
  },
  {
    id: 'instructor_effectiveness',
    name: 'Instructor Effectiveness',
    description: 'Evaluation of teaching methods and instructor performance',
    questions: [
      {
        id: 'instructor_knowledge',
        text: 'The instructor demonstrated thorough knowledge of the subject matter',
        shortLabel: 'Subject Expertise'
      },
      {
        id: 'instructor_communication',
        text: 'The instructor communicated concepts clearly and effectively',
        shortLabel: 'Clear Communication'
      },
      {
        id: 'instructor_engagement',
        text: 'The instructor made the course engaging and interesting',
        shortLabel: 'Student Engagement'
      },
      {
        id: 'instructor_enthusiasm',
        text: 'The instructor showed enthusiasm for the subject matter',
        shortLabel: 'Instructor Enthusiasm'
      },
      {
        id: 'instructor_prepared',
        text: 'The instructor was well-prepared for each class session',
        shortLabel: 'Class Preparation'
      }
    ]
  },
  {
    id: 'teaching_methods',
    name: 'Teaching Methods and Learning Resources',
    description: 'Evaluation of instructional strategies and materials',
    questions: [
      {
        id: 'methods_variety',
        text: 'A variety of teaching methods were used to facilitate learning',
        shortLabel: 'Variety of Methods'
      },
      {
        id: 'methods_technology',
        text: 'Technology and multimedia resources were effectively utilized',
        shortLabel: 'Technology Use'
      },
      {
        id: 'methods_materials',
        text: 'Course materials (textbooks, handouts, slides) were helpful',
        shortLabel: 'Quality of Materials'
      },
      {
        id: 'methods_examples',
        text: 'Real-world examples and applications were provided',
        shortLabel: 'Practical Examples'
      }
    ]
  },
  {
    id: 'assessment_feedback',
    name: 'Assessment and Feedback',
    description: 'Evaluation of grading, feedback, and learning assessment',
    questions: [
      {
        id: 'assessment_fair',
        text: 'Assignments and exams fairly assessed my understanding',
        shortLabel: 'Fair Assessment'
      },
      {
        id: 'assessment_criteria',
        text: 'Grading criteria were clearly communicated',
        shortLabel: 'Clear Grading Criteria'
      },
      {
        id: 'feedback_timely',
        text: 'Feedback on assignments was provided in a timely manner',
        shortLabel: 'Timely Feedback'
      },
      {
        id: 'feedback_helpful',
        text: 'Feedback helped me improve my understanding and performance',
        shortLabel: 'Helpful Feedback'
      }
    ]
  },
  {
    id: 'interaction_support',
    name: 'Interaction and Support',
    description: 'Evaluation of instructor availability and student support',
    questions: [
      {
        id: 'interaction_accessible',
        text: 'The instructor was accessible and available for questions',
        shortLabel: 'Instructor Accessibility'
      },
      {
        id: 'interaction_responsive',
        text: 'The instructor responded to student questions and concerns',
        shortLabel: 'Responsiveness'
      },
      {
        id: 'interaction_respectful',
        text: 'The instructor treated students with respect',
        shortLabel: 'Respectful Interaction'
      },
      {
        id: 'interaction_participation',
        text: 'The instructor encouraged student participation and discussion',
        shortLabel: 'Encourages Participation'
      }
    ]
  },
  {
    id: 'learning_outcomes',
    name: 'Learning Outcomes and Overall Satisfaction',
    description: 'Evaluation of learning achievement and course satisfaction',
    questions: [
      {
        id: 'outcomes_objectives',
        text: 'I achieved the learning objectives of this course',
        shortLabel: 'Achieved Objectives'
      },
      {
        id: 'outcomes_skills',
        text: 'This course helped me develop new skills and knowledge',
        shortLabel: 'Skill Development'
      },
      {
        id: 'outcomes_thinking',
        text: 'This course enhanced my critical thinking abilities',
        shortLabel: 'Critical Thinking'
      },
      {
        id: 'outcomes_satisfaction',
        text: 'Overall, I am satisfied with this course',
        shortLabel: 'Overall Satisfaction'
      },
      {
        id: 'outcomes_recommend',
        text: 'I would recommend this course to other students',
        shortLabel: 'Would Recommend'
      }
    ]
  }
]

// Rating scale labels
export const ratingScale = [
  { value: 1, label: 'Strongly Disagree', color: 'red', sentiment: 'negative' },
  { value: 2, label: 'Disagree', color: 'orange', sentiment: 'negative' },
  { value: 3, label: 'Agree', color: 'lightgreen', sentiment: 'positive' },
  { value: 4, label: 'Strongly Agree', color: 'green', sentiment: 'positive' }
]

// Helper function to calculate sentiment from average rating
export const calculateSentiment = (avgRating) => {
  if (avgRating >= 3.5) return 'positive'
  if (avgRating >= 2.5) return 'neutral'
  return 'negative'
}

// Helper function to calculate category averages
export const calculateCategoryAverages = (responses) => {
  const categoryAverages = {}
  
  questionnaireCategories.forEach(category => {
    const categoryQuestions = category.questions.map(q => q.id)
    const categoryRatings = categoryQuestions
      .map(qId => responses[qId])
      .filter(rating => rating !== undefined && rating !== null)
    
    if (categoryRatings.length > 0) {
      categoryAverages[category.id] = {
        average: (categoryRatings.reduce((a, b) => a + b, 0) / categoryRatings.length).toFixed(2),
        name: category.name,
        count: categoryRatings.length
      }
    }
  })
  
  return categoryAverages
}

// Helper function to calculate overall average
export const calculateOverallAverage = (responses) => {
  const allRatings = Object.values(responses).filter(rating => 
    rating !== undefined && rating !== null && typeof rating === 'number'
  )
  
  if (allRatings.length === 0) return 0
  
  return (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
}

// Helper function to get all question IDs
export const getAllQuestionIds = () => {
  return questionnaireCategories.flatMap(category => 
    category.questions.map(q => q.id)
  )
}

// Helper function to initialize empty responses
export const initializeEmptyResponses = () => {
  const responses = {}
  questionnaireCategories.forEach(category => {
    category.questions.forEach(question => {
      responses[question.id] = 5 // Default to 5 (Strongly Agree)
    })
  })
  return responses
}

// Performance interpretation
export const getPerformanceLabel = (avgRating) => {
  if (avgRating >= 4.5) return { label: 'Excellent', color: 'green' }
  if (avgRating >= 4.0) return { label: 'Very Good', color: 'lightgreen' }
  if (avgRating >= 3.5) return { label: 'Good', color: 'yellow' }
  if (avgRating >= 3.0) return { label: 'Satisfactory', color: 'orange' }
  if (avgRating >= 2.0) return { label: 'Needs Improvement', color: 'red' }
  return { label: 'Poor', color: 'darkred' }
}

export default questionnaireCategories
