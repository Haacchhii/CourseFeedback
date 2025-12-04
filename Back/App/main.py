# Course Feedback System Backend
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import threading
import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

# Import database components
try:
    from database.connection import engine, test_connection
    print("[DB] Testing database connection...")
    
    # Test connection with timeout
    connection_success = False
    def test_db():
        global connection_success
        connection_success = test_connection()
    
    test_thread = threading.Thread(target=test_db)
    test_thread.daemon = True
    test_thread.start()
    test_thread.join(timeout=5)  # Wait max 5 seconds
    
    if test_thread.is_alive():
        print("[WARN] Database connection timeout - server will start anyway")
    elif connection_success:
        print("[OK] Database ready!")
    else:
        print("[WARN] Database connection failed - server will start anyway")
except ImportError as e:
    print(f"[WARN] Database not configured: {e}")

# Import routes if they exist
try:
    from routes.auth import router as auth_router
    from routes.student import router as student_router
    from routes.admin import router as admin_router
    from routes.system_admin import router as system_admin_router
    from routes.department_head import router as department_head_router
    from routes.secretary import router as secretary_router
    from routes.evaluation_periods import router as periods_router
    from routes.student_advancement import router as advancement_router
    from routes.enrollment_list import router as enrollment_list_router
    from routes.notifications import router as notifications_router
    ROUTES_AVAILABLE = True
    print("[ROUTES] All routes loaded successfully")
except ImportError as e:
    print(f"[WARN] Routes not available: {e}")
    ROUTES_AVAILABLE = False

# Configure comprehensive logging
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# Create rotating file handler (10MB max, keep 5 backups)
file_handler = RotatingFileHandler(
    f'{log_dir}/app.log',
    maxBytes=10485760,  # 10MB
    backupCount=5
)
file_handler.setLevel(logging.ERROR)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

# Console handler for development
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter(
    '[%(levelname)s] %(message)s'
))

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler]
)

logger = logging.getLogger(__name__)
logger.info("=== Course Feedback System Starting ===")

app = FastAPI(
    title="Enhanced Course Feedback API", 
    description="FastAPI backend with ML sentiment analysis and secretary management",
    version="2.0.0"
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and log them"""
    logger.error(
        f"Unhandled exception: {exc}\n"
        f"Path: {request.url.path}\n"
        f"Method: {request.method}\n"
        f"Client: {request.client.host if request.client else 'unknown'}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again or contact support.",
            "timestamp": datetime.now().isoformat()
        }
    )

# Include routes if available
if ROUTES_AVAILABLE:
    app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
    app.include_router(student_router, prefix="/api/student", tags=["student"])
    # Register both admin routers under /api/admin prefix
    # system_admin_router has: /users, /users/{id}, /users/stats, etc.
    # admin_router has: /dashboard-stats, /courses, /evaluations, etc.
    app.include_router(system_admin_router, prefix="/api/admin", tags=["admin-users"])
    app.include_router(admin_router, prefix="/api/admin", tags=["admin-dashboard"])
    app.include_router(department_head_router, prefix="/api/dept-head", tags=["department-head"])
    app.include_router(secretary_router, prefix="/api/secretary", tags=["secretary"])
    app.include_router(periods_router, prefix="/api/evaluation-periods", tags=["evaluation-periods"])
    app.include_router(advancement_router, prefix="/api/student-management", tags=["student-advancement"])
    app.include_router(enrollment_list_router, prefix="/api/admin", tags=["enrollment-list"])
    app.include_router(notifications_router, prefix="/api", tags=["notifications"])
    print("[OK] API routes registered: auth, student, admin (users + dashboard + enrollment), dept-head, secretary, evaluation-periods, student-advancement, notifications")
    
    # Debug: Print all registered routes
    print("\n[INFO] Registered API Routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(route.methods) if route.methods else 'N/A'
            print(f"  {methods:10} {route.path}")

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Rate limiting middleware
try:
    from middleware.rate_limiter import rate_limit_middleware
    app.middleware("http")(rate_limit_middleware)
    print("[OK] Rate limiting enabled")
except ImportError:
    print("[WARN] Rate limiter not available")

# GZIP Compression middleware (compress responses > 1KB)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware - Updated to point to New/capstone frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default for New/capstone frontend
        "http://localhost:5174",  # Alternate port
        "http://localhost:5175",  # Alternate port
        "http://localhost:5176",  # Alternate port
        "http://127.0.0.1:5173",
        "http://localhost:5174",  # Alternate Vite port
        "http://127.0.0.1:5174",
        # Add production domain here when deploying
        # "https://your-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Middleware configured: Security Headers, Rate Limiting, GZIP, CORS")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Course Feedback API is running",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with database connectivity test"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {}
    }
    
    try:
        # Test database connection
        from database.connection import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
            health_status["components"]["database"] = {
                "status": "connected",
                "message": "PostgreSQL connection active"
            }
            logger.info("Health check: Database connection successful")
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["components"]["database"] = {
            "status": "error",
            "message": str(e)
        }
        logger.error(f"Health check: Database connection failed - {e}")
    
    # Check if routes are loaded
    health_status["components"]["routes"] = {
        "status": "loaded" if ROUTES_AVAILABLE else "unavailable",
        "count": len(app.routes)
    }
    
    # Check ML services
    try:
        from ml_services.sentiment_analyzer import sentiment_analyzer
        health_status["components"]["ml_sentiment"] = {
            "status": "available",
            "message": "Sentiment analysis model loaded"
        }
    except Exception as e:
        health_status["components"]["ml_sentiment"] = {
            "status": "unavailable",
            "message": str(e)
        }
    
    return health_status

# Note: Login endpoint removed from main.py - use /api/auth/login from routes/auth.py instead
# This prevents code duplication and ensures consistent authentication handling

logger.info("=== Course Feedback System Ready ===")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)