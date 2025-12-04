# Rate Limiting Configuration Guide

**System:** LPU Course Feedback System  
**Date:** December 2, 2025

---

## 📋 Overview

This guide explains how to implement rate limiting to prevent API abuse and ensure system stability under high load.

---

## 🔧 Installation

Add slowapi to requirements:

```bash
pip install slowapi
```

Add to `Back/App/requirements.txt`:
```
slowapi==0.1.9
```

---

## 💻 Implementation

### Step 1: Update `Back/App/main.py`

Add rate limiting imports and configuration at the top of the file:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### Step 2: Apply Rate Limits to Authentication Endpoints

```python
from fastapi import Request

@app.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 login attempts per minute per IP
async def login(request: Request, credentials: dict = Body(...), db: Session = Depends(get_db)):
    """User login with rate limiting"""
    # ... existing login code ...

@app.post("/api/auth/forgot-password")
@limiter.limit("3/minute")  # 3 password reset requests per minute per IP
async def forgot_password(request: Request, email: str = Body(...), db: Session = Depends(get_db)):
    """Password reset with rate limiting"""
    # ... existing code ...

@app.post("/api/auth/reset-password")
@limiter.limit("5/minute")  # 5 password reset attempts per minute per IP
async def reset_password(request: Request, data: dict = Body(...), db: Session = Depends(get_db)):
    """Password reset confirmation with rate limiting"""
    # ... existing code ...
```

### Step 3: Apply Rate Limits to Data Export

```python
@app.get("/api/admin/export/{table_name}")
@limiter.limit("10/hour")  # 10 exports per hour per IP
async def export_data(
    request: Request,
    table_name: str,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Export data with rate limiting"""
    # ... existing export code ...
```

### Step 4: Apply Rate Limits to Evaluation Submission

```python
@app.post("/api/student/evaluate")
@limiter.limit("30/minute")  # 30 evaluations per minute (reasonable for form submission)
async def submit_evaluation(
    request: Request,
    evaluation_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Submit evaluation with rate limiting"""
    # ... existing evaluation code ...
```

---

## 🎯 Recommended Rate Limits

| Endpoint | Limit | Reasoning |
|----------|-------|-----------|
| **Authentication** | | |
| `/api/auth/login` | 5/minute | Prevents brute force attacks |
| `/api/auth/forgot-password` | 3/minute | Prevents email spam |
| `/api/auth/reset-password` | 5/minute | Prevents password reset abuse |
| **Student Operations** | | |
| `/api/student/evaluate` | 30/minute | Normal form submission pace |
| `/api/student/courses` | 60/minute | Frequent page refreshes acceptable |
| **Staff/Admin** | | |
| `/api/admin/export/*` | 10/hour | Expensive operations |
| `/api/admin/users` | 100/minute | Dashboard operations |
| `/api/staff/sentiment` | 100/minute | Analytics dashboards |
| **Default (All others)** | 200/minute | General API usage |

---

## 🔍 Custom Rate Limiting Strategies

### Per-User Rate Limiting

Instead of per-IP, limit by authenticated user:

```python
def get_user_id(request: Request) -> str:
    """Extract user ID from JWT token for rate limiting"""
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            # Decode JWT to get user_id
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return f"user:{payload.get('user_id', 'anonymous')}"
    except:
        pass
    return f"ip:{get_remote_address(request)}"

# Use custom key function
limiter = Limiter(key_func=get_user_id, default_limits=["200/minute"])
```

### Different Limits by Role

```python
@app.get("/api/admin/users")
@limiter.limit("1000/minute")  # Admins get higher limits
async def get_users(request: Request, ...):
    # Admin endpoint with generous rate limit
    pass

@app.get("/api/student/courses")
@limiter.limit("60/minute")  # Students get standard limits
async def get_student_courses(request: Request, ...):
    # Student endpoint with moderate rate limit
    pass
```

### Exempt Internal Services

```python
@app.get("/api/internal/health")
@limiter.exempt  # No rate limiting for health checks
async def health_check():
    return {"status": "healthy"}
```

---

## 🚨 Error Responses

When rate limit is exceeded, API returns:

```json
{
  "error": "Rate limit exceeded: 5 per 1 minute",
  "detail": "Too many requests. Please try again later."
}
```

HTTP Status Code: `429 Too Many Requests`

Headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## 🧪 Testing Rate Limits

### Manual Testing

```bash
# Test login rate limit (should fail after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

### Python Testing Script

```python
import requests
import time

# Test rate limiting
url = "http://localhost:8000/api/auth/login"
data = {"email": "test@test.com", "password": "wrong"}

for i in range(10):
    response = requests.post(url, json=data)
    print(f"Attempt {i+1}: Status {response.status_code}")
    if response.status_code == 429:
        print(f"✅ Rate limit working! Blocked at attempt {i+1}")
        break
    time.sleep(0.5)
```

---

## 📊 Monitoring Rate Limits

### Add Logging

```python
@app.middleware("http")
async def log_rate_limits(request: Request, call_next):
    response = await call_next(request)
    
    # Log rate limit info
    if hasattr(response, "headers"):
        limit = response.headers.get("X-RateLimit-Limit")
        remaining = response.headers.get("X-RateLimit-Remaining")
        
        if limit and remaining:
            print(f"Rate limit: {remaining}/{limit} remaining for {request.client.host}")
    
    return response
```

### Check Rate Limit Status

```python
@app.get("/api/rate-limit-status")
async def rate_limit_status(request: Request):
    """Check current rate limit status for client"""
    # Return current rate limit info
    return {
        "ip": get_remote_address(request),
        "limits": limiter.get_current_limit(request)
    }
```

---

## 🔄 Storage Backends

### Default (Memory) - Development

```python
limiter = Limiter(key_func=get_remote_address)
```

**Pros:** Simple, no dependencies  
**Cons:** Doesn't work across multiple server instances

### Redis - Production Recommended

```python
from slowapi.util import get_remote_address
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)
```

**Pros:** Works across multiple servers, persistent  
**Cons:** Requires Redis instance

Installation:
```bash
pip install redis
```

---

## ⚙️ Configuration Options

### Environment Variables

Add to `.env`:

```bash
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORAGE=memory  # or redis://host:port
RATE_LIMIT_DEFAULT=200/minute
RATE_LIMIT_LOGIN=5/minute
RATE_LIMIT_EXPORT=10/hour
```

### Dynamic Configuration

```python
import os

# Read from environment
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
DEFAULT_LIMIT = os.getenv("RATE_LIMIT_DEFAULT", "200/minute")

if RATE_LIMIT_ENABLED:
    limiter = Limiter(key_func=get_remote_address, default_limits=[DEFAULT_LIMIT])
else:
    print("⚠️ Rate limiting disabled")
    limiter = None  # Disable rate limiting
```

---

## 📝 Best Practices

### 1. Start Conservative, Increase Gradually
- Begin with strict limits
- Monitor actual usage patterns
- Increase limits based on real user needs

### 2. Communicate Limits to Users
- Document rate limits in API docs
- Include limits in error messages
- Provide contact for limit increases

### 3. Differentiate by Endpoint Importance
- Stricter limits on auth endpoints (abuse prevention)
- Generous limits on read-only operations
- Moderate limits on data modifications

### 4. Use Appropriate Time Windows
- Seconds: Very sensitive operations (password reset)
- Minutes: Authentication, form submissions
- Hours: Expensive operations (exports, reports)
- Days: Account creation, bulk operations

### 5. Combine with Other Security Measures
- Rate limiting + CAPTCHA for auth
- Rate limiting + JWT expiration
- Rate limiting + IP whitelisting (for APIs)

---

## 🚀 Production Deployment

### Step 1: Install Redis (Recommended)

**Using Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Using Render/Railway:**
- Add Redis service in dashboard
- Copy connection URL
- Update RATE_LIMIT_STORAGE in environment

### Step 2: Update Rate Limiter

```python
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("RATE_LIMIT_STORAGE", "memory://")
)
```

### Step 3: Deploy and Monitor

- Watch for 429 errors in logs
- Adjust limits based on usage patterns
- Alert on abnormal rate limit hits (potential attack)

---

## 🛑 Emergency Response

### If Under Attack (DDoS):

1. **Temporarily Lower Limits:**
   ```python
   limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
   ```

2. **Enable Stricter Auth Limits:**
   ```python
   @limiter.limit("1/minute")  # Very restrictive
   async def login(request: Request, ...):
   ```

3. **Whitelist Known IPs:**
   ```python
   @app.middleware("http")
   async def whitelist_check(request: Request, call_next):
       whitelisted_ips = ["192.168.1.1", "10.0.0.1"]
       if request.client.host in whitelisted_ips:
           request.state.skip_rate_limit = True
       return await call_next(request)
   ```

4. **Use Cloud WAF:**
   - Cloudflare (free tier available)
   - AWS WAF
   - Google Cloud Armor

---

**Document Owner:** Jose Iturralde  
**Status:** Implementation Guide  
**Last Updated:** December 2, 2025
