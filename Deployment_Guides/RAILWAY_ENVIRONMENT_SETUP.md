# 🚂 Railway Environment Variables Setup

## ⚠️ Critical Issues Fixed

1. **Removed blocking SMTP retries** - Reduced from 3 retries (6+ seconds) to 1 attempt
2. **Email sending won't block API** - No more `time.sleep()` delays
3. **Must use Resend on Railway** - SMTP port 587 is blocked by Railway

---

## 🔧 Required Environment Variables for Railway

Go to your **Railway Dashboard** → Your Project → **Variables** tab

### Add/Update These Variables:

```bash
# Database (Supabase)
DATABASE_URL=postgresql+psycopg://postgres.esdohggqyckrtlpzbyhh:Napakabangis0518@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Security
SECRET_KEY=bi7Mqp89qPyvXFqp0dlbhmTCuL8NfSazk3GHnFT3WB0
DEBUG=false

# Frontend URL (IMPORTANT - Update to your Vercel URL)
FRONTEND_URL=https://course-feedback-ochre.vercel.app
CORS_ORIGINS=https://course-feedback-ochre.vercel.app,https://course-feedback-pqn318mjd-joseirineo0418-gmailcoms-projects.vercel.app,https://course-feedback-ngwlk4sy9-joseirineo0418-gmailcoms-projects.vercel.app,https://course-feedback-git-main-joseirineo0418-gmailcoms-projects.vercel.app

# Email Service - Resend (REQUIRED for Railway)
EMAIL_ENABLED=true
RESEND_API_KEY=re_P6HUydm7_GE6t99hdWqD6PAQwwxxvEmzb
RESEND_FROM_EMAIL=noreply@response.shop
RESEND_FROM_NAME=LPU Course Feedback System

# DO NOT ADD SMTP VARIABLES - Railway blocks SMTP ports
# SMTP_SERVER - ❌ Don't add this
# SMTP_PORT - ❌ Don't add this
# SMTP_USERNAME - ❌ Don't add this
# SMTP_PASSWORD - ❌ Don't add this
```

---

## 📝 Step-by-Step Railway Setup

### Step 1: Update FRONTEND_URL
Replace `http://localhost:5173` with your actual Vercel URL:
```
FRONTEND_URL=https://course-feedback-ochre.vercel.app
```

### Step 2: Setup Resend Domain (Important!)
1. Go to **[Resend Dashboard](https://resend.com/domains)**
2. Add domain: **`response.shop`**
3. Add DNS records in Namecheap (see main guide)
4. Verify domain in Resend
5. Update `RESEND_FROM_EMAIL` to: `noreply@response.shop`

### Step 3: Remove SMTP Variables
In Railway Variables, **DELETE** these if present:
- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

Railway blocks SMTP ports anyway, so these won't work.

---

## ✅ Verification Checklist

After deploying, check Railway logs for:

```
✅ Resend API configured (primary email method)
[INFO] Middleware configured: Security Headers, Rate Limiting, GZIP, CORS
INFO:     Uvicorn running on http://0.0.0.0:8080
```

**You should NOT see:**
- ❌ "Falling back to SMTP"
- ❌ "Network is unreachable"
- ❌ "Retry attempt 1/3"

---

## 🎯 Expected Behavior After Fix

### Before (Bad):
```
📧 Sending via SMTP to user@email.com...
❌ SMTP send failed: [Errno 101] Network is unreachable
⏳ Retry attempt 1/3 in 2s...
⏳ Retry attempt 2/3 in 4s...
❌ All 3 email send attempts failed
[API blocked for 6+ seconds]
```

### After (Good):
```
✅ Resend API configured (primary email method)
📧 Attempting to send via Resend to user@email.com...
✅ Email sent successfully via Resend
   Resend ID: abc123
[API responds immediately]
```

---

## 🚨 Common Mistakes

| Mistake | Fix |
|---------|-----|
| FRONTEND_URL still `localhost:5173` | Update to Vercel URL |
| RESEND_FROM_EMAIL is `onboarding@resend.dev` | Change to `noreply@response.shop` |
| SMTP variables still present | Delete them - Railway blocks SMTP |
| Resend domain not verified | Verify in Resend dashboard |
| Wrong CORS_ORIGINS | Include all Vercel preview URLs |

---

## 🔗 Quick Links

- [Resend Dashboard](https://resend.com/dashboard)
- [Railway Dashboard](https://railway.app/dashboard)
- [Namecheap DNS Management](https://ap.www.namecheap.com/domains/list/)

---

## 📧 Testing Emails After Deploy

1. Go to your Vercel app: `https://course-feedback-ochre.vercel.app`
2. Click "Forgot Password"
3. Enter email: `iturraldejose@lpubatangas.edu.ph`
4. Check Railway logs - should see:
   ```
   ✅ Email sent successfully via Resend
   ```
5. Check your inbox for email from `noreply@response.shop`

---

## 🎉 Summary

1. ✅ Added `resend>=0.7.0` to requirements.txt
2. ✅ Removed blocking retry delays (no more 6+ second waits)
3. ✅ Reduced retries from 3 to 1
4. 🔧 Update Railway environment variables (FRONTEND_URL, Resend config)
5. 🔧 Remove all SMTP variables from Railway
6. 🔧 Setup response.shop domain in Resend

After these changes, your API will respond immediately even if email fails!
