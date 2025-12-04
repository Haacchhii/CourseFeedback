# 🚀 LPU Course Feedback System - Production Deployment Guide

**Last Updated:** December 2, 2025  
**System Version:** 1.0  
**Target Platform:** Supabase (Database) + Render/Railway (Backend) + Vercel/Netlify (Frontend)

---

## 📋 Pre-Deployment Checklist

### Before You Begin:
- [ ] All tests passing locally
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] Official LPU logo file added to project
- [ ] Cross-browser testing completed (Chrome, Edge, Firefox)
- [ ] Mobile responsiveness verified

---

## 🗄️ PART 1: Database Setup (Supabase)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Configure:
   - **Name:** `lpu-course-feedback-prod`
   - **Database Password:** Generate strong password (save to password manager)
   - **Region:** Choose closest to Philippines (Singapore recommended)
   - **Plan:** Free tier for pilot, Pro for production

### Step 2: Initialize Database Schema
1. Open Supabase SQL Editor
2. Run scripts in order:
   ```
   Back/database_schema/DATABASE_COMPLETE_SETUP.sql
   Back/database_schema/17_ADD_PERFORMANCE_INDEXES_SEMESTER.sql
   ```
3. Verify tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   Expected: 12+ tables

### Step 3: Configure Database Settings
1. Navigate to Settings → Database
2. **Enable Connection Pooling:**
   - Mode: `Transaction`
   - Pool Size: `15` (adjust based on expected traffic)
3. **Note these values:**
   - Connection String (Direct)
   - Connection String (Pooling)
   - API URL
   - Service Role Key (keep secret!)

### Step 4: Set Up Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (backend access)
CREATE POLICY "Service role bypass" ON users
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON students
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON evaluations
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass" ON audit_logs
FOR ALL USING (auth.role() = 'service_role');
```

### Step 5: Enable Automatic Backups
1. Go to Settings → Database → Backups
2. Verify daily backups are enabled (Pro plan feature)
3. For Free plan: Schedule manual weekly backups

---

## 🐍 PART 2: Backend Deployment (Render/Railway)

### Option A: Deploy to Render

#### Step 1: Prepare Repository
```powershell
# Create production branch
git checkout -b production
git push origin production
```

#### Step 2: Create Render Web Service
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name:** `lpu-feedback-backend`
   - **Branch:** `production`
   - **Root Directory:** `Back/App`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Starter ($7/month) or higher

#### Step 3: Set Environment Variables
Add in Render Dashboard → Environment:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=notifications@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

#### Step 4: Deploy and Verify
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Test endpoints:
   ```bash
   # Health check
   curl https://lpu-feedback-backend.onrender.com/health
   
   # API docs
   https://lpu-feedback-backend.onrender.com/docs
   ```

### Option B: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select repository
4. Configure:
   - **Root Directory:** `Back/App`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add same environment variables as Render
6. Deploy and get railway.app URL

---

## ⚛️ PART 3: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Build
```powershell
cd New/capstone

# Update .env.production
VITE_API_BASE_URL=https://lpu-feedback-backend.onrender.com/api

# Test production build locally
npm run build
npm run preview
```

### Step 2: Deploy to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy:
   ```powershell
   cd New/capstone
   vercel --prod
   ```
4. Or use Vercel Dashboard:
   - Import GitHub repository
   - Root Directory: `New/capstone`
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 3: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_BASE_URL=https://lpu-feedback-backend.onrender.com/api
VITE_APP_NAME=LPU Course Feedback System
VITE_APP_VERSION=1.0.0
```

### Step 4: Set Up Custom Domain (Optional)
1. Go to Vercel → Settings → Domains
2. Add custom domain: `feedback.lpu.edu.ph`
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## 🔐 PART 4: Security Configuration

### Backend CORS Setup
In `Back/App/main.py`, verify CORS origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.vercel.app",
        "https://feedback.lpu.edu.ph"  # Custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting (Add to main.py)
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to sensitive endpoints
@app.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(request: Request, ...):
    ...
```

Install slowapi:
```powershell
pip install slowapi
# Add to requirements.txt
```

---

## 📊 PART 5: Post-Deployment Verification

### Test Critical Flows:
1. **Authentication:**
   - [ ] Admin login successful
   - [ ] Student login successful
   - [ ] Staff login successful
   - [ ] Password reset works

2. **Student Evaluation:**
   - [ ] View enrolled courses
   - [ ] Submit evaluation (31 questions)
   - [ ] Cannot edit after submission
   - [ ] ML sentiment classification works

3. **Staff Dashboard:**
   - [ ] View sentiment analysis
   - [ ] View anomaly detection
   - [ ] Export data to CSV
   - [ ] Filter by semester works

4. **Admin Functions:**
   - [ ] Create evaluation period
   - [ ] Manage users
   - [ ] View audit logs
   - [ ] Bulk import courses

### Performance Checks:
```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-backend.com/api/health

# Load test with Apache Bench (optional)
ab -n 1000 -c 10 https://your-backend.com/api/health
```

---

## 🔄 PART 6: Ongoing Maintenance

### Weekly Tasks:
- [ ] Review error logs
- [ ] Check database size
- [ ] Verify backups are running
- [ ] Monitor response times

### Monthly Tasks:
- [ ] Update dependencies
- [ ] Review audit logs for suspicious activity
- [ ] Clean up old temporary data
- [ ] Test backup restoration

### Semester Tasks:
- [ ] Create new evaluation period
- [ ] Archive previous semester data (optional)
- [ ] Update course listings
- [ ] Verify student enrollments

---

## 🆘 PART 7: Troubleshooting Guide

### Issue: Backend Not Starting
**Symptom:** Deployment fails or crashes on startup  
**Solutions:**
1. Check environment variables are set correctly
2. Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
3. Check logs: `render logs` or Railway dashboard
4. Ensure all dependencies in requirements.txt

### Issue: Database Connection Timeout
**Symptom:** "could not connect to server" errors  
**Solutions:**
1. Verify Supabase project is not paused (Free tier auto-pauses)
2. Check connection pooling settings
3. Increase `pool_timeout` in `connection.py`
4. Use Supabase connection pooler URL (not direct)

### Issue: CORS Errors
**Symptom:** Frontend shows "blocked by CORS policy"  
**Solutions:**
1. Add frontend URL to CORS_ORIGINS environment variable
2. Verify protocol (http vs https) matches
3. Check no trailing slashes in URLs
4. Restart backend service after changes

### Issue: Slow Query Performance
**Symptom:** Dashboards load slowly with lots of data  
**Solutions:**
1. Run performance indexes script: `17_ADD_PERFORMANCE_INDEXES_SEMESTER.sql`
2. Run `ANALYZE` on large tables
3. Increase connection pool size
4. Check query plans with `EXPLAIN ANALYZE`

### Issue: Email Notifications Not Sending
**Symptom:** Users not receiving password reset emails  
**Solutions:**
1. Verify RESEND_API_KEY or SMTP credentials
2. Check email service logs
3. Ensure EMAIL_FROM domain is verified
4. Test with email service's test endpoint

---

## 📞 PART 8: Support Contacts

### Services:
- **Supabase Support:** support@supabase.io
- **Render Support:** support@render.com
- **Vercel Support:** support@vercel.com

### Documentation:
- **Supabase:** https://supabase.com/docs
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **FastAPI:** https://fastapi.tiangolo.com

---

## 🎯 Production Readiness Checklist

Before going live:
- [ ] All environment variables set in production
- [ ] Database indexes created (performance optimization)
- [ ] CORS properly configured
- [ ] Rate limiting enabled on auth endpoints
- [ ] SSL certificates active (automatic with Vercel/Render)
- [ ] Backup strategy verified
- [ ] Admin accounts created with strong passwords
- [ ] Test data cleared from production database
- [ ] Error tracking configured (optional but recommended)
- [ ] Monitoring/uptime checks configured (optional)
- [ ] Documentation shared with LPU IT team
- [ ] Training session conducted with staff users

---

## 📝 Rollback Procedure

If deployment fails or critical bugs found:

### Database Rollback:
```sql
-- Restore from Supabase backup
-- Go to Dashboard → Database → Backups → Restore
```

### Backend Rollback:
```bash
# In Render/Railway dashboard
# Settings → Rollback to previous deployment
```

### Frontend Rollback:
```bash
# Vercel CLI
vercel rollback
```

---

**Deployment Owner:** Jose Iturralde  
**Last Successful Deployment:** [Date]  
**Production URL:** [Your URL here]  
**Status Page:** [Optional - setup status.io or similar]
