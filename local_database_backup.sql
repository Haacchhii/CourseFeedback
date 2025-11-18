--
-- PostgreSQL database dump
--

\restrict T1sLtiWyWAWrkcwN1SEJarfVNhufTgU2Y0R4edZYRdXl32oLNxPfTEIRXuptqBf

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: check_secretary_access(integer, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_secretary_access(p_user_id integer, p_requested_data_type character varying, p_target_department_id integer DEFAULT NULL::integer) RETURNS boolean
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


ALTER FUNCTION public.check_secretary_access(p_user_id integer, p_requested_data_type character varying, p_target_department_id integer) OWNER TO postgres;

--
-- Name: create_secretary_user(character varying, character varying, character varying, character varying, integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_secretary_user(p_email character varying, p_password character varying, p_first_name character varying, p_last_name character varying, p_department_id integer, p_assigned_by integer, p_access_level character varying DEFAULT 'department'::character varying) RETURNS integer
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


ALTER FUNCTION public.create_secretary_user(p_email character varying, p_password character varying, p_first_name character varying, p_last_name character varying, p_department_id integer, p_assigned_by integer, p_access_level character varying) OWNER TO postgres;

--
-- Name: get_secretary_department_data(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_secretary_department_data(secretary_user_id integer) RETURNS TABLE(data_type character varying, total_count bigint, details jsonb)
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


ALTER FUNCTION public.get_secretary_department_data(secretary_user_id integer) OWNER TO postgres;

--
-- Name: trigger_firebase_sync(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_firebase_sync() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insert sync record for Firebase real-time updates
    INSERT INTO firebase_sync_log (table_name, record_id, sync_type, firebase_doc_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NEW.firebase_doc_id);
    
    -- Update analysis results asynchronously (would be handled by your Python service)
    -- This trigger just logs the need for re-processing
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_firebase_sync() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analysis_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analysis_results (
    id integer NOT NULL,
    class_section_id integer,
    analysis_type character varying(50) NOT NULL,
    total_evaluations integer DEFAULT 0,
    positive_count integer DEFAULT 0,
    neutral_count integer DEFAULT 0,
    negative_count integer DEFAULT 0,
    anomaly_count integer DEFAULT 0,
    avg_overall_rating double precision,
    avg_sentiment_score double precision,
    confidence_interval double precision,
    detailed_results jsonb,
    analysis_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    model_version character varying(20),
    processing_time_ms integer
);


ALTER TABLE public.analysis_results OWNER TO postgres;

--
-- Name: analysis_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analysis_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analysis_results_id_seq OWNER TO postgres;

--
-- Name: analysis_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analysis_results_id_seq OWNED BY public.analysis_results.id;


--
-- Name: class_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_sections (
    id integer NOT NULL,
    course_id integer,
    class_code character varying(50) NOT NULL,
    instructor_name character varying(255),
    schedule character varying(255),
    room character varying(100),
    max_students integer DEFAULT 40,
    semester character varying(20) NOT NULL,
    academic_year character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    instructor_id integer,
    firebase_sync_id character varying(255)
);


ALTER TABLE public.class_sections OWNER TO postgres;

--
-- Name: class_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_sections_id_seq OWNER TO postgres;

--
-- Name: class_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_sections_id_seq OWNED BY public.class_sections.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    course_code character varying(20) NOT NULL,
    course_name character varying(255) NOT NULL,
    program_id integer,
    year_level integer NOT NULL,
    semester integer NOT NULL,
    units integer DEFAULT 3,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    CONSTRAINT courses_semester_check CHECK ((semester = ANY (ARRAY[1, 2])))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: department_heads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_heads (
    id integer NOT NULL,
    user_id integer,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    department character varying(255),
    programs integer[]
);


ALTER TABLE public.department_heads OWNER TO postgres;

--
-- Name: department_heads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_heads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_heads_id_seq OWNER TO postgres;

--
-- Name: department_heads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_heads_id_seq OWNED BY public.department_heads.id;


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluations (
    id integer NOT NULL,
    student_id integer,
    class_section_id integer,
    rating_teaching integer,
    rating_content integer,
    rating_engagement integer,
    rating_overall integer,
    comments text,
    submission_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    text_feedback text,
    suggestions text,
    sentiment character varying(20),
    sentiment_score double precision,
    is_anomaly boolean DEFAULT false,
    anomaly_score double precision,
    submission_ip character varying(45),
    firebase_doc_id character varying(255),
    processing_status character varying(20) DEFAULT 'pending'::character varying,
    processed_at timestamp without time zone,
    CONSTRAINT evaluations_processing_status_check CHECK (((processing_status)::text = ANY ((ARRAY['pending'::character varying, 'processed'::character varying, 'flagged'::character varying])::text[]))),
    CONSTRAINT evaluations_rating_content_check CHECK (((rating_content >= 1) AND (rating_content <= 5))),
    CONSTRAINT evaluations_rating_engagement_check CHECK (((rating_engagement >= 1) AND (rating_engagement <= 5))),
    CONSTRAINT evaluations_rating_overall_check CHECK (((rating_overall >= 1) AND (rating_overall <= 5))),
    CONSTRAINT evaluations_rating_teaching_check CHECK (((rating_teaching >= 1) AND (rating_teaching <= 5))),
    CONSTRAINT evaluations_sentiment_check CHECK (((sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying])::text[]))),
    CONSTRAINT evaluations_sentiment_score_check CHECK (((sentiment_score >= (0)::double precision) AND (sentiment_score <= (1)::double precision)))
);


ALTER TABLE public.evaluations OWNER TO postgres;

--
-- Name: programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programs (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    duration_years integer NOT NULL
);


ALTER TABLE public.programs OWNER TO postgres;

--
-- Name: department_overview; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.department_overview AS
 SELECT p.name AS program_name,
    p.code AS program_code,
    count(DISTINCT cs.id) AS total_classes,
    count(DISTINCT c.id) AS total_courses,
    count(DISTINCT e.id) AS total_evaluations,
    round(avg(e.rating_overall), 2) AS avg_program_rating,
    count(
        CASE
            WHEN ((e.sentiment)::text = 'positive'::text) THEN 1
            ELSE NULL::integer
        END) AS positive_feedback,
    count(
        CASE
            WHEN ((e.sentiment)::text = 'negative'::text) THEN 1
            ELSE NULL::integer
        END) AS negative_feedback,
    count(
        CASE
            WHEN (e.is_anomaly = true) THEN 1
            ELSE NULL::integer
        END) AS total_anomalies
   FROM (((public.programs p
     LEFT JOIN public.courses c ON ((p.id = c.program_id)))
     LEFT JOIN public.class_sections cs ON ((c.id = cs.course_id)))
     LEFT JOIN public.evaluations e ON ((cs.id = e.class_section_id)))
  GROUP BY p.id, p.name, p.code;


ALTER VIEW public.department_overview OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_name character varying(100) NOT NULL,
    department_code character varying(10) NOT NULL,
    college character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    student_id integer,
    class_section_id integer,
    enrollment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT enrollments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'dropped'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name character varying(100),
    last_name character varying(100),
    department character varying(100),
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    firebase_uid character varying(255),
    department_id integer,
    can_access_department_data boolean DEFAULT false,
    password character varying(255),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'instructor'::character varying, 'department_head'::character varying, 'admin'::character varying, 'secretary'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: evaluation_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.evaluation_analytics AS
 SELECT cs.id AS class_section_id,
    cs.class_code,
    c.course_name,
    c.course_code,
    p.name AS program_name,
    concat(u.first_name, ' ', u.last_name) AS instructor_name,
    cs.semester,
    cs.academic_year,
    count(e.id) AS total_evaluations,
    round(avg(e.rating_overall), 2) AS avg_overall_rating,
    round(avg(e.rating_teaching), 2) AS avg_teaching_rating,
    round(avg(e.rating_content), 2) AS avg_content_rating,
    round(avg(e.rating_engagement), 2) AS avg_engagement_rating,
    count(
        CASE
            WHEN ((e.sentiment)::text = 'positive'::text) THEN 1
            ELSE NULL::integer
        END) AS positive_count,
    count(
        CASE
            WHEN ((e.sentiment)::text = 'neutral'::text) THEN 1
            ELSE NULL::integer
        END) AS neutral_count,
    count(
        CASE
            WHEN ((e.sentiment)::text = 'negative'::text) THEN 1
            ELSE NULL::integer
        END) AS negative_count,
    round((avg(e.sentiment_score))::numeric, 3) AS avg_sentiment_score,
    count(
        CASE
            WHEN (e.is_anomaly = true) THEN 1
            ELSE NULL::integer
        END) AS anomaly_count,
    round(((((count(
        CASE
            WHEN (e.is_anomaly = true) THEN 1
            ELSE NULL::integer
        END))::double precision / (count(e.id))::double precision) * (100)::double precision))::numeric, 2) AS anomaly_percentage,
    cs.max_students,
    round(((((count(e.id))::double precision / (cs.max_students)::double precision) * (100)::double precision))::numeric, 2) AS response_rate_percentage
   FROM ((((public.class_sections cs
     JOIN public.courses c ON ((cs.course_id = c.id)))
     JOIN public.programs p ON ((c.program_id = p.id)))
     LEFT JOIN public.users u ON ((cs.instructor_id = u.id)))
     LEFT JOIN public.evaluations e ON ((cs.id = e.class_section_id)))
  GROUP BY cs.id, cs.class_code, c.course_name, c.course_code, p.name, u.first_name, u.last_name, cs.semester, cs.academic_year, cs.max_students;


ALTER VIEW public.evaluation_analytics OWNER TO postgres;

--
-- Name: evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.evaluations_id_seq OWNER TO postgres;

--
-- Name: evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.evaluations_id_seq OWNED BY public.evaluations.id;


--
-- Name: firebase_sync_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.firebase_sync_log (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer NOT NULL,
    firebase_doc_id character varying(255),
    sync_type character varying(20) NOT NULL,
    sync_status character varying(20) DEFAULT 'pending'::character varying,
    sync_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    error_message text,
    retry_count integer DEFAULT 0
);


ALTER TABLE public.firebase_sync_log OWNER TO postgres;

--
-- Name: firebase_sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.firebase_sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.firebase_sync_log_id_seq OWNER TO postgres;

--
-- Name: firebase_sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.firebase_sync_log_id_seq OWNED BY public.firebase_sync_log.id;


--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_queue (
    id integer NOT NULL,
    user_id integer,
    notification_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb,
    firebase_token character varying(500),
    status character varying(20) DEFAULT 'pending'::character varying,
    scheduled_for timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification_queue OWNER TO postgres;

--
-- Name: notification_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_queue_id_seq OWNER TO postgres;

--
-- Name: notification_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_queue_id_seq OWNED BY public.notification_queue.id;


--
-- Name: programs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programs_id_seq OWNER TO postgres;

--
-- Name: programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programs_id_seq OWNED BY public.programs.id;


--
-- Name: secretary_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.secretary_users (
    secretary_id integer NOT NULL,
    user_id integer NOT NULL,
    department_id integer NOT NULL,
    access_level character varying(20) DEFAULT 'department'::character varying,
    can_view_evaluations boolean DEFAULT true,
    can_view_analytics boolean DEFAULT true,
    can_export_data boolean DEFAULT true,
    assigned_by integer,
    assigned_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    CONSTRAINT secretary_users_access_level_check CHECK (((access_level)::text = ANY ((ARRAY['department'::character varying, 'college'::character varying, 'university'::character varying])::text[])))
);


ALTER TABLE public.secretary_users OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    user_id integer,
    student_id character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    program_id integer,
    year_level integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    department_id integer,
    is_active boolean DEFAULT true,
    program character varying(100),
    email character varying(255),
    student_number character varying(50),
    CONSTRAINT students_year_level_check CHECK (((year_level >= 1) AND (year_level <= 4)))
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: secretary_dashboard_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.secretary_dashboard_stats AS
 SELECT su.secretary_id,
    d.department_name,
    d.department_code,
    ( SELECT count(*) AS count
           FROM public.users u2
          WHERE ((u2.department_id = su.department_id) AND ((u2.role)::text = 'instructor'::text) AND (u2.is_active = true))) AS active_instructors,
    ( SELECT count(*) AS count
           FROM public.students st
          WHERE ((st.department_id = su.department_id) AND (st.is_active = true))) AS active_students,
    ( SELECT count(DISTINCT c.id) AS count
           FROM ((public.courses c
             JOIN public.class_sections cs ON ((c.id = cs.course_id)))
             JOIN public.users i ON ((cs.instructor_id = i.id)))
          WHERE ((i.department_id = su.department_id) AND (c.is_active = true))) AS active_courses,
    ( SELECT count(*) AS count
           FROM (((public.evaluations e
             JOIN public.class_sections cs ON ((e.class_section_id = cs.id)))
             JOIN public.courses c ON ((cs.course_id = c.id)))
             JOIN public.users i ON ((cs.instructor_id = i.id)))
          WHERE (i.department_id = su.department_id)) AS total_evaluations,
    ( SELECT count(*) AS count
           FROM (((public.evaluations e
             JOIN public.class_sections cs ON ((e.class_section_id = cs.id)))
             JOIN public.courses c ON ((cs.course_id = c.id)))
             JOIN public.users i ON ((cs.instructor_id = i.id)))
          WHERE ((i.department_id = su.department_id) AND (e.submission_date >= (CURRENT_DATE - '30 days'::interval)))) AS recent_evaluations,
    ( SELECT round(avg(e.rating_overall), 2) AS round
           FROM (((public.evaluations e
             JOIN public.class_sections cs ON ((e.class_section_id = cs.id)))
             JOIN public.courses c ON ((cs.course_id = c.id)))
             JOIN public.users i ON ((cs.instructor_id = i.id)))
          WHERE (i.department_id = su.department_id)) AS avg_department_rating
   FROM (public.secretary_users su
     JOIN public.departments d ON ((su.department_id = d.department_id)))
  WHERE (su.is_active = true);


ALTER VIEW public.secretary_dashboard_stats OWNER TO postgres;

--
-- Name: secretary_department_overview; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.secretary_department_overview AS
 SELECT s.secretary_id,
    u.email,
    concat(u.first_name, ' ', u.last_name) AS secretary_name,
    d.department_name,
    d.department_code,
    s.access_level,
    s.can_view_evaluations,
    s.can_view_analytics,
    s.can_export_data,
    s.is_active,
    ( SELECT count(*) AS count
           FROM public.users u2
          WHERE ((u2.department_id = s.department_id) AND ((u2.role)::text = 'instructor'::text))) AS total_instructors,
    ( SELECT count(*) AS count
           FROM public.students st
          WHERE ((st.department_id = s.department_id) AND (st.is_active = true))) AS total_students,
    ( SELECT count(DISTINCT c.id) AS count
           FROM ((public.courses c
             JOIN public.class_sections cs ON ((c.id = cs.course_id)))
             JOIN public.users i ON ((cs.instructor_id = i.id)))
          WHERE (i.department_id = s.department_id)) AS total_courses
   FROM ((public.secretary_users s
     JOIN public.users u ON ((s.user_id = u.id)))
     JOIN public.departments d ON ((s.department_id = d.department_id)))
  WHERE (s.is_active = true);


ALTER VIEW public.secretary_department_overview OWNER TO postgres;

--
-- Name: secretary_users_secretary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.secretary_users_secretary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.secretary_users_secretary_id_seq OWNER TO postgres;

--
-- Name: secretary_users_secretary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.secretary_users_secretary_id_seq OWNED BY public.secretary_users.secretary_id;


--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analysis_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analysis_results ALTER COLUMN id SET DEFAULT nextval('public.analysis_results_id_seq'::regclass);


--
-- Name: class_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_sections ALTER COLUMN id SET DEFAULT nextval('public.class_sections_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: department_heads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_heads ALTER COLUMN id SET DEFAULT nextval('public.department_heads_id_seq'::regclass);


--
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations ALTER COLUMN id SET DEFAULT nextval('public.evaluations_id_seq'::regclass);


--
-- Name: firebase_sync_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.firebase_sync_log ALTER COLUMN id SET DEFAULT nextval('public.firebase_sync_log_id_seq'::regclass);


--
-- Name: notification_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_queue ALTER COLUMN id SET DEFAULT nextval('public.notification_queue_id_seq'::regclass);


--
-- Name: programs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs ALTER COLUMN id SET DEFAULT nextval('public.programs_id_seq'::regclass);


--
-- Name: secretary_users secretary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users ALTER COLUMN secretary_id SET DEFAULT nextval('public.secretary_users_secretary_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: analysis_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analysis_results (id, class_section_id, analysis_type, total_evaluations, positive_count, neutral_count, negative_count, anomaly_count, avg_overall_rating, avg_sentiment_score, confidence_interval, detailed_results, analysis_date, model_version, processing_time_ms) FROM stdin;
\.


--
-- Data for Name: class_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_sections (id, course_id, class_code, instructor_name, schedule, room, max_students, semester, academic_year, created_at, instructor_id, firebase_sync_id) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, course_code, course_name, program_id, year_level, semester, units, created_at, is_active) FROM stdin;
1	CS101	Introduction to Computer Science	1	1	1	3	2025-11-06 23:16:55.068057	t
2	CS102	Programming Fundamentals	1	1	1	3	2025-11-06 23:16:55.077815	t
3	CS201	Data Structures and Algorithms	1	2	1	3	2025-11-06 23:16:55.078686	t
4	CS202	Object-Oriented Programming	1	2	1	3	2025-11-06 23:16:55.079468	t
5	CS301	Database Management Systems	1	3	1	3	2025-11-06 23:16:55.080098	t
6	CS302	Web Development	1	3	1	3	2025-11-06 23:16:55.08089	t
7	CS401	Software Engineering	1	4	1	3	2025-11-06 23:16:55.081813	t
8	CS402	Machine Learning	1	4	1	3	2025-11-06 23:16:55.082415	t
9	MATH101	Calculus I	2	1	1	3	2025-11-06 23:16:55.08338	t
10	MATH201	Discrete Mathematics	2	2	1	3	2025-11-06 23:16:55.083974	t
\.


--
-- Data for Name: department_heads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_heads (id, user_id, first_name, last_name, department, programs) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, department_name, department_code, college, created_at, updated_at, is_active) FROM stdin;
1	Computer Science	CS	College of Engineering	2025-09-26 17:55:11.813479	2025-09-26 17:55:11.813479	t
2	Information Technology	IT	College of Engineering	2025-09-26 17:55:11.813479	2025-09-26 17:55:11.813479	t
3	Business Administration	BA	College of Business	2025-09-26 17:55:11.813479	2025-09-26 17:55:11.813479	t
4	Education	EDUC	College of Education	2025-09-26 17:55:11.813479	2025-09-26 17:55:11.813479	t
5	Engineering	ENG	College of Engineering	2025-09-26 17:55:11.813479	2025-09-26 17:55:11.813479	t
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, student_id, class_section_id, enrollment_date, status) FROM stdin;
\.


--
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluations (id, student_id, class_section_id, rating_teaching, rating_content, rating_engagement, rating_overall, comments, submission_date, text_feedback, suggestions, sentiment, sentiment_score, is_anomaly, anomaly_score, submission_ip, firebase_doc_id, processing_status, processed_at) FROM stdin;
\.


--
-- Data for Name: firebase_sync_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.firebase_sync_log (id, table_name, record_id, firebase_doc_id, sync_type, sync_status, sync_timestamp, error_message, retry_count) FROM stdin;
\.


--
-- Data for Name: notification_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_queue (id, user_id, notification_type, title, message, data, firebase_token, status, scheduled_for, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programs (id, code, name, duration_years) FROM stdin;
1	BSIT	Bachelor of Science in Information Technology	4
2	BSCS-DS	Bachelor of Science in Computer Science - Data Science	3
3	BSCS	Bachelor of Science in Computer Science	3
4	BSCY	Bachelor of Science in Cybersecurity	3
5	BMA	Bachelor of Multimedia Arts	4
\.


--
-- Data for Name: secretary_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.secretary_users (secretary_id, user_id, department_id, access_level, can_view_evaluations, can_view_analytics, can_export_data, assigned_by, assigned_date, is_active) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, user_id, student_id, first_name, last_name, program_id, year_level, created_at, department_id, is_active, program, email, student_number) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, created_at, updated_at, first_name, last_name, department, is_active, last_login, firebase_uid, department_id, can_access_department_data, password) FROM stdin;
14	admin@lpubatangas.edu.ph	$2b$12$JQcl3KcKMf2r07/eFexeC.ld8Rg2pfe7biWlUSqjwk3.iSCLMilxW	admin	2025-09-26 17:55:11.813479	2025-09-27 23:26:37.163401	Admin	User	\N	t	\N	firebase_uid_admin	\N	f	\N
15	secretary@lpubatangas.edu.ph	$2b$12$JQcl3KcKMf2r07/eFexeC.ld8Rg2pfe7biWlUSqjwk3.iSCLMilxW	secretary	2025-09-27 23:26:37.163401	2025-09-27 23:26:37.163401	Secretary	User	\N	t	\N	\N	\N	f	\N
13	instructor@lpubatangas.edu.ph	$2b$12$JQcl3KcKMf2r07/eFexeC.ld8Rg2pfe7biWlUSqjwk3.iSCLMilxW	instructor	2025-09-26 17:55:11.813479	2025-09-27 23:26:37.163401	John	Doe	\N	t	\N	firebase_uid_123	\N	f	\N
16	student@lpubatangas.edu.ph	$2b$12$JQcl3KcKMf2r07/eFexeC.ld8Rg2pfe7biWlUSqjwk3.iSCLMilxW	student	2025-09-27 23:26:37.163401	2025-09-27 23:26:37.163401	Test	Student	\N	t	\N	\N	\N	f	\N
17	depthead@lpubatangas.edu.ph	$2b$12$JQcl3KcKMf2r07/eFexeC.ld8Rg2pfe7biWlUSqjwk3.iSCLMilxW	department_head	2025-11-06 23:03:25.628276	2025-11-06 23:03:25.628276	Department	Head	\N	t	\N	\N	\N	f	\N
18	student2@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.08461	2025-11-06 23:16:55.08461	Student2	Test2	Computer Science	t	\N	\N	\N	f	\N
19	student3@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.08849	2025-11-06 23:16:55.08849	Student3	Test3	Computer Science	t	\N	\N	\N	f	\N
20	student4@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.089559	2025-11-06 23:16:55.089559	Student4	Test4	Computer Science	t	\N	\N	\N	f	\N
21	student5@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.090263	2025-11-06 23:16:55.090263	Student5	Test5	Computer Science	t	\N	\N	\N	f	\N
22	student6@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.090889	2025-11-06 23:16:55.090889	Student6	Test6	Computer Science	t	\N	\N	\N	f	\N
23	student7@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.091638	2025-11-06 23:16:55.091638	Student7	Test7	Computer Science	t	\N	\N	\N	f	\N
24	student8@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.092349	2025-11-06 23:16:55.092349	Student8	Test8	Computer Science	t	\N	\N	\N	f	\N
25	student9@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.092946	2025-11-06 23:16:55.092946	Student9	Test9	Computer Science	t	\N	\N	\N	f	\N
26	student10@lpubatangas.edu.ph	$2b$12$LQv3ctyqBWVHxkd0LHAkCOYzt1exuaQ3PwYGGkJaxozqkZKvz8N8i	student	2025-11-06 23:16:55.093487	2025-11-06 23:16:55.093487	Student10	Test10	Computer Science	t	\N	\N	\N	f	\N
\.


--
-- Name: analysis_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analysis_results_id_seq', 1, false);


--
-- Name: class_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_sections_id_seq', 1, false);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 10, true);


--
-- Name: department_heads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_heads_id_seq', 1, false);


--
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 5, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, false);


--
-- Name: evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evaluations_id_seq', 131, true);


--
-- Name: firebase_sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.firebase_sync_log_id_seq', 1, false);


--
-- Name: notification_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_queue_id_seq', 1, false);


--
-- Name: programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programs_id_seq', 25, true);


--
-- Name: secretary_users_secretary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.secretary_users_secretary_id_seq', 1, false);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- Name: analysis_results analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_pkey PRIMARY KEY (id);


--
-- Name: class_sections class_sections_class_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_sections
    ADD CONSTRAINT class_sections_class_code_key UNIQUE (class_code);


--
-- Name: class_sections class_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_sections
    ADD CONSTRAINT class_sections_pkey PRIMARY KEY (id);


--
-- Name: courses courses_course_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_course_code_key UNIQUE (course_code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: department_heads department_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_heads
    ADD CONSTRAINT department_heads_pkey PRIMARY KEY (id);


--
-- Name: departments departments_department_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_code_key UNIQUE (department_code);


--
-- Name: departments departments_department_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_name_key UNIQUE (department_name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_student_id_class_section_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_student_id_class_section_id_key UNIQUE (student_id, class_section_id);


--
-- Name: firebase_sync_log firebase_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.firebase_sync_log
    ADD CONSTRAINT firebase_sync_log_pkey PRIMARY KEY (id);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: programs programs_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_code_key UNIQUE (code);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: secretary_users secretary_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users
    ADD CONSTRAINT secretary_users_pkey PRIMARY KEY (secretary_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_id_key UNIQUE (student_id);


--
-- Name: students students_student_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_number_key UNIQUE (student_number);


--
-- Name: secretary_users unique_secretary_per_department; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users
    ADD CONSTRAINT unique_secretary_per_department UNIQUE (department_id);


--
-- Name: secretary_users unique_secretary_per_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users
    ADD CONSTRAINT unique_secretary_per_user UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_analysis_results_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analysis_results_date ON public.analysis_results USING btree (analysis_date);


--
-- Name: idx_analysis_results_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analysis_results_type ON public.analysis_results USING btree (analysis_type, class_section_id);


--
-- Name: idx_class_sections_instructor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_class_sections_instructor ON public.class_sections USING btree (instructor_id);


--
-- Name: idx_courses_program_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_program_year ON public.courses USING btree (program_id, year_level);


--
-- Name: idx_evaluations_anomaly; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_anomaly ON public.evaluations USING btree (is_anomaly, anomaly_score);


--
-- Name: idx_evaluations_class; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_class ON public.evaluations USING btree (class_section_id);


--
-- Name: idx_evaluations_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_date ON public.evaluations USING btree (submission_date);


--
-- Name: idx_evaluations_processing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_processing ON public.evaluations USING btree (processing_status, processed_at);


--
-- Name: idx_evaluations_sentiment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_sentiment ON public.evaluations USING btree (sentiment, sentiment_score);


--
-- Name: idx_evaluations_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluations_student ON public.evaluations USING btree (student_id);


--
-- Name: idx_firebase_sync; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_firebase_sync ON public.firebase_sync_log USING btree (table_name, record_id, sync_status);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notification_queue USING btree (user_id, status);


--
-- Name: idx_secretary_users_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_secretary_users_department ON public.secretary_users USING btree (department_id);


--
-- Name: idx_students_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_department ON public.students USING btree (department_id);


--
-- Name: idx_students_program_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_program_year ON public.students USING btree (program_id, year_level);


--
-- Name: idx_unique_analysis_per_class_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_unique_analysis_per_class_type ON public.analysis_results USING btree (class_section_id, analysis_type, ((analysis_date)::date));


--
-- Name: idx_users_department_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_department_role ON public.users USING btree (department_id, role);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: evaluations evaluation_firebase_sync; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER evaluation_firebase_sync AFTER INSERT OR UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.trigger_firebase_sync();


--
-- Name: analysis_results analysis_results_class_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_class_section_id_fkey FOREIGN KEY (class_section_id) REFERENCES public.class_sections(id);


--
-- Name: class_sections class_sections_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_sections
    ADD CONSTRAINT class_sections_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: class_sections class_sections_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_sections
    ADD CONSTRAINT class_sections_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: courses courses_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);


--
-- Name: department_heads department_heads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_heads
    ADD CONSTRAINT department_heads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_class_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_class_section_id_fkey FOREIGN KEY (class_section_id) REFERENCES public.class_sections(id);


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: evaluations evaluations_class_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_class_section_id_fkey FOREIGN KEY (class_section_id) REFERENCES public.class_sections(id);


--
-- Name: evaluations evaluations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: students fk_students_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_students_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: users fk_users_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: notification_queue notification_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: secretary_users secretary_users_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users
    ADD CONSTRAINT secretary_users_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: secretary_users secretary_users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users
    ADD CONSTRAINT secretary_users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: secretary_users secretary_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretary_users
    ADD CONSTRAINT secretary_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: students students_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict T1sLtiWyWAWrkcwN1SEJarfVNhufTgU2Y0R4edZYRdXl32oLNxPfTEIRXuptqBf

