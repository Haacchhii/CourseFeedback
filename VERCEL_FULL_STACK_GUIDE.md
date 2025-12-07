# Vercel Full Stack Deployment Guide

## ⚠️ IMPORTANT: Vercel Backend Limitations

**Vercel is NOT designed for traditional FastAPI servers.** Here's what you need to know:

### Vercel Serverless Constraints:
- **Execution Time Limit**: 10 seconds (free tier), 60 seconds (paid)
- **Cold Starts**: Every request after inactivity
- **No WebSockets**: Not supported in serverless
- **Stateless**: Each request is independent
- **No Background Jobs**: Can't run cron jobs or scheduled tasks

### Your FastAPI Backend Issues:
- Database connection pooling won't work (reconnects every request)
- ML model loading will timeout (needs to load every request)
- CSV export generation may exceed 10-second limit
- Sentiment analysis may be too slow for serverless

---

## 🎯 Recommended Architecture

### **OPTION 1: Hybrid (BEST for Your Use Case)**
```
Frontend:  Vercel (React + Vite)         → FREE, fast, reliable
Backend:   Railway (FastAPI)             → FREE $5/month credit, no limits
Database:  Supabase PostgreSQL           → FREE, keep existing data
```

**Why This Works:**
- ✅ No code changes needed
- ✅ No execution time limits
- ✅ Database connections work properly
- ✅ ML models load once and stay in memory
- ✅ CSV exports work without timeouts
- ✅ Professional performance for thesis defense

**Setup Time:** 15 minutes total

---

### **OPTION 2: Vercel Frontend Only (Quick Start)**
```
Frontend:  Vercel (React + Vite)         → Deploy now
Backend:   Render (existing)             → Already deployed
Database:  Supabase PostgreSQL           → No changes
```

**Quick Steps:**
1. Update Render backend `DATABASE_URL` to Supabase
2. Deploy frontend to Vercel
3. Done!

**Setup Time:** 5 minutes

---

### **OPTION 3: Vercel Full Stack (NOT RECOMMENDED)**
Convert FastAPI to serverless functions - requires major refactoring:
- Split routes into individual serverless functions
- Remove database connection pooling
- Lazy-load ML models per request
- Optimize all queries for <10 second execution
- Rewrite CSV export to streaming

**Setup Time:** 2-3 days of work ⚠️

---

## 🚀 Quick Deploy: Vercel Frontend + Railway Backend

### Step 1: Deploy Backend to Railway (10 minutes)

1. **Go to Railway**: https://railway.app
2. **Sign in with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `Haacchhii/CourseFeedback`
5. **Configure Service**:
   ```
   Name: coursefeedback-backend
   Root Directory: Back
   Start Command: cd App && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

6. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   SECRET_KEY=bi7Mqp89qPyvXFqp0dlbhmTCuL8NfSazk3GHnFT3WB0
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

7. **Deploy** → Copy the Railway URL (e.g., `https://coursefeedback-production.up.railway.app`)

8. **Add CORS** after first deploy:
   - Go to Variables
   - Add `CORS_ORIGINS=https://your-frontend-url.vercel.app`

### Step 2: Deploy Frontend to Vercel (5 minutes)

1. **Go to Vercel**: https://vercel.com
2. **Sign in with GitHub**
3. **Import Project**: `Haacchhii/CourseFeedback`
4. **Configure**:
   ```
   Framework Preset: Vite
   Root Directory: New/capstone
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Environment Variable**:
   ```
   Name: VITE_API_BASE_URL
   Value: https://[your-railway-url].railway.app/api
   ```

6. **Deploy** → Copy your Vercel URL

7. **Update Railway CORS**:
   - Go back to Railway
   - Update `CORS_ORIGINS` with your actual Vercel URL

### Step 3: Verification

**Frontend Checks:**
- [ ] Visit your Vercel URL
- [ ] Login page loads
- [ ] No console errors
- [ ] DevTools shows API calls to Railway URL

**Backend Checks:**
- [ ] Visit `https://[railway-url].railway.app/docs`
- [ ] Swagger UI displays
- [ ] Try a test endpoint (e.g., `/api/auth/test`)

**Integration Test:**
- [ ] Try logging in with test credentials
- [ ] Check if data loads on dashboard
- [ ] Verify evaluations display correctly

---

## 🔧 Alternative: Keep Render Backend

If you want to keep your existing Render backend:

### Update Render Environment Variables:

1. Go to Render Dashboard
2. Select `coursefeedback-backend`
3. Environment → Add/Edit:
   ```
   DATABASE_URL=postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   FRONTEND_URL=https://[your-vercel-url].vercel.app
   CORS_ORIGINS=https://[your-vercel-url].vercel.app
   ```
4. Save (auto-redeploys)

### Deploy Frontend to Vercel:
- Follow Step 2 above
- Use Render URL instead: `VITE_API_BASE_URL=https://coursefeedback-3tn8.onrender.com/api`

**Note:** Render free tier has 15-minute cold start. Set up UptimeRobot to ping every 14 minutes:
- Monitor URL: `https://coursefeedback-3tn8.onrender.com/docs`
- Interval: 14 minutes
- Purpose: Keep backend warm during thesis presentation

---

## 📊 Architecture Comparison

| Feature | Railway | Render Free | Vercel Serverless |
|---------|---------|-------------|-------------------|
| **Cost** | FREE ($5/mo credit) | FREE | FREE |
| **Cold Start** | None | 15 minutes | Every request |
| **Execution Limit** | None | None | 10 seconds |
| **Database Pooling** | ✅ Yes | ✅ Yes | ❌ No |
| **ML Models** | ✅ Loads once | ✅ Loads once | ❌ Every request |
| **CSV Exports** | ✅ Works | ✅ Works | ⚠️ May timeout |
| **WebSockets** | ✅ Yes | ✅ Yes | ❌ No |
| **Setup Time** | 10 min | 0 min (done) | 2-3 days |
| **Best For** | Production | Demo/Testing | Static APIs |

---

## 🎓 For Thesis Defense

### Recommended Setup:
```
✅ Vercel Frontend (instant global CDN)
✅ Railway Backend (no cold starts, $5 free credit lasts months)
✅ Supabase Database (keep existing data, no migration)
```

### Why This Wins:
1. **Professional Performance**: No 15-minute cold start embarrassment
2. **Reliable**: Won't timeout during complex operations
3. **Fast Setup**: 15 minutes vs. days of refactoring
4. **Zero Cost**: All free tiers
5. **No Code Changes**: Deploy as-is

---

## 🚨 If You Still Want Vercel Backend

You'll need to refactor:

1. **Convert to Serverless Functions**:
   ```python
   # Current: Back/App/main.py (traditional server)
   # Needed: Back/api/*.py (individual functions)
   ```

2. **Remove Connection Pooling**:
   ```python
   # Current: Persistent database pool
   # Needed: Connect/disconnect per request
   ```

3. **Lazy Load Models**:
   ```python
   # Current: Load ML models at startup
   # Needed: Load on first request, cache somehow
   ```

4. **Optimize Everything for <10 seconds**:
   - Simplify queries
   - Remove complex joins
   - Limit result sets
   - Stream large responses

**Estimated Effort**: 2-3 days of work + testing

**Recommendation**: **DON'T DO THIS before thesis defense.** Too risky.

---

## 🎯 Quick Decision Matrix

**Choose Railway if:**
- ✅ You want best performance
- ✅ No cold starts matter
- ✅ 10 minutes setup is acceptable
- ✅ You want professional production experience

**Choose Render (existing) if:**
- ✅ Backend already works
- ✅ Can set up UptimeRobot ping
- ✅ 15-min cold start is acceptable
- ✅ Want fastest deployment (5 min)

**Choose Vercel Backend if:**
- ❌ You have 2-3 days to refactor
- ❌ You're okay with 10-second timeouts
- ❌ You don't need database pooling
- ❌ You want a learning challenge

---

## 📞 Next Steps

**Tell me which option you prefer:**

1. **"Use Railway backend"** → I'll give you exact Railway deployment commands
2. **"Keep Render backend"** → I'll help you update DATABASE_URL and deploy to Vercel
3. **"Try Vercel backend anyway"** → I'll start the refactoring (but seriously, consider option 1 or 2)

**My Recommendation**: Option 1 (Railway) - best balance of performance, reliability, and setup time for your thesis defense.
