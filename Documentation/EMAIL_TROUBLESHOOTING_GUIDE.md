# 📧 EMAIL TROUBLESHOOTING GUIDE
**System:** Course Feedback System  
**Date:** December 8, 2025  
**Environment:** Production (Railway/Vercel)

---

## 🔍 CURRENT EMAIL SETUP

The system supports **two email methods**:

1. **Resend API** (Primary - Recommended for production)
2. **SMTP** (Backup - Gmail/Other SMTP servers)

### Current Configuration Location:
- **Config File:** `Back/App/config.py`
- **Email Service:** `Back/App/services/email_service.py`
- **Environment Variables:** Set in Railway/Vercel dashboard

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: No Emails Being Sent

**Symptoms:**
- Email notifications not arriving
- No errors shown in UI
- System appears to work but no emails received

**Root Causes:**
1. ✅ Email service not configured (no API key or SMTP credentials)
2. ✅ Environment variables not set in production
3. ✅ `EMAIL_ENABLED` flag set to `false`
4. ✅ Firewall blocking SMTP ports
5. ✅ Invalid/expired credentials

**Troubleshooting Steps:**

#### Step 1: Check Environment Variables in Railway

1. Go to Railway Dashboard → Your Project → Variables
2. Verify these variables are set:

**For Resend API (Recommended):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=LPU Course Feedback System
EMAIL_ENABLED=true
```

**For SMTP (Gmail example):**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=LPU Course Feedback System
EMAIL_ENABLED=true
```

⚠️ **Important:** After adding variables, you must **redeploy** the backend!

#### Step 2: Check Backend Logs

1. Go to Railway Dashboard → Deployments → View Logs
2. Look for these messages on startup:

**Success messages:**
```
✅ Resend API configured (primary email method)
```
or
```
✅ SMTP configured as backup email method
```

**Warning messages:**
```
⚠️ No email service configured (neither Resend nor SMTP)
⚠️ Resend package not installed. Falling back to SMTP only.
```

#### Step 3: Test Email Endpoint

Use the admin Email Notifications page to test:

1. Go to Admin → Email Notifications
2. Enter your email in "Test Email" field
3. Click "Send Test Email"
4. Check backend logs for:
   - `📧 Attempting to send via Resend to your-email@example.com...`
   - `✅ Email sent successfully via Resend`
   - OR `❌ Failed to send via Resend, trying SMTP...`

---

## 🔧 SETUP METHODS

### Method 1: Resend API (Recommended) ⭐

**Why Resend?**
- ✅ More reliable for production
- ✅ Better deliverability rates
- ✅ No firewall issues
- ✅ Easy setup
- ✅ Free tier: 100 emails/day

**Setup Steps:**

1. **Sign up for Resend:**
   - Go to: https://resend.com/signup
   - Create free account
   - Verify your domain (optional but recommended)

2. **Get API Key:**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)

3. **Set Environment Variables in Railway:**
   ```env
   RESEND_API_KEY=re_your_actual_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   RESEND_FROM_NAME=LPU Course Feedback System
   EMAIL_ENABLED=true
   ```

4. **Redeploy Backend:**
   - Railway will auto-deploy when you save variables
   - OR click "Deploy" manually

5. **Verify Setup:**
   - Check logs for: `✅ Resend API configured`
   - Send test email from admin panel

**Domain Verification (Optional but Better Deliverability):**
1. In Resend Dashboard → Domains → Add Domain
2. Add DNS records to your domain provider
3. Wait for verification (usually 5-10 minutes)
4. Use `noreply@yourdomain.com` instead of `onboarding@resend.dev`

---

### Method 2: Gmail SMTP (Backup)

**Setup Steps:**

1. **Enable 2-Factor Authentication on Gmail:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "LPU Course Feedback"
   - Copy the 16-character password (remove spaces)

3. **Set Environment Variables in Railway:**
   ```env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=LPU Course Feedback System
   EMAIL_ENABLED=true
   ```

4. **Redeploy Backend**

**⚠️ Gmail Limitations:**
- Sending limit: 500 emails/day
- May get flagged as spam
- App passwords required (2FA must be enabled)
- Less reliable for high-volume sending

---

### Method 3: Other SMTP Providers

**Recommended Alternatives:**
1. **SendGrid** - 100 emails/day free
2. **Mailgun** - Good for transactional emails
3. **AWS SES** - Very cheap, requires AWS account
4. **Microsoft 365 SMTP** - If you have M365

**Generic SMTP Setup:**
```env
SMTP_SERVER=smtp.provider.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=LPU Course Feedback System
EMAIL_ENABLED=true
```

---

## 🧪 TESTING CHECKLIST

### Local Testing (Development)

1. **Create `.env` file** in `Back/App/`:
   ```env
   RESEND_API_KEY=re_your_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   EMAIL_ENABLED=true
   ```

2. **Restart backend server:**
   ```bash
   cd Back/App
   python main.py
   ```

3. **Check startup logs** for email configuration message

4. **Test via Admin Panel:**
   - Admin → Email Notifications → Send Test Email

### Production Testing (Railway)

1. **Verify environment variables** in Railway dashboard

2. **Check deployment logs** after redeploy:
   - Look for email configuration messages
   - No warning messages about missing config

3. **Test via deployed admin panel:**
   - Use test email feature
   - Check spam/junk folders

4. **Monitor backend logs** during test:
   - Should see send attempt messages
   - Success or error messages

---

## 🐛 DEBUGGING COMMANDS

### Check Email Service Status (Backend Logs)

Look for these patterns in Railway logs:

**Configuration Check:**
```
✅ Resend API configured (primary email method)
✅ SMTP configured as backup email method
⚠️ No email service configured (neither Resend nor SMTP)
```

**Send Attempt:**
```
📧 Attempting to send via Resend to email@example.com...
✅ Email sent successfully via Resend
❌ Failed to send via Resend: API key invalid
❌ Failed to send via Resend, trying SMTP...
✅ Email sent successfully via SMTP
❌ SMTP authentication failed
```

### Common Error Messages & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `No email service configured` | Missing env variables | Add RESEND_API_KEY or SMTP credentials |
| `API key invalid` | Wrong/expired Resend key | Generate new API key in Resend dashboard |
| `SMTP authentication failed` | Wrong Gmail password | Use App Password, not regular password |
| `Connection refused` | Wrong SMTP port | Use 587 for TLS, 465 for SSL |
| `Email not delivered` | Email in spam | Verify domain, improve email content |
| `Resend package not installed` | Missing dependency | Add `resend` to requirements.txt |

---

## 📋 QUICK FIX CHECKLIST

When emails aren't working in production:

- [ ] Environment variables set in Railway/Vercel
- [ ] `EMAIL_ENABLED=true` is set
- [ ] API key or SMTP credentials are valid
- [ ] Backend has been redeployed after adding variables
- [ ] Checked backend startup logs for email config
- [ ] Sent test email from admin panel
- [ ] Checked spam/junk folders
- [ ] Reviewed backend logs during send attempt
- [ ] Verified email address is valid
- [ ] No typos in environment variable names
- [ ] For Gmail: App Password enabled (not regular password)
- [ ] For Resend: API key starts with `re_`

---

## 🎯 RECOMMENDED PRODUCTION SETUP

**Best Practice Configuration:**

1. **Use Resend for production emails**
   - More reliable
   - Better deliverability
   - No firewall issues

2. **Configure SMTP as backup** (optional)
   - Automatically used if Resend fails
   - Good for redundancy

3. **Environment Variables:**
   ```env
   # Primary (Resend)
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@lpulaguna.edu.ph
   RESEND_FROM_NAME=LPU Course Feedback System
   
   # Backup (SMTP) - Optional
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=feedback@lpulaguna.edu.ph
   SMTP_PASSWORD=app-specific-password
   SMTP_FROM_EMAIL=feedback@lpulaguna.edu.ph
   
   # Enable emails
   EMAIL_ENABLED=true
   ```

4. **Verify domain in Resend** for better deliverability

5. **Monitor logs** regularly for failed sends

---

## 📊 EMAIL SERVICE MONITORING

### What to Monitor:

1. **Startup Logs:**
   - Email service initialization
   - Configuration warnings

2. **Send Attempt Logs:**
   - Success/failure rates
   - Retry attempts
   - Fallback to SMTP

3. **User Reports:**
   - "I didn't receive the email"
   - Check spam folders first

### Setting Up Monitoring:

1. **Railway Logs:**
   - Dashboard → Deployments → Logs
   - Filter by "email" or "Resend"

2. **Admin Dashboard:**
   - Check "Email Notifications" page
   - Send test emails regularly

3. **Resend Dashboard:**
   - Monitor send statistics
   - Check bounce/spam reports

---

## 💡 TIPS & BEST PRACTICES

1. **Always use App Passwords for Gmail** (never regular password)

2. **Verify your domain** with Resend for better deliverability

3. **Test emails go to spam?**
   - Verify sender domain
   - Improve email content (avoid spammy words)
   - Use proper SPF/DKIM records

4. **Keep backup SMTP configured** even if using Resend

5. **Monitor bounce rates** in email service dashboard

6. **Use environment variables** (never hardcode credentials)

7. **Test after every deployment** to ensure email still works

8. **Check logs regularly** for failed send attempts

9. **Set up email templates** for consistent formatting

10. **Have a fallback plan** if email service goes down

---

## 🆘 STILL NOT WORKING?

If emails still don't work after following this guide:

1. **Verify Railway environment variables:**
   ```bash
   # Check if variables are set
   railway variables
   ```

2. **Check Railway deployment logs** for errors

3. **Test locally first:**
   - Create `.env` file with same variables
   - Run backend locally
   - Send test email

4. **Compare local vs production:**
   - Same variables?
   - Same behavior?

5. **Contact support:**
   - Resend Support: support@resend.com
   - Railway Support: help.railway.app

---

## 📞 SUPPORT RESOURCES

- **Resend Docs:** https://resend.com/docs
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **Railway Docs:** https://docs.railway.app
- **SMTP Troubleshooting:** https://support.google.com/mail/answer/7126229

---

**Last Updated:** December 8, 2025  
**Status:** Production Troubleshooting Guide  
**Next Review:** After successful email setup
