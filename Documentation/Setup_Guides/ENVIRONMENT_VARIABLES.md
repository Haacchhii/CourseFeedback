# 🔐 Environment Variables Configuration Guide

**System:** LPU Course Feedback System  
**Last Updated:** December 2, 2025

---

## 📋 Overview

This document lists all environment variables used by the backend and frontend, with descriptions, default values, and security recommendations.

---

## 🐍 BACKEND ENVIRONMENT VARIABLES

**Location:** `Back/App/.env`

### Database Configuration

```bash
# PostgreSQL Connection String
# Format: postgresql://username:password@host:port/database
# Example: postgresql://postgres:mypassword@db.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/course_feedback
```
- **Required:** ✅ Yes
- **Type:** Connection String
- **Description:** PostgreSQL database connection URL
- **Security:** 🔒 CRITICAL - Never commit to Git
- **Production:** Use Supabase connection pooling URL for better performance
- **Testing:** Can use localhost for development

---

### JWT Authentication

```bash
# Secret key for signing JWT tokens
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```
- **Required:** ✅ Yes
- **Type:** String (32+ characters recommended)
- **Description:** Secret key for signing authentication tokens
- **Security:** 🔒 CRITICAL - Use strong random string, never reuse
- **Default:** None (must be set)
- **Production:** Generate unique secret, store securely

```bash
# JWT signing algorithm
JWT_ALGORITHM=HS256
```
- **Required:** ⚠️ Optional
- **Type:** String
- **Description:** Algorithm for JWT token signing
- **Default:** `HS256`
- **Options:** HS256, HS384, HS512, RS256
- **Recommendation:** Keep default unless you have specific requirements

```bash
# JWT token expiration in minutes
JWT_EXPIRATION_MINUTES=10080
```
- **Required:** ⚠️ Optional
- **Type:** Integer
- **Description:** How long tokens remain valid (in minutes)
- **Default:** `10080` (7 days)
- **Production:** 
  - Students/Staff: 10080 (7 days) - longer sessions acceptable
  - Admin: 1440 (24 hours) - shorter for security
- **Development:** Can use longer for convenience

---

### Email Configuration (Primary - Resend)

```bash
# Resend API Key for email notifications
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_123456789abcdefghijklmnop
```
- **Required:** ⚠️ Recommended for production
- **Type:** API Key
- **Description:** Resend service API key for sending emails
- **Security:** 🔒 SECRET - Never commit to Git
- **Free Tier:** 100 emails/day, 3,000/month
- **Production:** Upgrade to paid plan for higher volume
- **Fallback:** Uses SMTP if not set

```bash
# From address for outgoing emails
EMAIL_FROM=notifications@yourdomain.com
```
- **Required:** ⚠️ Required if using email
- **Type:** Email Address
- **Description:** Sender address for all system emails
- **Requirements:** 
  - Must be verified domain in Resend/SMTP provider
  - Professional address recommended (not @gmail.com)
- **Default:** None
- **Example:** `feedback@lpu.edu.ph`

---

### Email Configuration (Backup - SMTP)

```bash
# SMTP server hostname
SMTP_HOST=smtp.gmail.com
```
- **Required:** ⚠️ Optional (fallback if Resend fails)
- **Type:** Hostname
- **Description:** SMTP server for sending emails
- **Default:** `smtp.gmail.com`
- **Alternatives:**
  - Gmail: `smtp.gmail.com`
  - Outlook: `smtp-mail.outlook.com`
  - Office365: `smtp.office365.com`

```bash
# SMTP server port
SMTP_PORT=587
```
- **Required:** ⚠️ Optional
- **Type:** Integer
- **Description:** SMTP server port
- **Default:** `587` (TLS)
- **Options:**
  - 587 - TLS (recommended)
  - 465 - SSL
  - 25 - Unencrypted (not recommended)

```bash
# SMTP username (usually your email)
SMTP_USERNAME=your-email@gmail.com
```
- **Required:** ⚠️ Required if using SMTP
- **Type:** Email Address
- **Description:** SMTP authentication username
- **Security:** 🔒 SECRET
- **Gmail:** Use app-specific password, not account password

```bash
# SMTP password or app password
SMTP_PASSWORD=your-app-password
```
- **Required:** ⚠️ Required if using SMTP
- **Type:** String
- **Description:** SMTP authentication password
- **Security:** 🔒 CRITICAL - Never commit to Git
- **Gmail:** Generate app password at myaccount.google.com/apppasswords
- **Production:** Use environment variable or secret manager

---

### CORS Configuration

```bash
# Allowed frontend origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```
- **Required:** ⚠️ Recommended for production
- **Type:** Comma-separated URLs
- **Description:** Frontend URLs allowed to access API
- **Default:** `http://localhost:5173` (development)
- **Production Example:**
  ```
  CORS_ORIGINS=https://feedback.lpu.edu.ph,https://www.feedback.lpu.edu.ph
  ```
- **Security:** List only trusted domains
- **Note:** No trailing slashes, include protocol (http/https)

---

### Machine Learning

```bash
# Path to trained ML models (relative to App directory)
ML_MODELS_PATH=ml_services/models
```
- **Required:** ⚠️ Optional
- **Type:** Path
- **Description:** Directory containing trained ML models
- **Default:** `ml_services/models`
- **Files Expected:**
  - `svm_sentiment_model.pkl` - Sentiment classifier
  - `vectorizer.pkl` - TF-IDF vectorizer
- **Note:** Models auto-created by `train_ml_models.py`

---

### Application Settings

```bash
# Server host (development only)
HOST=0.0.0.0
```
- **Required:** ❌ No
- **Type:** IP Address
- **Description:** Host to bind server to
- **Default:** `0.0.0.0` (all interfaces)
- **Production:** Set by hosting platform (Render/Railway)
- **Development:** `127.0.0.1` for localhost only

```bash
# Server port (development only)
PORT=8000
```
- **Required:** ❌ No
- **Type:** Integer
- **Description:** Port to run server on
- **Default:** `8000`
- **Production:** Set automatically by hosting platform
- **Development:** Can use any available port

```bash
# Python timezone
TZ=Asia/Manila
```
- **Required:** ⚠️ Recommended
- **Type:** Timezone String
- **Description:** System timezone for timestamps
- **Default:** System timezone
- **Philippines:** `Asia/Manila`
- **Note:** Ensures consistent timestamps in logs and database

---

## ⚛️ FRONTEND ENVIRONMENT VARIABLES

**Location:** `New/capstone/.env`

### API Configuration

```bash
# Backend API base URL
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```
- **Required:** ✅ Yes
- **Type:** URL
- **Description:** Backend API endpoint
- **Default:** `http://127.0.0.1:8000/api`
- **Development:** `http://127.0.0.1:8000/api` or `http://localhost:8000/api`
- **Production:** `https://your-backend.onrender.com/api`
- **Note:** Must include `/api` suffix

---

### Application Metadata

```bash
# Application name displayed in UI
VITE_APP_NAME=LPU Course Feedback System
```
- **Required:** ⚠️ Optional
- **Type:** String
- **Description:** System name shown in header and page titles
- **Default:** `Course Feedback System`

```bash
# Application version
VITE_APP_VERSION=1.0.0
```
- **Required:** ⚠️ Optional
- **Type:** Semver String
- **Description:** Version number for tracking
- **Default:** `1.0.0`
- **Usage:** Displayed in footer or about page

---

## 📝 Example Configuration Files

### Backend `.env` (Development)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/course_feedback

# JWT
JWT_SECRET=dev-secret-change-in-production-minimum-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# Email (Resend)
RESEND_API_KEY=re_your_dev_api_key
EMAIL_FROM=dev@localhost

# SMTP Backup (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# CORS
CORS_ORIGINS=http://localhost:5173

# Timezone
TZ=Asia/Manila
```

### Backend `.env` (Production)
```bash
# Database (Supabase Connection Pooler)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# JWT (Use strong random secret)
JWT_SECRET=prod-super-secret-key-generated-with-secrets-module-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# Email (Resend Production)
RESEND_API_KEY=re_prod_your_production_api_key
EMAIL_FROM=feedback@lpu.edu.ph

# SMTP Backup
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=lpufeedback@gmail.com
SMTP_PASSWORD=production-app-password

# CORS (Production Frontend URLs)
CORS_ORIGINS=https://feedback.lpu.edu.ph,https://www.feedback.lpu.edu.ph

# Timezone
TZ=Asia/Manila
```

### Frontend `.env` (Development)
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_APP_NAME=LPU Course Feedback System
VITE_APP_VERSION=1.0.0
```

### Frontend `.env.production`
```bash
VITE_API_BASE_URL=https://lpu-feedback-backend.onrender.com/api
VITE_APP_NAME=LPU Course Feedback System
VITE_APP_VERSION=1.0.0
```

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets to Git
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Generate Strong Secrets
```python
# Generate JWT_SECRET
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Output example:
# xK7vM2nP9qR5sT8uV1wX3yZ6aB4cD0eF2gH5iJ7kL9m
```

### 3. Rotate Secrets Periodically
- JWT_SECRET: Every 6-12 months
- API Keys: Every 3-6 months
- Database Password: Every 12 months

### 4. Use Environment-Specific Files
- `.env` - Development (local)
- `.env.production` - Production
- Never mix development and production secrets

### 5. Use Secret Managers (Production)
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Render/Railway environment variables (encrypted)

---

## 🧪 Validation

### Check Required Variables
```python
# Add to config.py
import os

required_vars = [
    "DATABASE_URL",
    "JWT_SECRET",
]

missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
```

### Test Configuration
```bash
# Backend
cd Back/App
python -c "from config import DATABASE_URL, JWT_SECRET; print('✅ Config loaded')"

# Frontend
cd New/capstone
npm run dev
# Check browser console for VITE_ variables
```

---

## 📞 Support

**Issues with environment variables?**
1. Check variable names match exactly (case-sensitive)
2. Verify no extra spaces or quotes
3. Restart application after changes
4. Check `.env` file is in correct directory
5. Verify `.env` not ignored by .gitignore

**Security Concerns:**
- Never share `.env` files
- Use password managers for secrets
- Audit access to production credentials quarterly

---

**Document Owner:** Jose Iturralde  
**Last Review:** December 2, 2025  
**Next Review:** March 2, 2026
