-- ============================================================
-- Migration: Add JSONB ratings column to evaluations table
-- Purpose: Store all 31 question responses flexibly (LPU Batangas Standard)
-- ============================================================

-- Add new column for detailed ratings
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS ratings JSONB;

-- Add index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_evaluations_ratings 
ON public.evaluations USING GIN (ratings);

-- Add sentiment_score column if it doesn't exist (for ML confidence scores)
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2) CHECK (sentiment_score BETWEEN 0 AND 1);

-- Add text_feedback column for NLP processing (if not exists)
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS text_feedback TEXT;

-- Add anomaly detection fields
ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT FALSE;

ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS anomaly_score DECIMAL(5,4);

ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS anomaly_reason TEXT;

-- Create index for anomaly queries
CREATE INDEX IF NOT EXISTS idx_evaluations_anomaly 
ON public.evaluations (is_anomaly) 
WHERE is_anomaly = TRUE;

-- Add metadata tracking
ALTER TABLE public.evaluations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.evaluations.ratings IS 'JSONB object storing all 31+ question responses with question_id as keys (LPU Batangas standard evaluation form)';
COMMENT ON COLUMN public.evaluations.sentiment_score IS 'ML confidence score (0.0-1.0) for sentiment prediction';
COMMENT ON COLUMN public.evaluations.is_anomaly IS 'Flag indicating if evaluation was flagged by DBSCAN';
COMMENT ON COLUMN public.evaluations.anomaly_score IS 'Anomaly score from DBSCAN algorithm';
COMMENT ON COLUMN public.evaluations.metadata IS 'Additional metadata like submission time, device info, etc';

-- Sample data structure for ratings JSONB (LPU Batangas format):
-- {
--   // I. Relevance of Course (6 questions)
--   "relevance_subject_knowledge": 4,
--   "relevance_practical_skills": 4,
--   "relevance_team_work": 3,
--   "relevance_leadership": 3,
--   "relevance_communication": 4,
--   "relevance_positive_attitude": 4,
--   // II. Course Organization and ILOs (5 questions)
--   "org_curriculum": 4,
--   "org_ilos_known": 3,
--   "org_ilos_clear": 4,
--   "org_ilos_relevant": 4,
--   "org_no_overlapping": 3,
--   // III. Teaching - Learning (7 questions)
--   "teaching_tlas_useful": 4,
--   "teaching_ila_useful": 4,
--   "teaching_tlas_sequenced": 3,
--   "teaching_applicable": 3,
--   "teaching_motivated": 4,
--   "teaching_team_work": 3,
--   "teaching_independent": 4,
--   // IV. Assessment (6 questions)
--   "assessment_start": 3,
--   "assessment_all_topics": 4,
--   "assessment_number": 3,
--   "assessment_distribution": 4,
--   "assessment_allocation": 4,
--   "assessment_feedback": 3,
--   // V. Learning Environment (6 questions)
--   "environment_classrooms": 4,
--   "environment_library": 3,
--   "environment_laboratory": 3,
--   "environment_computer": 4,
--   "environment_internet": 4,
--   "environment_facilities_availability": 3,
--   // VI. Counseling (1 question)
--   "counseling_available": 4
-- }
