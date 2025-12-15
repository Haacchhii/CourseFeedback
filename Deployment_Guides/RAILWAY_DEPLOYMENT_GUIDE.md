# Railway Deployment Guide - Keep Supabase Database

## ✅ Why Railway?

- **No New Database Needed**: Keep your existing Supabase connection
- **No Migration**: All your data stays in Supabase
- **Free Tier**: $5 free credit per month (enough for development/thesis)
- **No Cold Starts**: Unlike Render's 15-minute sleep
- **Fast Setup**: 10 minutes from zero to deployed
- **Better Performance**: Faster than Render free tier

---

## 🚀 Quick Deploy (10 Minutes)

### Step 1: Prepare Your Backend (2 minutes)

Your backend is already configured! Just verify:

1. **Check `Back/App/config.py`** - should have:
```python
DATABASE_URL = os.getenv("DATABASE_URL", "your-supabase-connection")
```

2. **Supabase Connection String**:
```
postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

✅ **Nothing to change!** Railway will just use environment variables.

---

### Step 2: Deploy to Railway (5 minutes)

1. **Go to Railway**: https://railway.app

2. **Sign In**:
   - Click "Login"
   - Choose "Login with GitHub"
   - Authorize Railway

3. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `Haacchhii/CourseFeedback`
   - Click "Deploy Now"

4. **Configure Service**:
   - Railway will auto-detect your repo
   - Click on the deployed service
   - Go to "Settings"

5. **Set Root Directory**:
   ```
   Root Directory: Back
   ```

6. **Set Start Command**:
   ```
   Start Command: cd App && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

7. **Add Environment Variables**:
   - Click "Variables" tab
   - Click "New Variable"
   - Add these:

   ```
   DATABASE_URL=postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   
   SECRET_KEY=bi7Mqp89qPyvXFqp0dlbhmTCuL8NfSazk3GHnFT3WB0
   
   ENVIRONMENT=production
   ```

8. **Deploy**:
   - Railway will automatically deploy
   - Wait 2-3 minutes for build
   - Copy your Railway URL (e.g., `https://coursefeedback-production.up.railway.app`)

---

### Step 3: Verify Backend (1 minute)

1. **Test Swagger UI**:
   - Visit: `https://[your-railway-url].railway.app/docs`
   - You should see FastAPI Swagger interface
   - Try the "GET /api/auth/test" endpoint

2. **Check Logs**:
   - Go to Railway dashboard
   - Click "Deployments"
   - View logs to ensure no errors
   - Look for: "Application startup complete"

---

### Step 4: Deploy Frontend to Vercel (5 minutes)

1. **Go to Vercel**: https://vercel.com

2. **Sign In with GitHub**

3. **Import Project**:
   - Click "Add New" → "Project"
   - Select: `Haacchhii/CourseFeedback`
   - Click "Import"

4. **Configure Build Settings**:
   ```
   Framework Preset: Vite
   Root Directory: New/capstone
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Add Environment Variable**:
   - Click "Environment Variables"
   - Add:
   ```
   Name: VITE_API_BASE_URL
   Value: https://[your-railway-url].railway.app/api
   ```
   ⚠️ **Replace `[your-railway-url]` with your actual Railway URL!**

6. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your Vercel URL

---

### Step 5: Update CORS (2 minutes)

1. **Go Back to Railway**:
   - Open your backend project
   - Click "Variables"

2. **Add CORS Variable**:
   ```
   FRONTEND_URL=https://[your-vercel-url].vercel.app
   CORS_ORIGINS=https://[your-vercel-url].vercel.app
   ```
   ⚠️ **Replace `[your-vercel-url]` with your actual Vercel URL!**

3. **Redeploy**:
   - Railway will auto-redeploy with new variables
   - Wait 1-2 minutes

---

## ✅ Verification Checklist

### Backend Health:
- [ ] Visit `https://[railway-url].railway.app/docs`
- [ ] Swagger UI loads successfully
- [ ] See all your API endpoints listed
- [ ] No database connection errors in Railway logs
- [ ] Try a test endpoint (returns 200 OK)

### Frontend Health:
- [ ] Visit `https://[vercel-url].vercel.app`
- [ ] Login page displays with LPU branding
- [ ] No console errors (F12 → Console)
- [ ] Network tab shows API calls to Railway URL
- [ ] Images and CSS load correctly

### Integration Test:
- [ ] Try logging in with test credentials
- [ ] Dashboard loads with data
- [ ] Navigate between pages (no errors)
- [ ] Check evaluations display correctly
- [ ] Verify all graphs/charts render

---

## 🎯 Your Deployment URLs

After deployment, you'll have:

```
Frontend:  https://[your-app].vercel.app
Backend:   https://[your-app].railway.app
Database:  Supabase (unchanged)
           postgresql://postgres.esdohggqyckrtlpzbyhh:...
```

**No database migration needed!** ✅

---

## 💰 Cost Breakdown

| Service | Cost | What You Get |
|---------|------|--------------|
| **Railway** | FREE | $5 credit/month (~500 hours runtime) |
| **Vercel** | FREE | Unlimited bandwidth, global CDN |
| **Supabase** | FREE | 500MB database, 2GB bandwidth |
| **Total** | **$0/month** | Professional production setup |

---

## 🔧 Common Issues & Solutions

### Issue: "Module not found" Error

**Solution**: Check `Back/requirements.txt` has all dependencies:
```bash
fastapi==0.104.1
uvicorn==0.24.0
psycopg[binary]==3.1.13
# ... etc
```

If missing, Railway logs will show which package. Add to `requirements.txt` and push to GitHub.

---

### Issue: Database Connection Timeout

**Solution**: Check Railway environment variables:
- Verify `DATABASE_URL` is correct
- Ensure Supabase allows connections from Railway's IP (it should by default)
- Check Supabase dashboard for connection errors

---

### Issue: CORS Error in Browser

**Solution**: 
1. Verify `CORS_ORIGINS` in Railway matches your exact Vercel URL
2. No trailing slash in CORS_ORIGINS
3. Include `https://` protocol
4. Railway should auto-redeploy after variable changes

---

### Issue: Frontend Can't Connect to Backend

**Solution**:
1. Check Vercel environment variable `VITE_API_BASE_URL`
2. Must include `/api` at the end
3. Must be Railway URL, not Render
4. Redeploy frontend after changing env vars

---

## 🎓 For Thesis Defense

### Test Before Presentation:

1. **Different Network Test**:
   - Test on mobile data (not school/home WiFi)
   - Verify it works from different locations

2. **Load Test**:
   - Have 2-3 people use it simultaneously
   - Check if Railway handles the load

3. **Backup Plan**:
   - Keep Render deployment as backup
   - Have both URLs ready
   - If Railway has issues, switch DNS

### During Presentation:

- Open your app 5 minutes before presenting (warm up Railway)
- Have Swagger docs ready (`/docs`) to show API
- Bookmark key pages (Dashboard, Evaluations, Analytics)
- Clear browser cache if needed

---

## 🚀 Updating Your App

### To Update Backend:

1. Make changes locally
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```
3. Railway auto-deploys from GitHub
4. Check logs to verify deployment

### To Update Frontend:

1. Make changes locally
2. Push to GitHub (same as backend)
3. Vercel auto-deploys from GitHub
4. Check Vercel dashboard for build status

**Both services auto-deploy on every push to `main` branch!** 🎉

---

## 📊 Monitoring

### Railway Dashboard:
- **Metrics**: View CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deploys
- **Usage**: Track your $5 credit usage

### Vercel Dashboard:
- **Analytics**: Page views, performance
- **Deployments**: Build logs and status
- **Preview**: Test branches before merging

### Supabase Dashboard:
- **Database**: Monitor connections, queries
- **API**: Usage statistics
- **Logs**: Database query logs

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Vercel: Add custom domain in settings (free SSL)
   - Railway: Add custom domain in settings (free SSL)

2. **Environment Configs**:
   - Create `.env.production` for production-only settings
   - Never commit secrets to GitHub

3. **Monitoring Setup**:
   - Add UptimeRobot to ping Railway every 5 mins (optional, Railway doesn't sleep like Render)
   - Set up Sentry for error tracking

4. **Performance Optimization**:
   - Railway analytics will show bottlenecks
   - Optimize slow API endpoints
   - Add caching if needed

---

## ✅ Advantages Over Render

| Feature | Railway | Render Free |
|---------|---------|-------------|
| **Cold Starts** | Never | Every 15 minutes |
| **Build Time** | 1-2 minutes | 3-5 minutes |
| **Performance** | Faster | Slower |
| **Database** | Optional | Must create |
| **Logs** | Better UI | Basic |
| **Auto-Deploy** | GitHub push | GitHub push |
| **Cost** | $5 free/month | Free (limited) |

---

## 🎊 Summary

**What You're Keeping**:
- ✅ Supabase database (all your data)
- ✅ Your existing code (no changes needed)
- ✅ GitHub repository (same repo)

**What's Changing**:
- Backend: Render → Railway (better performance, no cold starts)
- Frontend: Adding Vercel deployment (faster than Render)

**Total Setup Time**: ~15 minutes
**Total Cost**: $0/month
**Difficulty**: Easy (just environment variables)

---

## 📞 Need Help?

If you encounter issues:

1. **Check Railway Logs**: Dashboard → Logs (shows exact errors)
2. **Check Vercel Logs**: Deployments → View Function Logs
3. **Check Supabase**: Dashboard → Logs (database errors)
4. **Browser Console**: F12 → Console (frontend errors)

Common error patterns:
- "Module not found" → Missing dependency in `requirements.txt`
- "Connection refused" → Wrong `DATABASE_URL`
- "CORS error" → Wrong `CORS_ORIGINS` or missing `FRONTEND_URL`
- "404 on API calls" → Wrong `VITE_API_BASE_URL` in Vercel

---

## 🎯 Ready to Deploy?

Follow Steps 1-5 above, and you'll have a production-ready app in 15 minutes!

**Your architecture will be**:
```
User Browser
    ↓
Vercel (Frontend - React)
    ↓
Railway (Backend - FastAPI)
    ↓
Supabase (Database - PostgreSQL) ← YOUR EXISTING DATA
```

**No database migration, no data loss, no hassle!** ✅
