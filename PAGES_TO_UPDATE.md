# Pages Updated with useApiWithTimeout Hook

## ✅ Completed
1. AdminDashboard.jsx - DONE
2. UserManagement.jsx - DONE
3. EvaluationPeriodManagement.jsx - DONE
4. SystemSettings.jsx - DONE

## 🔄 In Progress
5. EnhancedCourseManagement.jsx
6. DataExportCenter.jsx
7. AuditLogViewer.jsx

## ⏳ Pending
### Student Pages
- StudentCourses.jsx
- StudentEvaluation.jsx
- EvaluateCourse.jsx

### Staff Pages
- Dashboard.jsx (staff)
- Courses.jsx (staff)
- Evaluations.jsx (staff)
- EvaluationQuestions.jsx (staff)
- SentimentAnalysis.jsx (staff)
- AnomalyDetection.jsx (staff)

## Pattern to Apply:
1. Add import: `import { useApiWithTimeout, LoadingSpinner, ErrorDisplay } from '../../hooks/useApiWithTimeout'`
2. Replace `const [loading, setLoading] = useState(true)` and `const [error, setError] = useState(null)` with hook
3. Replace manual `useEffect` with `useApiWithTimeout` hook
4. Replace loading/error render blocks with `<LoadingSpinner />` and `<ErrorDisplay />`
