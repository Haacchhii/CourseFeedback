# Render.com Deployment Guide

## Quick Deployment Steps

### 1. Prepare Your Repository
```powershell
# Make sure all changes are committed
git add .
git commit -m "Configure for Render deployment"
git push origin feature/secretary-depthead-overhaul
```

### 2. Sign Up for Render.com
- Go to https://render.com
- Sign up with GitHub
- Authorize Render to access your repository

### 3. Create PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `coursefeedback-db`
   - **Database:** `coursefeedback`
   - **User:** `coursefeedback`
   - **Region:** Singapore (or closest to you)
   - **Plan:** Free
3. Click **"Create Database"**
4. **IMPORTANT:** Copy the **Internal Database URL** (starts with `postgresql://`)

### 4. Deploy Backend (FastAPI)
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `coursefeedback-backend`
   - **Region:** Singapore
   - **Branch:** `feature/secretary-depthead-overhaul`
   - **Root Directory:** `Back/App`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r ../requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables** (click "Add Environment Variable"):
   ```
   DATABASE_URL = [postgresql://coursefeedback:MGgvOljlqDJMQPm8cyon832dHMkXdTZu@dpg-d4dk4rripnbc73a49ocg-a/coursefeedback]
   SECRET_KEY = [generate a random string, e.g., use: openssl rand -hex 32]
   CORS_ORIGINS = *
   DEBUG = False
   ```
5. Click **"Create Web Service"**
6. **Copy your backend URL** (e.g., `https://coursefeedback-backend.onrender.com`)

### 5. Deploy Frontend (React + Vite)
1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `coursefeedback-frontend`
   - **Region:** Singapore
   - **Branch:** `feature/secretary-depthead-overhaul`
   - **Root Directory:** `New/capstone`
   - **Build Command:** `npm ci && npx vite build`
   - **Publish Directory:** `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL = https://coursefeedback-backend.onrender.com/api
   ```
   (Use the backend URL from step 4, add `/api` at the end)
5. Click **"Create Static Site"**

### 6. Access Your Application
- Frontend URL: `https://coursefeedback-frontend.onrender.com`
- Backend API: `https://coursefeedback-backend.onrender.com/docs` (API documentation)

### 7. Setup Database Tables
Once backend is deployed:
1. Go to your backend URL: `https://coursefeedback-backend.onrender.com`
2. Run database migrations or import your SQL schema through Render's PostgreSQL dashboard

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month free tier

✅ **Benefits:**
- Automatic HTTPS
- Auto-deploy on git push
- Built-in monitoring
- Free PostgreSQL database

---

## Troubleshooting

### Backend won't start:
- Check logs in Render dashboard
- Verify DATABASE_URL is correct
- Make sure requirements.txt has all dependencies

### Frontend can't connect to backend:
- Verify VITE_API_URL is correct (must include `/api`)
- Check CORS_ORIGINS in backend includes `*` or your frontend URL
- Check backend logs for CORS errors

### Database connection fails:
- Use **Internal Database URL** for backend (not External)
- Verify database credentials
- Check if database is in same region as backend

---

## Local Testing Before Deploy

Test environment variables locally:
```powershell
# Backend
cd "C:\Users\Jose Iturralde\Documents\1 thesis\Back\App"
$env:DATABASE_URL="postgresql://user:pass@localhost/db"
$env:SECRET_KEY="test-secret-key"
python main.py

# Frontend
cd "C:\Users\Jose Iturralde\Documents\1 thesis\New\capstone"
$env:VITE_API_URL="http://localhost:8000/api"
npm run dev
```
