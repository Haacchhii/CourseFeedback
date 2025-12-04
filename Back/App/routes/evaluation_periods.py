"""
Evaluation Periods API Routes
Provides endpoints for retrieving evaluation periods for filtering dashboards and reports
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from database.connection import get_db
from models.enhanced_models import EvaluationPeriod
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/periods")
async def get_evaluation_periods(
    include_archived: bool = Query(False),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all evaluation periods for dropdown selection in dashboards and reports.
    
    Parameters:
    - include_archived: Include periods older than 1 year (default: False)
    - status: Filter by status (active, closed, upcoming)
    
    Returns list of periods sorted by most recent first
    """
    try:
        query = db.query(EvaluationPeriod)
        
        # Filter by archived status if column exists
        if not include_archived:
            try:
                query = query.filter(
                    or_(
                        EvaluationPeriod.archived == False,
                        EvaluationPeriod.archived.is_(None)
                    )
                )
            except:
                # Column doesn't exist yet, skip this filter
                pass
        
        # Filter by status if provided
        if status:
            query = query.filter(EvaluationPeriod.status == status)
        
        # Get all periods, sorted by most recent first
        periods = query.order_by(desc(EvaluationPeriod.end_date)).all()
        
        return {
            "success": True,
            "data": [
                {
                    "id": p.id,
                    "name": p.name,
                    "semester": p.semester,
                    "academic_year": p.academic_year,
                    "status": p.status,
                    "start_date": p.start_date.isoformat() if p.start_date else None,
                    "end_date": p.end_date.isoformat() if p.end_date else None,
                    "is_active": p.status == 'active',
                    "is_closed": p.status == 'closed',
                    "is_upcoming": p.status == 'upcoming'
                }
                for p in periods
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching evaluation periods: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch evaluation periods: {str(e)}")


@router.get("/periods/active")
async def get_active_period(
    db: Session = Depends(get_db)
):
    """
    Get the currently active evaluation period.
    Returns the period with status='active', or None if no active period.
    """
    try:
        period = db.query(EvaluationPeriod).filter(
            EvaluationPeriod.status == 'active'
        ).first()
        
        if not period:
            return {
                "success": True,
                "data": None,
                "message": "No active evaluation period"
            }
        
        return {
            "success": True,
            "data": {
                "id": period.id,
                "name": period.name,
                "semester": period.semester,
                "academic_year": period.academic_year,
                "status": period.status,
                "start_date": period.start_date.isoformat() if period.start_date else None,
                "end_date": period.end_date.isoformat() if period.end_date else None,
                "is_active": True
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching active period: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch active period: {str(e)}")


@router.get("/periods/{period_id}")
async def get_period_by_id(
    period_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific evaluation period by ID.
    """
    try:
        period = db.query(EvaluationPeriod).filter(EvaluationPeriod.id == period_id).first()
        
        if not period:
            raise HTTPException(status_code=404, detail="Evaluation period not found")
        
        return {
            "success": True,
            "data": {
                "id": period.id,
                "name": period.name,
                "semester": period.semester,
                "academic_year": period.academic_year,
                "status": period.status,
                "start_date": period.start_date.isoformat() if period.start_date else None,
                "end_date": period.end_date.isoformat() if period.end_date else None,
                "is_active": period.status == 'active',
                "is_closed": period.status == 'closed',
                "is_upcoming": period.status == 'upcoming'
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching period {period_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch period: {str(e)}")
