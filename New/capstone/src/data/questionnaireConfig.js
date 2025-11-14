/**
 * Course Evaluation Questionnaire Configuration
 * Based on LPU Batangas Course Evaluation Form
 * 
 * Rating Scale: 1-4 (Likert Scale)
 * 4 = Strongly Agree
 * 3 = Agree
 * 2 = Disagree
 * 1 = Strongly Disagree
 */

export const questionnaireCategories = [
  {
    id: 'relevance_of_course',
    name: 'I. Relevance of Course',
    description: 'Evaluation of course relevance to skills and knowledge development',
    questions: [
      {
        id: 'relevance_subject_knowledge',
        text: 'The course helped me to develop relevant subject knowledge',
        shortLabel: 'Subject Knowledge'
      },
      {
        id: 'relevance_practical_skills',
        text: 'The course helped me to develop related practical skills',
        shortLabel: 'Practical Skills'
      },
      {
        id: 'relevance_team_work',
        text: 'The course helped me to develop team work',
        shortLabel: 'Team Work'
      },
      {
        id: 'relevance_leadership',
        text: 'The course helped me to develop leadership skills',
        shortLabel: 'Leadership Skills'
      },
      {
        id: 'relevance_communication',
        text: 'The course helped me to develop communication skills',
        shortLabel: 'Communication Skills'
      },
      {
        id: 'relevance_positive_attitude',
        text: 'The course helped me to develop positive attitude on my program of study',
        shortLabel: 'Positive Attitude'
      }
    ]
  },
  {
    id: 'course_organization',
    name: 'II. Course Organization and ILOs',
    description: 'Evaluation of course structure and learning outcomes',
    questions: [
      {
        id: 'org_curriculum',
        text: 'The course was implemented according to the approved curriculum',
        shortLabel: 'Approved Curriculum'
      },
      {
        id: 'org_ilos_known',
        text: 'Intended Learning Outcomes (ILOs) of the course were made known from the beginning',
        shortLabel: 'ILOs Made Known'
      },
      {
        id: 'org_ilos_clear',
        text: 'Targeted Learning Outcomes (ILOs) of the course were clear',
        shortLabel: 'Clear ILOs'
      },
      {
        id: 'org_ilos_relevant',
        text: 'Intended Learning Outcomes (ILOs) of the course were relevant',
        shortLabel: 'Relevant ILOs'
      },
      {
        id: 'org_no_overlapping',
        text: 'There were no overlapping of contents within a course',
        shortLabel: 'No Overlapping'
      }
    ]
  },
  {
    id: 'teaching_learning',
    name: 'III. Teaching - Learning',
    description: 'Evaluation of teaching methods and learning activities',
    questions: [
      {
        id: 'teaching_tlas_useful',
        text: 'Teaching - Learning Activities (TLAs) such as practical, educational tour etc. were useful and relevant',
        shortLabel: 'TLAs Useful'
      },
      {
        id: 'teaching_ila_useful',
        text: 'Independent Learning (ILA) activities such as journal reading, research work, project, etc. were useful and relevant',
        shortLabel: 'ILA Useful'
      },
      {
        id: 'teaching_tlas_sequenced',
        text: 'The TLAs within a course were sequenced in a logical manner',
        shortLabel: 'TLAs Sequenced'
      },
      {
        id: 'teaching_applicable',
        text: 'Team teaching is done as applicable',
        shortLabel: 'Team Teaching'
      },
      {
        id: 'teaching_motivated',
        text: 'The teachers motivated the students to learn',
        shortLabel: 'Teacher Motivation'
      },
      {
        id: 'teaching_team_work',
        text: 'The teachers provided adequate opportunities for team work',
        shortLabel: 'Team Work Opportunities'
      },
      {
        id: 'teaching_independent',
        text: 'The teachers provided adequate opportunities for independent learning',
        shortLabel: 'Independent Learning'
      }
    ]
  },
  {
    id: 'assessment',
    name: 'IV. Assessment',
    description: 'Evaluation of assessment methods and feedback',
    questions: [
      {
        id: 'assessment_start',
        text: 'Assessments tasks were held at the beginning of the course',
        shortLabel: 'Assessment at Start'
      },
      {
        id: 'assessment_all_topics',
        text: 'Assessments covered all the main topics taught in the course',
        shortLabel: 'All Topics Covered'
      },
      {
        id: 'assessment_number',
        text: 'The number of assessments was appropriate and adequate',
        shortLabel: 'Appropriate Number'
      },
      {
        id: 'assessment_distribution',
        text: 'Distribution of assessments over a semester was appropriate',
        shortLabel: 'Good Distribution'
      },
      {
        id: 'assessment_allocation',
        text: 'Allocation of marks/grade among assessments was satisfactory',
        shortLabel: 'Satisfactory Allocation'
      },
      {
        id: 'assessment_feedback',
        text: 'The teachers provided timely feedback on student performance',
        shortLabel: 'Timely Feedback'
      }
    ]
  },
  {
    id: 'learning_environment',
    name: 'V. Learning Environment',
    description: 'Evaluation of facilities and learning resources',
    questions: [
      {
        id: 'environment_classrooms',
        text: 'Available facilities in the classrooms were satisfactory',
        shortLabel: 'Classroom Facilities'
      },
      {
        id: 'environment_library',
        text: 'Available library facilities were adequate',
        shortLabel: 'Library Facilities'
      },
      {
        id: 'environment_laboratory',
        text: 'Available laboratory facilities were adequate',
        shortLabel: 'Laboratory Facilities'
      },
      {
        id: 'environment_computer',
        text: 'Access to computer facilities were sufficient',
        shortLabel: 'Computer Access'
      },
      {
        id: 'environment_internet',
        text: 'There was sufficient access to internet and electronic databases',
        shortLabel: 'Internet Access'
      },
      {
        id: 'environment_facilities_availability',
        text: 'Availability of facilities for learning was satisfactory',
        shortLabel: 'Overall Facilities'
      }
    ]
  },
  {
    id: 'counseling',
    name: 'VI. Counseling',
    description: 'Evaluation of counseling and consultation support',
    questions: [
      {
        id: 'counseling_available',
        text: 'The teachers were available for consultation whenever needed',
        shortLabel: 'Teacher Availability'
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
