# 🔍 SECURITY & WEAKNESS AUDIT REPORT
**LPU Course Feedback System**  
**Date:** December 2, 2025  
**Auditor:** Security Scan  
**Status:** CRITICAL ISSUES FOUND

---

## 🚨 CRITICAL SECURITY VULNERABILITIES

### 1. **EXPOSED CREDENTIALS IN .ENV FILE** 🔴 CRITICAL
**File:** `Back/App/.env`  
**Risk Level:** CRITICAL  
**Impact:** Complete system compromise

**Exposed Information:**
```
DATABASE_URL=postgresql+psycopg://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
SECRET_KEY=bi7Mqp89qPyvXFqp0dlbhmTCuL8NfSazk3GHnFT3WB0
SMTP_USERNAME=joseirineo0418@gmail.com
SMTP_PASSWORD=uzgslgndwfddyqhl
```

**Consequences:**
- ❌ Database password exposed: `Napakabangis0518`
- ❌ JWT secret key exposed - attackers can forge admin tokens
- ❌ Email account compromised - can send phishing emails
- ❌ Full database access - can steal all student data
- ❌ .env file likely committed to Git history

**IMMEDIATE ACTION REQUIRED:**
```bash
# 1. Rotate ALL credentials immediately
# 2. Check Git history
git log --all --full-history -- "**/.env"

# 3. Remove from Git if committed
git filter-repo --path Back/App/.env --invert-paths

# 4. Update .gitignore
echo "*.env" >> .gitignore
echo ".env*" >> .gitignore

# 5. Change Supabase password (Dashboard → Database → Settings)
# 6. Generate new JWT secret:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 7. Create new Gmail app password
# Google Account → Security → 2-Step Verification → App Passwords
```

---

### 2. **WEAK JWT SECRET KEY** 🔴 CRITICAL
**File:** `Back/App/routes/auth.py` (line 20)  
**Risk Level:** CRITICAL

**Issue:**
```python
SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-key-not-for-production")
```

**Problems:**
- Default fallback key is weak and predictable
- If SECRET_KEY not set, system uses insecure default
- Token can be forged, allowing attackers to impersonate any user

**Fix Required:**
```python
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "dev-fallback-key-not-for-production":
    raise ValueError("SECRET_KEY must be set in environment variables with a strong random value")
```

---

### 3. **NO AUTHENTICATION ON ENDPOINTS** 🔴 CRITICAL
**Files:** All routes in `Back/App/routes/*.py`  
**Risk Level:** CRITICAL

**Issue:**
- No `Depends(get_current_user)` or authentication middleware
- All API endpoints are publicly accessible
- Anyone can access admin functions without logging in

**Vulnerable Endpoints:**
```python
# system_admin.py
@router.get("/users")  # No authentication
@router.post("/users")  # No authentication
@router.delete("/users/{user_id}")  # No authentication
@router.post("/evaluation-periods")  # No authentication

# ALL endpoints lack authentication checks
```

**Attack Scenarios:**
1. Anyone can create admin accounts
2. Anyone can delete all users
3. Anyone can view all student evaluations
4. Anyone can modify evaluation periods

**Fix Required:**
```python
from fastapi import Depends
from auth import get_current_user, require_role

@router.get("/users")
async def get_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is admin
    if current_user['role'] not in ['admin', 'secretary']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    # ... existing code
```

---

### 4. **DUPLICATE LOGIN ENDPOINTS WITH DIFFERENT SECURITY** 🔴 HIGH
**Files:** `Back/App/main.py` and `Back/App/routes/auth.py`

**Issue:**
- Two login endpoints exist: `/api/auth/login` (main.py) and auth route
- main.py endpoint has weaker security
- Inconsistent password verification
- Confusion about which endpoint is used

**Fix:** Consolidate to single auth route with proper security

---

### 5. **SENSITIVE DATA IN LOCALSTORAGE** 🟡 MEDIUM
**File:** `New/capstone/src/services/api.js`

**Issue:**
```javascript
localStorage.setItem('token', response.token)
localStorage.setItem('user', JSON.stringify(response.user))
localStorage.setItem('role', response.user.role)
```

**Problems:**
- JWT tokens stored in localStorage vulnerable to XSS
- User data persists after logout (browser close)
- Accessible to all JavaScript on page

**Better Approach:**
- Use httpOnly cookies for tokens (immune to XSS)
- Or use sessionStorage (cleared on tab close)
- Encrypt sensitive data before storing

---

### 6. **OVERLY PERMISSIVE CORS** 🟡 MEDIUM
**File:** `Back/App/main.py` (lines 79-91)

**Issue:**
```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # Duplicate
    "http://127.0.0.1:5174"
],
allow_credentials=True,
allow_methods=["*"],  # Allows ALL methods
allow_headers=["*"],  # Allows ALL headers
```

**Problems:**
- Too many origins allowed (increases attack surface)
- Wildcards (`*`) too permissive
- Production URLs not configured

**Fix:**
```python
import os

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # From environment
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # Specific methods
    allow_headers=["Content-Type", "Authorization"],  # Specific headers
    max_age=3600  # Cache preflight for 1 hour
)
```

---

## 🟠 HIGH PRIORITY ISSUES

### 7. **NO RATE LIMITING IMPLEMENTED** 🟠 HIGH
**Status:** Guide created but not implemented

**Risk:**
- Brute force attacks on login (unlimited attempts)
- API abuse (spam evaluation submissions)
- DDoS vulnerability

**Impact:**
- Password can be guessed with automated tools
- System can be overwhelmed
- Database exhaustion

**Action:** Implement rate limiting from `RATE_LIMITING_GUIDE.md`

---

### 8. **WEAK PASSWORD POLICY** 🟠 HIGH
**Files:** User creation endpoints

**Issue:**
- No minimum password length enforced
- No complexity requirements (uppercase, numbers, symbols)
- No password strength validation
- Passwords like "123456" accepted

**Fix Required:**
```python
import re

def validate_password(password: str) -> bool:
    """
    Enforce password policy:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character")
    
    return True
```

---

### 9. **NO INPUT VALIDATION** 🟠 HIGH
**Files:** All route handlers

**Issues:**
- Email not validated (can submit invalid emails)
- No length limits on text fields (DoS via large inputs)
- No sanitization of user input
- SQL injection risk (mitigated by ORM but not guaranteed)

**Example Vulnerability:**
```python
# No validation on email format
email = request.email  # Could be "not-an-email"

# No validation on comment length
comment = request.comment  # Could be 10MB of text
```

**Fix:**
```python
from pydantic import BaseModel, EmailStr, constr

class EvaluationRequest(BaseModel):
    email: EmailStr  # Validates email format
    comment: constr(max_length=5000)  # Limits to 5000 chars
    rating: int = Field(ge=1, le=4)  # Between 1-4 only
```

---

### 10. **NO CSRF PROTECTION** 🟠 HIGH
**Risk:** Cross-Site Request Forgery attacks

**Issue:**
- No CSRF tokens on state-changing operations
- Attacker can trick logged-in users into performing actions

**Attack Scenario:**
```html
<!-- Attacker's website -->
<img src="http://your-api.com/api/admin/users/123?action=delete">
<!-- If user is logged in, this deletes user #123 -->
```

**Fix:** Implement CSRF tokens or SameSite cookies

---

## 🟡 MEDIUM PRIORITY ISSUES

### 11. **VERBOSE ERROR MESSAGES** 🟡 MEDIUM
**Files:** All exception handlers

**Issue:**
```python
except Exception as e:
    print(f"Database login error: {e}")
    return {
        "success": False,
        "message": "Authentication service temporarily unavailable"
    }
```

**Problem:** Stack traces may leak sensitive information in logs

**Better Approach:**
```python
except Exception as e:
    logger.error(f"Login error for {email[:3]}***@***: {type(e).__name__}")
    # Don't log full exception details
    return {"success": False, "message": "Authentication failed"}
```

---

### 12. **NO SECURITY HEADERS** 🟡 MEDIUM
**File:** `Back/App/main.py`

**Missing Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Fix:**
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

---

### 13. **TIMING ATTACK VULNERABILITY** 🟡 MEDIUM
**File:** `Back/App/routes/auth.py`

**Issue:**
```python
if not user_data:
    return LoginResponse(success=False, message="Invalid email or password")

if not bcrypt.checkpw(...):
    return LoginResponse(success=False, message="Invalid email or password")
```

**Problem:** Different response times reveal if email exists
- Non-existent email: Fast response
- Wrong password: Slow response (bcrypt verification)

**Fix:** Always run bcrypt even for non-existent users:
```python
# Always verify password to prevent timing attacks
dummy_hash = "$2b$12$dummyhashdummyhashdummyhashdummyhashdummyhash"
if not user_data:
    bcrypt.checkpw(password.encode('utf-8'), dummy_hash.encode('utf-8'))
    return LoginResponse(success=False, message="Invalid email or password")
```

---

### 14. **NO SESSION TIMEOUT** 🟡 MEDIUM
**File:** `Back/App/routes/auth.py`

**Issue:**
```python
ACCESS_TOKEN_EXPIRE_HOURS = 24
```

**Problem:**
- Tokens valid for 24 hours even after logout
- No way to invalidate stolen tokens
- No token refresh mechanism

**Better Approach:**
- Reduce token lifetime to 1-2 hours
- Implement refresh tokens
- Maintain token blacklist for logout

---

### 15. **UNENCRYPTED DATABASE PASSWORD** 🟡 MEDIUM
**File:** `.env` (committed to repository)

**Issue:** Database credentials stored in plain text

**Fix:**
- Use environment variables from hosting platform
- Use secret management services (AWS Secrets Manager, etc.)
- Never commit `.env` files

---

## 🟢 LOW PRIORITY / INFORMATIONAL

### 16. **MISSING AUDIT LOGGING FOR SECURITY EVENTS**
- Failed login attempts not logged properly
- Password changes not logged
- Permission changes not logged

### 17. **NO ACCOUNT LOCKOUT**
- Unlimited login attempts allowed
- No temporary ban after X failed attempts

### 18. **HARDCODED CONFIGURATION VALUES**
- Some timeouts and limits hardcoded
- Should be configurable via environment

### 19. **NO HTTPS ENFORCEMENT**
- API accepts HTTP connections
- Should redirect HTTP → HTTPS in production

### 20. **BROAD EXCEPTION CATCHING**
```python
except Exception as e:  # Too broad, catches everything
    pass
```
Should catch specific exceptions

---

## 📊 VULNERABILITY SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 4 | **IMMEDIATE ACTION REQUIRED** |
| 🟠 HIGH | 6 | Fix before production |
| 🟡 MEDIUM | 5 | Fix during hardening phase |
| 🟢 LOW | 5 | Nice to have |
| **TOTAL** | **20** | |

---

## 🚨 IMMEDIATE ACTIONS (DO TODAY)

1. **ROTATE ALL CREDENTIALS** - Database password, JWT secret, email password
2. **REMOVE .ENV FROM GIT** - Check history and purge
3. **IMPLEMENT AUTHENTICATION** - Add auth middleware to all endpoints
4. **IMPLEMENT RATE LIMITING** - At minimum on login endpoint
5. **FIX CORS CONFIGURATION** - Remove wildcards, use environment variable

---

## 📋 REMEDIATION PRIORITY

### Phase 1 (This Week):
- [ ] Rotate all exposed credentials
- [ ] Implement endpoint authentication
- [ ] Add rate limiting to login
- [ ] Fix CORS configuration
- [ ] Remove .env from Git history

### Phase 2 (Before Production):
- [ ] Implement password policy
- [ ] Add input validation with Pydantic
- [ ] Add security headers
- [ ] Implement CSRF protection
- [ ] Add session timeout/refresh

### Phase 3 (Hardening):
- [ ] Enhance audit logging
- [ ] Add account lockout
- [ ] Implement HTTPS enforcement
- [ ] Add monitoring/alerting
- [ ] Penetration testing

---

## 🛡️ RECOMMENDED SECURITY TOOLS

1. **Bandit** - Python security linter
   ```bash
   pip install bandit
   bandit -r Back/App
   ```

2. **Safety** - Check for known vulnerabilities
   ```bash
   pip install safety
   safety check
   ```

3. **OWASP ZAP** - Web application security scanner
4. **Git-secrets** - Prevent committing secrets
5. **pre-commit hooks** - Automated security checks

---

## 📞 CRITICAL CONTACTS

**If credentials compromised:**
1. Immediately change Supabase password
2. Rotate JWT secret and force logout all users
3. Review audit logs for suspicious activity
4. Notify users if data breach occurred

---

**Report Generated:** December 2, 2025  
**Next Audit Due:** After remediation  
**Risk Level:** 🔴 **CRITICAL - NOT PRODUCTION READY**

**Key Takeaway:** System has excellent features but CRITICAL security holes that must be fixed before any production deployment. The exposed .env file alone is a complete system compromise.
