import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { prepareCategoryChartData, getPerformanceColor, getPerformanceLabel } from '../utils/evaluationDataTransformer'
import { questionnaireCategories } from '../data/questionnaireConfig'

/**
 * CategoryMetricsDisplay Component
 * Displays detailed questionnaire category metrics in a visual format
 */
export default function CategoryMetricsDisplay({ evaluations, title, description }) {
  const categoryData = prepareCategoryChartData(evaluations)

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="lpu-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title || 'Category Performance'}</h3>
        <p className="text-sm text-gray-600 mb-4">{description || 'Detailed breakdown of evaluation categories'}</p>
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p className="text-sm">No evaluation data available</p>
        </div>
      </div>
    )
  }

  // Calculate overall average
  const overallAverage = (categoryData.reduce((sum, cat) => sum + cat.average, 0) / categoryData.length).toFixed(2)
  const performanceLabel = getPerformanceLabel(parseFloat(overallAverage))

  return (
    <div className="lpu-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title || 'Category Performance Metrics'}</h3>
          <p className="text-sm text-gray-600">{description || 'Detailed breakdown of evaluation categories'}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Overall Average</div>
          <div className="text-2xl font-bold" style={{ color: getPerformanceColor(parseFloat(overallAverage)) }}>
            {overallAverage}/4.0
          </div>
          <div className="text-xs text-gray-500 mt-1">{performanceLabel}</div>
        </div>
      </div>

      {/* Category Bars Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <XAxis 
            dataKey="category" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis 
            domain={[0, 4]}
            tick={{ fontSize: 12, fill: '#64748b' }}
            label={{ value: 'Average Rating', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }}
          />
          <Tooltip 
            formatter={(value, name, props) => {
              const data = props.payload
              return [
                `${value}/4.0 (${data.count} responses)`,
                data.fullName
              ]
            }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar 
            dataKey="average" 
            radius={[8, 8, 0, 0]}
            minPointSize={5}
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.average)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Category Details Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#7a0000] to-[#9a1000] text-white">
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-center font-semibold">Avg Rating</th>
              <th className="px-4 py-3 text-center font-semibold">Performance</th>
              <th className="px-4 py-3 text-center font-semibold">Responses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categoryData.map((cat, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{cat.fullName}</td>
                <td className="px-4 py-3 text-center">
                  <span 
                    className="font-bold"
                    style={{ color: getPerformanceColor(cat.average) }}
                  >
                    {cat.average}/4.0
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ 
                      backgroundColor: `${getPerformanceColor(cat.average)}20`,
                      color: getPerformanceColor(cat.average)
                    }}
                  >
                    {getPerformanceLabel(cat.average)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{cat.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Legend */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">Evaluation Categories</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-blue-800">
          {questionnaireCategories.map((category, index) => (
            <div key={category.id} className="flex items-start">
              <span className="font-bold text-[#7a0000] mr-2">{index + 1}.</span>
              <div>
                <div className="font-semibold">{category.name}</div>
                <div className="text-blue-600 mt-1">{category.questions.length} questions</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * CategoryComparisonWidget Component
 * Compact widget showing top/bottom performing categories
 */
export function CategoryComparisonWidget({ evaluations, title }) {
  const categoryData = prepareCategoryChartData(evaluations)
  
  if (!categoryData || categoryData.length === 0) {
    return null
  }

  // Sort to find best and worst
  const sorted = [...categoryData].sort((a, b) => b.average - a.average)
  const topPerforming = sorted.slice(0, 3)
  const needsImprovement = sorted.slice(-3).reverse()

  return (
    <div className="lpu-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title || 'Performance Highlights'}</h3>
      
      <div className="space-y-6">
        {/* Top Performing */}
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            Top Performing Areas
          </h4>
          <div className="space-y-2">
            {topPerforming.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">{cat.fullName}</span>
                <span className="text-sm font-bold text-green-700">{cat.average}/4.0</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Improvement */}
        <div>
          <h4 className="text-sm font-semibold text-orange-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            Areas for Improvement
          </h4>
          <div className="space-y-2">
            {needsImprovement.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-700">{cat.fullName}</span>
                <span className="text-sm font-bold text-orange-700">{cat.average}/4.0</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
