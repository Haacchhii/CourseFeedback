/**
 * Evaluation Data Transformer
 * Transforms legacy evaluation data to work with the new detailed questionnaire structure
 * and provides helpers for data visualization
 */

import { questionnaireCategories, calculateSentiment } from '../data/questionnaireConfig'

/**
 * Transform legacy ratings to new detailed structure
 * Maps old 4-category ratings to appropriate new questionnaire questions
 */
export const transformLegacyRatings = (legacyRatings) => {
  if (!legacyRatings) return null

  // Map old ratings to new question IDs
  const transformed = {}
  
  // Map clarity to relevant questions
  if (legacyRatings.clarity !== undefined) {
    transformed.content_clarity = legacyRatings.clarity
    transformed.content_organization = legacyRatings.clarity
    transformed.instructor_communication = legacyRatings.clarity
  }
  
  // Map usefulness to relevant questions
  if (legacyRatings.usefulness !== undefined) {
    transformed.content_relevance = legacyRatings.usefulness
    transformed.methods_materials = legacyRatings.usefulness
    transformed.outcomes_skills = legacyRatings.usefulness
  }
  
  // Map engagement to relevant questions
  if (legacyRatings.engagement !== undefined) {
    transformed.instructor_engagement = legacyRatings.engagement
    transformed.instructor_enthusiasm = legacyRatings.engagement
    transformed.interaction_participation = legacyRatings.engagement
  }
  
  // Map organization to relevant questions
  if (legacyRatings.organization !== undefined) {
    transformed.content_organization = legacyRatings.organization
    transformed.instructor_prepared = legacyRatings.organization
    transformed.methods_variety = legacyRatings.organization
  }

  return transformed
}

/**
 * Get category averages from evaluation responses
 */
export const getCategoryAverages = (responses) => {
  if (!responses) return {}
  
  const categoryAverages = {}
  
  questionnaireCategories.forEach(category => {
    const categoryQuestions = category.questions.map(q => q.id)
    const ratings = categoryQuestions
      .map(qId => responses[qId])
      .filter(rating => rating !== undefined && rating !== null && !isNaN(rating))
    
    if (ratings.length > 0) {
      const average = ratings.reduce((sum, rating) => sum + parseFloat(rating), 0) / ratings.length
      categoryAverages[category.id] = {
        average: parseFloat(average.toFixed(2)),
        name: category.name,
        shortName: category.name.split(' ')[0], // First word for compact display
        count: ratings.length
      }
    }
  })
  
  return categoryAverages
}

/**
 * Get detailed metrics for dashboard display
 */
export const getDetailedMetrics = (evaluations) => {
  if (!evaluations || evaluations.length === 0) {
    return {
      categoryAverages: {},
      overallAverage: 0,
      totalResponses: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 }
    }
  }

  // Aggregate all category averages
  const allCategoryScores = {}
  questionnaireCategories.forEach(category => {
    allCategoryScores[category.id] = []
  })

  let totalOverallRatings = []
  let sentimentCounts = { positive: 0, neutral: 0, negative: 0 }

  evaluations.forEach(evaluation => {
    // First check for categoryRatings (pre-calculated category averages)
    if (evaluation.categoryRatings) {
      Object.entries(evaluation.categoryRatings).forEach(([categoryId, rating]) => {
        if (allCategoryScores[categoryId]) {
          allCategoryScores[categoryId].push(parseFloat(rating))
        }
      })
      
      // Calculate overall average from category ratings
      const categoryValues = Object.values(evaluation.categoryRatings).filter(r => 
        r !== undefined && r !== null && !isNaN(r)
      )
      if (categoryValues.length > 0) {
        const evalAvg = categoryValues.reduce((sum, r) => sum + parseFloat(r), 0) / categoryValues.length
        totalOverallRatings.push(evalAvg)
      }
    } 
    // Fall back to extracting from detailed responses
    else {
      const ratings = evaluation.responses || evaluation.ratings
      
      if (ratings) {
        // Calculate category averages for this evaluation
        const categoryAvgs = getCategoryAverages(ratings)
        
        Object.entries(categoryAvgs).forEach(([categoryId, data]) => {
          if (allCategoryScores[categoryId]) {
            allCategoryScores[categoryId].push(data.average)
          }
        })

        // Calculate overall average for this evaluation
        const allRatings = Object.values(ratings).filter(r => 
          r !== undefined && r !== null && !isNaN(r)
        )
        if (allRatings.length > 0) {
          const evalAvg = allRatings.reduce((sum, r) => sum + parseFloat(r), 0) / allRatings.length
          totalOverallRatings.push(evalAvg)
        }
      }
    }
    
    // Count sentiments
    if (evaluation.sentiment) {
      sentimentCounts[evaluation.sentiment] = (sentimentCounts[evaluation.sentiment] || 0) + 1
    }
  })

  // Calculate final category averages
  const finalCategoryAverages = {}
  questionnaireCategories.forEach(category => {
    const scores = allCategoryScores[category.id]
    if (scores && scores.length > 0) {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length
      finalCategoryAverages[category.id] = {
        average: parseFloat(avg.toFixed(2)),
        name: category.name,
        shortName: category.name.split(' ')[0],
        count: scores.length
      }
    }
  })

  // Calculate overall average
  const overallAverage = totalOverallRatings.length > 0
    ? parseFloat((totalOverallRatings.reduce((sum, r) => sum + r, 0) / totalOverallRatings.length).toFixed(2))
    : 0

  return {
    categoryAverages: finalCategoryAverages,
    overallAverage,
    totalResponses: evaluations.length,
    sentimentDistribution: sentimentCounts
  }
}

/**
 * Prepare category data for chart visualization
 */
export const prepareCategoryChartData = (evaluations) => {
  const metrics = getDetailedMetrics(evaluations)
  
  return Object.entries(metrics.categoryAverages).map(([id, data]) => ({
    category: data.shortName,
    fullName: data.name,
    average: data.average,
    count: data.count,
    percentage: (data.average / 5) * 100 // Convert to percentage for display
  }))
}

/**
 * Get performance color based on rating (4-point scale)
 */
export const getPerformanceColor = (rating) => {
  if (rating >= 3.5) return '#10b981' // green-500
  if (rating >= 3.0) return '#84cc16' // lime-500
  if (rating >= 2.5) return '#f59e0b' // amber-500
  if (rating >= 2.0) return '#fb923c' // orange-400
  if (rating >= 1.5) return '#f87171' // red-400
  return '#dc2626' // red-600
}

/**
 * Get performance label based on rating (4-point scale)
 */
export const getPerformanceLabel = (rating) => {
  if (rating >= 3.5) return 'Excellent'
  if (rating >= 3.0) return 'Very Good'
  if (rating >= 2.5) return 'Good'
  if (rating >= 2.0) return 'Satisfactory'
  if (rating >= 1.5) return 'Needs Improvement'
  return 'Poor'
}

/**
 * Calculate weighted sentiment based on detailed ratings
 * This provides more nuanced sentiment than just positive/neutral/negative
 */
export const calculateDetailedSentiment = (responses) => {
  if (!responses) return { sentiment: 'neutral', confidence: 0 }

  const allRatings = Object.values(responses).filter(r => 
    r !== undefined && r !== null && !isNaN(r)
  )

  if (allRatings.length === 0) {
    return { sentiment: 'neutral', confidence: 0 }
  }

  const average = allRatings.reduce((sum, r) => sum + parseFloat(r), 0) / allRatings.length
  const sentiment = calculateSentiment(average)
  
  // Calculate confidence based on consistency
  const variance = allRatings.reduce((sum, r) => 
    sum + Math.pow(parseFloat(r) - average, 2), 0
  ) / allRatings.length
  const stdDev = Math.sqrt(variance)
  const consistency = Math.max(0, 1 - (stdDev / 2)) // Normalized to 0-1
  
  return {
    sentiment,
    confidence: Math.round(consistency * 100),
    average: parseFloat(average.toFixed(2)),
    consistency: parseFloat(consistency.toFixed(2))
  }
}

export default {
  transformLegacyRatings,
  getCategoryAverages,
  getDetailedMetrics,
  prepareCategoryChartData,
  getPerformanceColor,
  getPerformanceLabel,
  calculateDetailedSentiment
}
