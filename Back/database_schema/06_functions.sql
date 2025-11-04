-- ===============================================
-- DATABASE FUNCTIONS
-- Purpose: Stored procedures and helper functions for business logic
-- Functions: get_setting, update_setting, log_audit_event, get_active_evaluation_period,
--            create_secretary_user, get_secretary_department_data, check_secretary_access
-- ===============================================

-- ================================================
-- 1. GET SETTING FUNCTION
-- Purpose: Retrieve a system setting value by category and key
-- Use Case: Application configuration retrieval
-- ================================================

CREATE OR REPLACE FUNCTION get_setting(p_category VARCHAR, p_key VARCHAR)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE category = p_category AND setting_key = p_key;
    
    RETURN v_value;
END;
$$;

-- ================================================
-- 2. UPDATE SETTING FUNCTION
-- Purpose: Update a system setting and track who modified it
-- Use Case: Admin settings modification with audit trail
-- ================================================

CREATE OR REPLACE FUNCTION update_setting(
    p_category VARCHAR,
    p_key VARCHAR,
    p_value TEXT,
    p_user_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE system_settings
    SET setting_value = p_value,
        last_modified_by = p_user_id,
        last_modified_at = CURRENT_TIMESTAMP
    WHERE category = p_category AND setting_key = p_key;
    
    RETURN FOUND;
END;
$$;

-- ================================================
-- 3. LOG AUDIT EVENT FUNCTION
-- Purpose: Create audit log entries with user context
-- Use Case: Track admin actions, security monitoring
-- ================================================

CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id INTEGER,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id INTEGER DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_audit_id INTEGER;
    v_username VARCHAR;
    v_role VARCHAR;
BEGIN
    -- Get user details
    SELECT email, role INTO v_username, v_role
    FROM users WHERE id = p_user_id;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id, username, user_role, action, entity_type, 
        entity_id, details, ip_address, timestamp
    ) VALUES (
        p_user_id, v_username, v_role, p_action, p_entity_type,
        p_entity_id, p_details, p_ip_address, CURRENT_TIMESTAMP
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- ================================================
-- 4. GET ACTIVE EVALUATION PERIOD FUNCTION
-- Purpose: Retrieve the currently active evaluation period
-- Use Case: Check if evaluations can be submitted
-- ================================================

CREATE OR REPLACE FUNCTION get_active_evaluation_period()
RETURNS TABLE (
    period_id INTEGER,
    period_name VARCHAR,
    start_date DATE,
    end_date DATE,
    semester VARCHAR,
    academic_year VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id, name, ep.start_date, ep.end_date, ep.semester, ep.academic_year
    FROM evaluation_periods ep
    WHERE is_active = TRUE
    AND CURRENT_DATE BETWEEN ep.start_date AND ep.end_date
    LIMIT 1;
END;
$$;

-- ================================================
-- 5. CREATE SECRETARY USER FUNCTION
-- Purpose: Create a new secretary with proper role and permissions
-- Use Case: Admin creates secretary accounts
-- ================================================

CREATE OR REPLACE FUNCTION create_secretary_user(
    p_email VARCHAR,
    p_password VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_department_id INTEGER,
    p_assigned_by INTEGER,
    p_access_level VARCHAR DEFAULT 'department'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id INTEGER;
    new_secretary_id INTEGER;
BEGIN
    -- Create user
    INSERT INTO users (
        email, password_hash, first_name, last_name, 
        role, department_id, can_access_department_data, is_active
    ) VALUES (
        p_email, p_password, p_first_name, p_last_name,
        'secretary', p_department_id, TRUE, TRUE
    ) RETURNING id INTO new_user_id;
    
    -- Create secretary record
    INSERT INTO secretary_users (
        user_id, department_id, access_level, assigned_by
    ) VALUES (
        new_user_id, p_department_id, p_access_level, p_assigned_by
    ) RETURNING secretary_id INTO new_secretary_id;
    
    RETURN new_secretary_id;
END;
$$;

-- ================================================
-- 6. GET SECRETARY DEPARTMENT DATA FUNCTION
-- Purpose: Retrieve all data accessible to a secretary based on their department
-- Use Case: Secretary dashboard data loading
-- ================================================

CREATE OR REPLACE FUNCTION get_secretary_department_data(secretary_user_id INTEGER)
RETURNS TABLE (
    data_type VARCHAR,
    total_count BIGINT,
    details JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    secretary_dept_id INTEGER;
BEGIN
    -- Get secretary's department
    SELECT department_id INTO secretary_dept_id
    FROM secretary_users su
    JOIN users u ON su.user_id = u.id
    WHERE u.id = secretary_user_id AND su.is_active = TRUE;
    
    IF secretary_dept_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active secretary or does not exist';
    END IF;
    
    -- Return instructors data
    RETURN QUERY
    SELECT 
        'instructors'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'user_id', u.id,
                'email', u.email,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'created_at', u.created_at
            )
        ) as details
    FROM users u
    WHERE u.department_id = secretary_dept_id 
    AND u.role = 'instructor' 
    AND u.is_active = TRUE;
    
    -- Return students data
    RETURN QUERY
    SELECT 
        'students'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'student_id', s.id,
                'student_number', s.student_number,
                'first_name', s.first_name,
                'last_name', s.last_name,
                'year_level', s.year_level,
                'program', s.program,
                'email', s.email
            )
        ) as details
    FROM students s
    WHERE s.department_id = secretary_dept_id AND s.is_active = TRUE;
    
    -- Return courses data
    RETURN QUERY
    SELECT 
        'courses'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'course_id', c.id,
                'course_code', c.course_code,
                'course_name', c.course_name,
                'instructor_name', u.first_name || ' ' || u.last_name,
                'semester', cs.semester,
                'academic_year', cs.academic_year,
                'created_at', c.created_at
            )
        ) as details
    FROM courses c
    JOIN class_sections cs ON c.id = cs.course_id
    JOIN users u ON cs.instructor_id = u.id
    WHERE u.department_id = secretary_dept_id AND c.is_active = TRUE;
    
    -- Return evaluations data
    RETURN QUERY
    SELECT 
        'evaluations'::VARCHAR as data_type,
        COUNT(*)::BIGINT as total_count,
        jsonb_agg(
            jsonb_build_object(
                'evaluation_id', e.id,
                'course_code', c.course_code,
                'course_name', c.course_name,
                'instructor_name', u.first_name || ' ' || u.last_name,
                'student_name', s.first_name || ' ' || s.last_name,
                'overall_rating', e.rating_overall,
                'sentiment', e.sentiment,
                'created_at', e.submission_date
            )
        ) as details
    FROM evaluations e
    JOIN class_sections cs ON e.class_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    JOIN users u ON cs.instructor_id = u.id
    JOIN students s ON e.student_id = s.id
    WHERE u.department_id = secretary_dept_id;
    
END;
$$;

-- ================================================
-- 7. CHECK SECRETARY ACCESS FUNCTION
-- Purpose: Verify if a secretary has access to specific data
-- Use Case: Authorization checks before displaying department data
-- ================================================

CREATE OR REPLACE FUNCTION check_secretary_access(
    p_user_id INTEGER,
    p_requested_data_type VARCHAR,
    p_target_department_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    secretary_dept_id INTEGER;
    access_level VARCHAR;
    has_access BOOLEAN := FALSE;
BEGIN
    -- Get secretary information
    SELECT su.department_id, su.access_level
    INTO secretary_dept_id, access_level
    FROM secretary_users su
    JOIN users u ON su.user_id = u.id
    WHERE u.id = p_user_id AND su.is_active = TRUE;
    
    -- If not a secretary, deny access
    IF secretary_dept_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check access based on level
    IF access_level = 'university' THEN
        has_access := TRUE;
    ELSIF access_level = 'college' THEN
        -- Can access same college departments (implement college logic if needed)
        has_access := TRUE;
    ELSIF access_level = 'department' THEN
        -- Can only access own department
        IF p_target_department_id IS NULL OR p_target_department_id = secretary_dept_id THEN
            has_access := TRUE;
        END IF;
    END IF;
    
    RETURN has_access;
END;
$$;

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- Check if all functions were created
SELECT routine_name, routine_type, specific_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_setting', 
    'update_setting', 
    'log_audit_event', 
    'get_active_evaluation_period',
    'create_secretary_user',
    'get_secretary_department_data',
    'check_secretary_access'
)
ORDER BY routine_name;

-- ================================================
-- USAGE EXAMPLES
-- ================================================

-- Example 1: Get a setting
-- SELECT get_setting('general', 'site_name');

-- Example 2: Update a setting
-- SELECT update_setting('general', 'site_name', 'My Custom Name', 1);

-- Example 3: Log an audit event
-- SELECT log_audit_event(1, 'update', 'settings', NULL, '{"setting": "site_name"}'::jsonb, '192.168.1.1');

-- Example 4: Get active evaluation period
-- SELECT * FROM get_active_evaluation_period();

-- Example 5: Check secretary access
-- SELECT check_secretary_access(secretary_user_id, 'evaluations', target_dept_id);
