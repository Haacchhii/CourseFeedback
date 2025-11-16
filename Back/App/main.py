# Course Feedback System Backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import database components
try:
    from database.connection import engine, test_connection
    print("🔌 Testing database connection...")
    if test_connection():
        print("✅ Database ready!")
    else:
        print("⚠️ Database connection failed - using mock data")
except ImportError as e:
    print(f"⚠️ Database not configured: {e}")

# Import routes if they exist
try:
    from routes.auth import router as auth_router
    from routes.student import router as student_router
    from routes.admin import router as admin_router
    from routes.system_admin import router as system_admin_router
    from routes.department_head import router as department_head_router
    from routes.secretary import router as secretary_router
    ROUTES_AVAILABLE = True
    print("🛣️ All routes loaded successfully")
except ImportError as e:
    print(f"⚠️ Routes not available: {e}")
    ROUTES_AVAILABLE = False

app = FastAPI(
    title="Enhanced Course Feedback API", 
    description="FastAPI backend with ML sentiment analysis and secretary management",
    version="2.0.0"
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
    print("✅ API routes registered: auth, student, admin (users + dashboard), dept-head, secretary")
    
    # Debug: Print all registered routes
    print("\n🔍 Registered API Routes:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(route.methods) if route.methods else 'N/A'
            print(f"  {methods:10} {route.path}")

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
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Course Feedback API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Course Feedback API is operational"
    }

# Database-driven login endpoint with bcrypt password verification
@app.post("/api/auth/login")
async def login(request: dict):
    email = request.get("email", "").lower()
    password = request.get("password", "")
    
    try:
        from database.connection import engine
        from sqlalchemy import text
        import bcrypt
        
        # Query your existing database for user
        with engine.connect() as conn:
            # Get user with password hash
            result = conn.execute(
                text("SELECT u.id, u.email, u.role, u.password_hash, u.first_name, u.last_name, u.is_active FROM users u WHERE LOWER(u.email) = :email AND u.is_active = true"), 
                {"email": email}
            )
            user_data = result.fetchone()
            
            if user_data:
                user_dict = dict(user_data._mapping)
                stored_password_hash = user_dict['password_hash']
                
                # Verify password with bcrypt
                if bcrypt.checkpw(password.encode('utf-8'), stored_password_hash.encode('utf-8')):
                    # Successful authentication
                    user_name = f"{user_dict['first_name']} {user_dict['last_name']}"
                    
                    # Update last login
                    conn.execute(
                        text("UPDATE users SET last_login = NOW() WHERE id = :user_id"),
                        {"user_id": user_dict['id']}
                    )
                    conn.commit()
                    
                    return {
                        "success": True,
                        "user": {
                            "id": user_dict['id'],
                            "email": user_dict['email'],
                            "role": user_dict['role'],
                            "name": user_name,
                            "department": "Academic Affairs"
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": "Invalid password"
                    }
            else:
                return {
                    "success": False,
                    "message": "User not found or inactive"
                }
    
    except Exception as e:
        print(f"Database login error: {e}")
        return {
            "success": False,
            "message": "Authentication service temporarily unavailable"
        }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)