"""
FINAL END-TO-END SYSTEM TEST
Tests all critical user journeys for thesis presentation
"""
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def print_header(title, level=1):
    if level == 1:
        print("\n" + "=" * 70)
        print(f"  {title}")
        print("=" * 70)
    else:
        print(f"\n  {title}")
        print("  " + "-" * 60)

def main():
    session = Session()
    
    try:
        from models.enhanced_models import (
            User, Student, Course, ClassSection, Enrollment, Evaluation,
            EvaluationPeriod, Secretary, DepartmentHead, Program
        )
        
        print("\n" + "█" * 70)
        print("█" + " " * 68 + "█")
        print("█" + "  FINAL END-TO-END SYSTEM TEST".center(68) + "█")
        print("█" + "  Course Feedback Evaluation System".center(68) + "█")
        print("█" + " " * 68 + "█")
        print("█" * 70)
        
        # ===================================================================
        # TEST SUITE 1: AUTHENTICATION & ROLE ACCESS
        # ===================================================================
        print_header("TEST SUITE 1: AUTHENTICATION & ROLE ACCESS")
        
        # Test 1.1: Secretary accounts
        print_header("1.1 Secretary Accounts", 2)
        secretaries = session.query(Secretary).all()
        print(f"   Total Secretaries: {len(secretaries)}")
        for sec in secretaries[:3]:
            user = session.query(User).filter(User.id == sec.user_id).first()
            print(f"   - {sec.first_name} {sec.last_name} ({user.email if user else 'No user'})")
        
        # Test 1.2: Department Head accounts
        print_header("1.2 Department Head Accounts", 2)
        dept_heads = session.query(DepartmentHead).all()
        print(f"   Total Department Heads: {len(dept_heads)}")
        for dh in dept_heads[:3]:
            user = session.query(User).filter(User.id == dh.user_id).first()
            print(f"   - {dh.first_name} {dh.last_name} ({user.email if user else 'No user'})")
            if dh.programs:
                print(f"     Programs: {dh.programs}")
        
        # Test 1.3: Student accounts
        print_header("1.3 Student Accounts", 2)
        students_count = session.query(Student).count()
        active_students = session.query(Student).filter(Student.is_active == True).count()
        print(f"   Total Students: {students_count}")
        print(f"   Active Students: {active_students}")
        
        # ===================================================================
        # TEST SUITE 2: ACTIVE EVALUATION PERIOD
        # ===================================================================
        print_header("TEST SUITE 2: ACTIVE EVALUATION PERIOD")
        
        active_period = session.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == 'active'
        ).first()
        
        if not active_period:
            print("   ❌ CRITICAL: No active period found!")
            return
        
        print(f"   ✅ Active Period Found:")
        print(f"      ID: {active_period.id}")
        print(f"      Name: {active_period.name}")
        print(f"      Status: {active_period.status}")
        print(f"      Start: {active_period.start_date}")
        print(f"      End: {active_period.end_date}")
        
        # ===================================================================
        # TEST SUITE 3: ENROLLMENT DATA
        # ===================================================================
        print_header("TEST SUITE 3: ENROLLMENT DATA")
        
        total_enrollments = session.query(Enrollment).count()
        active_enrollments = session.query(Enrollment).filter(
            Enrollment.status == 'active'
        ).count()
        period_enrollments = session.query(Enrollment).filter(
            Enrollment.evaluation_period_id == active_period.id
        ).count()
        
        print(f"   Total Enrollments: {total_enrollments}")
        print(f"   Active Enrollments: {active_enrollments}")
        print(f"   Linked to Active Period: {period_enrollments}")
        
        if period_enrollments == 0:
            print("   ❌ WARNING: No enrollments linked to active period!")
        else:
            print("   ✅ Enrollments properly linked")
        
        # ===================================================================
        # TEST SUITE 4: EVALUATION COMPLETION STATUS
        # ===================================================================
        print_header("TEST SUITE 4: EVALUATION COMPLETION STATUS")
        
        total_evals = session.query(Evaluation).count()
        completed_evals = session.query(Evaluation).filter(
            Evaluation.status == 'completed'
        ).count()
        pending_evals = session.query(Evaluation).filter(
            Evaluation.status == 'pending'
        ).count()
        period_evals = session.query(Evaluation).filter(
            Evaluation.evaluation_period_id == active_period.id
        ).count()
        
        completion_rate = (completed_evals / total_evals * 100) if total_evals > 0 else 0
        
        print(f"   Total Evaluations: {total_evals}")
        print(f"   Completed: {completed_evals}")
        print(f"   Pending: {pending_evals}")
        print(f"   In Active Period: {period_evals}")
        print(f"   Completion Rate: {completion_rate:.1f}%")
        
        if completed_evals == 0:
            print("   ❌ CRITICAL: No completed evaluations!")
            return
        else:
            print("   ✅ System has completed evaluations")
        
        # ===================================================================
        # TEST SUITE 5: RATING DATA QUALITY
        # ===================================================================
        print_header("TEST SUITE 5: RATING DATA QUALITY")
        
        avg_ratings = session.query(
            func.avg(Evaluation.rating_overall).label('overall'),
            func.avg(Evaluation.rating_teaching).label('teaching'),
            func.avg(Evaluation.rating_content).label('content'),
            func.avg(Evaluation.rating_engagement).label('engagement')
        ).filter(
            Evaluation.status == 'completed'
        ).first()
        
        print(f"   Average Ratings (1-4 scale):")
        print(f"      Overall: {avg_ratings.overall:.2f}")
        print(f"      Teaching: {avg_ratings.teaching:.2f}")
        print(f"      Content: {avg_ratings.content:.2f}")
        print(f"      Engagement: {avg_ratings.engagement:.2f}")
        
        # Check data completeness
        with_ratings = session.query(Evaluation).filter(
            Evaluation.status == 'completed',
            Evaluation.rating_overall.isnot(None)
        ).count()
        
        print(f"\n   Data Completeness:")
        print(f"      Completed with ratings: {with_ratings}/{completed_evals} ({with_ratings/completed_evals*100:.1f}%)")
        
        # ===================================================================
        # TEST SUITE 6: ML ANALYSIS DATA
        # ===================================================================
        print_header("TEST SUITE 6: ML ANALYSIS DATA")
        
        # Sentiment distribution
        sentiment_dist = session.query(
            Evaluation.sentiment,
            func.count(Evaluation.id)
        ).filter(
            Evaluation.status == 'completed'
        ).group_by(Evaluation.sentiment).all()
        
        print(f"   Sentiment Distribution:")
        for sentiment, count in sentiment_dist:
            percentage = (count / completed_evals * 100) if completed_evals > 0 else 0
            print(f"      {sentiment or 'NULL'}: {count} ({percentage:.1f}%)")
        
        # Sentiment score statistics
        sentiment_stats = session.query(
            func.min(Evaluation.sentiment_score).label('min'),
            func.max(Evaluation.sentiment_score).label('max'),
            func.avg(Evaluation.sentiment_score).label('avg')
        ).filter(
            Evaluation.status == 'completed',
            Evaluation.sentiment_score.isnot(None)
        ).first()
        
        if sentiment_stats.avg:
            print(f"\n   Sentiment Score Stats (0-1 scale):")
            print(f"      Min: {sentiment_stats.min:.3f}")
            print(f"      Max: {sentiment_stats.max:.3f}")
            print(f"      Avg: {sentiment_stats.avg:.3f}")
        
        # Anomaly detection
        anomaly_count = session.query(Evaluation).filter(
            Evaluation.is_anomaly == True
        ).count()
        
        print(f"\n   Anomaly Detection:")
        print(f"      Detected Anomalies: {anomaly_count}")
        if anomaly_count == 0:
            print(f"      ⚠️ No anomalies (acceptable for demo data)")
        else:
            print(f"      ✅ Anomalies detected")
        
        # ===================================================================
        # TEST SUITE 7: COURSE & SECTION DATA
        # ===================================================================
        print_header("TEST SUITE 7: COURSE & SECTION DATA")
        
        total_courses = session.query(Course).count()
        active_courses = session.query(Course).filter(Course.is_active == True).count()
        total_sections = session.query(ClassSection).count()
        
        print(f"   Courses: {total_courses} total, {active_courses} active")
        print(f"   Class Sections: {total_sections}")
        
        # Sections with evaluations
        sections_with_evals = session.query(
            func.count(func.distinct(Evaluation.class_section_id))
        ).filter(
            Evaluation.status == 'completed'
        ).scalar()
        
        print(f"   Sections with Completed Evals: {sections_with_evals}")
        
        # ===================================================================
        # TEST SUITE 8: DASHBOARD QUERIES (SECRETARY/DEPT HEAD)
        # ===================================================================
        print_header("TEST SUITE 8: DASHBOARD QUERIES")
        
        print_header("8.1 Dashboard Metrics Query", 2)
        dashboard_metrics = session.query(
            func.count(func.distinct(Evaluation.class_section_id)).label('sections'),
            func.count(Evaluation.id).label('evaluations'),
            func.avg(Evaluation.rating_overall).label('avg_rating')
        ).filter(
            Evaluation.status == 'completed',
            Evaluation.evaluation_period_id == active_period.id
        ).first()
        
        print(f"   Sections with Evals: {dashboard_metrics.sections}")
        print(f"   Total Evaluations: {dashboard_metrics.evaluations}")
        print(f"   Average Rating: {dashboard_metrics.avg_rating:.2f}")
        
        print_header("8.2 Courses List Query", 2)
        courses_query = session.query(
            ClassSection, Course
        ).join(
            Course, ClassSection.course_id == Course.id
        ).outerjoin(
            Evaluation, ClassSection.id == Evaluation.class_section_id
        ).filter(
            Evaluation.status == 'completed'
        ).group_by(ClassSection.id, Course.id).limit(5).all()
        
        print(f"   Retrieved {len(courses_query)} courses/sections")
        
        print_header("8.3 Sentiment Analysis Query", 2)
        sentiment_query = session.query(
            Evaluation.sentiment,
            func.count(Evaluation.id)
        ).filter(
            Evaluation.evaluation_period_id == active_period.id,
            Evaluation.status == 'completed'
        ).group_by(Evaluation.sentiment).all()
        
        print(f"   Sentiment categories: {len(sentiment_query)}")
        for sent, count in sentiment_query:
            print(f"      {sent}: {count}")
        
        print_header("8.4 Completion Tracker Query", 2)
        completion_query = session.query(
            ClassSection.id,
            func.count(func.distinct(Enrollment.student_id)).label('enrolled'),
            func.count(func.distinct(Evaluation.id)).label('completed')
        ).join(
            Enrollment, ClassSection.id == Enrollment.class_section_id
        ).outerjoin(
            Evaluation,
            (ClassSection.id == Evaluation.class_section_id) &
            (Enrollment.student_id == Evaluation.student_id) &
            (Evaluation.status == 'completed')
        ).group_by(ClassSection.id).limit(5).all()
        
        print(f"   Retrieved {len(completion_query)} sections")
        for section_id, enrolled, completed in completion_query:
            rate = (completed / enrolled * 100) if enrolled > 0 else 0
            print(f"      Section {section_id}: {completed}/{enrolled} ({rate:.0f}%)")
        
        # ===================================================================
        # TEST SUITE 9: SYSTEM READINESS
        # ===================================================================
        print_header("TEST SUITE 9: SYSTEM READINESS CHECKLIST")
        
        checks = []
        checks.append(("Active evaluation period exists", active_period is not None))
        checks.append(("Enrollments linked to period", period_enrollments > 0))
        checks.append(("Completed evaluations exist", completed_evals > 0))
        checks.append(("Completion rate > 50%", completion_rate > 50))
        checks.append(("Sentiment data populated", sentiment_stats.avg is not None))
        checks.append(("Average rating > 3.0", avg_ratings.overall > 3.0))
        checks.append(("Dashboard queries work", len(courses_query) > 0))
        checks.append(("ML fields populated", sentiment_dist and len(sentiment_dist) > 0))
        
        passed = sum(1 for _, result in checks if result)
        total = len(checks)
        
        print(f"\n   System Readiness: {passed}/{total} checks passed")
        print()
        for check, result in checks:
            status = "✅" if result else "❌"
            print(f"   {status} {check}")
        
        # ===================================================================
        # FINAL VERDICT
        # ===================================================================
        print("\n" + "=" * 70)
        if passed == total:
            print("   ✅✅✅ SYSTEM READY FOR THESIS PRESENTATION ✅✅✅")
            print("   All critical tests passed!")
        elif passed >= total * 0.8:
            print("   ⚠️ SYSTEM MOSTLY READY")
            print(f"   {passed}/{total} checks passed - review failed items")
        else:
            print("   ❌ SYSTEM NOT READY")
            print(f"   Only {passed}/{total} checks passed - critical issues exist")
        print("=" * 70)
        
        print("\n" + "█" * 70)
        print("█" + "  END-TO-END TEST COMPLETE".center(68) + "█")
        print("█" * 70 + "\n")
        
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
