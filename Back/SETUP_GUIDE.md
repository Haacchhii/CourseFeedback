# 🔥 Firebase & PostgreSQL Setup Guide

This guide will walk you through setting up Firebase and PostgreSQL for your Course Evaluation System.

## 📋 Prerequisites

1. **Google Account** (for Firebase)
2. **pgAdmin 4** installed on your computer
3. **Python virtual environment** activated

## 🚀 Step-by-Step Setup

### Step 1: Install Required Python Packages

```bash
# Make sure your virtual environment is activated
# Navigate to Back folder
cd "C:\Users\Jose Iturralde\Documents\1 thesis\Back"

# Method 1: Install essential packages for Firebase and PostgreSQL
pip install firebase-admin==6.3.0
pip install psycopg2-binary==2.9.9
pip install python-dotenv==1.0.0
pip install bcrypt==4.1.2
pip install sqlalchemy==2.0.23

# Method 2: Install all packages at once
pip install firebase-admin psycopg2-binary python-dotenv bcrypt sqlalchemy

# Method 3: If you get "did not find executable" error, use Python -m pip:
python -m pip install firebase-admin psycopg2-binary python-dotenv bcrypt sqlalchemy

# Method 4: If requirements.txt exists, install everything
pip install -r requirements.txt
```

**⚠️ If you see "did not find executable" error:**
This means pip is trying to use system Python instead of your virtual environment. Try Method 3 above with `python -m pip` instead.

### Step 2: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Sign in** with your Google account
3. **Click "Create a project"**
4. **Project name**: `course-evaluation-system`
5. **Click "Continue"**
6. **Disable Google Analytics** (uncheck the toggle)
7. **Click "Create project"**
8. **Wait for creation** (30-60 seconds)
9. **Click "Continue"**

### Step 3: Enable Authentication

1. **In left sidebar**, click **"Authentication"**
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Click "Email/Password"**
5. **Enable the first toggle** (Email/Password)
6. **Click "Save"**

### Step 4: Get Service Account Key

1. **Click gear icon** ⚙️ (top left)
2. **Click "Project settings"**
3. **Go to "Service accounts" tab**
4. **Click "Generate new private key"**
5. **Click "Generate key"** (JSON file downloads)
6. **IMPORTANT**: Save the downloaded file as:
   ```
   C:\Users\Jose Iturralde\Documents\1 thesis\Back\firebase-service-account.json
   ```
7. **⚠️ Keep this file secret!**

### Step 5: Update Environment Variables

1. **Open**: `C:\Users\Jose Iturralde\Documents\1 thesis\Back\.env`
2. **Find the Firebase section** and update with your values from the JSON file:

```env
# Replace these with values from your firebase-service-account.json
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_ID=your-actual-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-actual-client-id
```

### Step 6: Test Firebase Setup

```bash
# In the Back folder, run:
python scripts/test_firebase.py
```

**Expected output:**
```
🔥 Testing Firebase setup...
✅ Firebase is working! Created user with UID: xxx
🎉 Firebase setup is complete and working!
```

### Step 7: Setup PostgreSQL Database

1. **Open pgAdmin 4**
2. **Right-click "Databases"** → **"Create"** → **"Database"**
3. **Database name**: `course_evaluation_db`
4. **Click "Save"**

### Step 8: Run Database Schema

1. **Right-click your new database** → **"Query Tool"**
2. **Copy the entire contents** of:
   ```
   C:\Users\Jose Iturralde\Documents\1 thesis\Back\database\schema.sql
   ```
3. **Paste into Query Tool**
4. **Click "Execute"** (F5)
5. **You should see**: "Query returned successfully"

### Step 9: Update PostgreSQL Settings

1. **In pgAdmin**, find your database password
2. **Update**: `C:\Users\Jose Iturralde\Documents\1 thesis\Back\.env`

```env
# Update with your actual PostgreSQL settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_actual_postgres_password
POSTGRES_DB=course_evaluation_db
```

### Step 10: Test Database Connection

```bash
# In the Back folder, run:
python database/connection.py
```

**Expected output:**
```
✅ Database connection successful!
PostgreSQL version: PostgreSQL 15.x...
```

### Step 11: Run Data Migration

```bash
# This will move all your mock data to the real databases
python scripts/migrate_mock_data.py
```

**Expected output:**
```
🚀 Starting data migration...
✅ Created department head: melodydimaano@lpubatangas.edu.ph
✅ Created student: maria.santos.bsit1@lpubatangas.edu.ph
✅ Created course: BSIT101 - Introduction to Computing
✅ Data migration completed successfully!
```

## 🎯 What You'll Have After Setup

✅ **Firebase Authentication** - Users can login with email/password  
✅ **PostgreSQL Database** - All data stored in proper tables  
✅ **Student Accounts** - 17 students across 5 programs  
✅ **Course Data** - Real courses based on your curriculum  
✅ **Department Head Account** - Admin access for analytics  

## 🔐 Test Accounts

**Students**: Use any email from the migration (password: `changeme`)
- `maria.santos.bsit1@lpubatangas.edu.ph`
- `sophia.martinez.bscsds1@lpubatangas.edu.ph`
- etc.

**Department Head**: 
- Email: `melodydimaano@lpubatangas.edu.ph`
- Password: `changeme`

## 🆘 Troubleshooting

### Firebase Issues
- **"Import firebase_admin could not be resolved"**: Run `pip install firebase-admin`
- **"Firebase initialization failed"**: Check your `.env` file values
- **"Service account not found"**: Make sure JSON file is in correct location

### PostgreSQL Issues
- **"Database connection failed"**: Check pgAdmin is running and password is correct
- **"Import psycopg2 could not be resolved"**: Run `pip install psycopg2-binary`
- **"Table doesn't exist"**: Make sure you ran the schema.sql file

### Migration Issues
- **"Program not found"**: Make sure schema.sql ran successfully
- **"Firebase user creation failed"**: Check your Firebase project settings

## 📞 Next Steps

After successful setup:
1. **Update your FastAPI routes** to use the database
2. **Modify your frontend** to use Firebase authentication
3. **Test the complete application** end-to-end

Need help? Check the console output for specific error messages!
