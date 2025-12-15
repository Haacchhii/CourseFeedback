# Vercel Deployment Guide for Course Feedback System

## 🚀 Quick Deploy (5 minutes)

### Step 1: Sign Up & Connect GitHub

1. Go to **https://vercel.com**
2. Click **"Start Deploying"** or **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

---

### Step 2: Import Your Repository

1. Click **"Add New..."** → **"Project"**
2. Find your repository: **`Haacchhii/CourseFeedback`**
3. Click **"Import"**

---

### Step 3: Configure Project Settings

#### Build & Development Settings:

- **Framework Preset**: `Vite`
- **Root Directory**: `New/capstone`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Environment Variables (CRITICAL):

Click **"Environment Variables"** and add:

```
VITE_API_BASE_URL=https://coursefeedback-3tn8.onrender.com/api
```

(Or use your Railway/other backend URL when ready)

---

### Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Your site will be live at: `https://your-project-name.vercel.app`

---

## 📱 What About the Backend?

**Vercel is for FRONTEND ONLY.** For your backend, you have 2 options:

### Option A: Keep Render Backend (Current Setup)
- ✅ Already deployed at `https://coursefeedback-3tn8.onrender.com`
- ✅ Just update DATABASE_URL to point to Supabase
- ✅ Set FRONTEND_URL to your new Vercel URL

**Steps:**
1. Go to Render → coursefeedback-backend
2. Environment → Update variables:
   ```
   DATABASE_URL=postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   FRONTEND_URL=https://your-vercel-app.vercel.app
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```
3. Save (auto-redeploys)

### Option B: Deploy Backend to Railway (Recommended)
- ⚡ Faster than Render free tier
- 💰 $5/month free credit
- 🚀 No cold starts

**Quick Railway Setup:**
1. Go to **https://railway.app**
2. Sign in with GitHub
3. New Project → Deploy from GitHub repo
4. Select `Haacchhii/CourseFeedback`
5. Root Directory: `Back`
6. Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   SECRET_KEY=bi7Mqp89qPyvXFqp0dlbhmTCuL8NfSazk3GHnFT3WB0
   FRONTEND_URL=https://your-vercel-app.vercel.app
   CORS_ORIGINS=https://your-vercel-app.vercel.app
   ```
7. Deploy!

---

## 🔧 Post-Deployment Configuration

### Update Frontend Environment Variable

After backend is deployed, update Vercel:

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Edit `VITE_API_BASE_URL`:
   - Render: `https://coursefeedback-3tn8.onrender.com/api`
   - Railway: `https://your-backend.railway.app/api`
4. Save
5. Redeploy: Deployments → Latest → Click ⋯ → "Redeploy"

---

## ✅ Verification Checklist

- [ ] Frontend loads at Vercel URL
- [ ] Login page appears with LPU branding
- [ ] Open browser DevTools → Network tab
- [ ] Try to login (even if it fails)
- [ ] Check API calls go to correct backend URL
- [ ] No CORS errors in console
- [ ] Backend responds (check `/docs` endpoint)

---

## 🐛 Troubleshooting

### "API call failed" / Network errors
- Check `VITE_API_BASE_URL` is correct in Vercel
- Must include `/api` at the end
- Must be HTTPS (not HTTP)
- Redeploy after changing env vars

### CORS Errors
- Update backend `CORS_ORIGINS` to include Vercel URL
- Must match exactly (no trailing slash)
- Restart backend service

### Backend not responding
- Check backend logs in Render/Railway
- Verify DATABASE_URL is correct
- Test backend directly: `https://your-backend.com/docs`

---

## 🎓 For Your Thesis Defense

**Recommended Setup:**

```
Frontend:  Vercel (FREE, FAST, GLOBAL CDN)
           └── https://coursefeedback.vercel.app

Backend:   Railway (FREE $5/month credit)
           └── https://coursefeedback-backend.railway.app

Database:  Supabase (Current, FREE)
           └── Already has all your data!
```

**Benefits:**
- ✅ No cold starts during presentation
- ✅ Blazing fast frontend loading
- ✅ No database migration needed
- ✅ Professional URLs
- ✅ Auto-deploy on git push

---

## 📝 Custom Domain (Optional)

If you want a custom domain:

1. Buy domain from Namecheap/GoDaddy
2. Vercel → Settings → Domains
3. Add your domain
4. Update DNS records (Vercel provides instructions)
5. SSL certificate auto-generated

---

## 🚀 One-Command Deploy

After initial setup, future updates are automatic:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel auto-deploys in ~2 minutes! 🎉
