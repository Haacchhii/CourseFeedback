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
    ROUTES_AVAILABLE = True
    print("🛣️ Routes loaded successfully")
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
    app.include_router(student_router, prefix="/api", tags=["student"])
    app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
    print("✅ API routes registered")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5174", "http://localhost:5175"],
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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)