# Thesis Project - React Frontend & FastAPI Backend

A simple web application with React frontend and FastAPI backend.

## Project Structure

```
thesis/
├── readme.md
├── Back/                    # FastAPI Backend
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example        # Environment variables
│   └── App/
│       ├── main.py         # FastAPI app
│       ├── database/       # Database setup
│       ├── models/         # Data models
│       ├── routes/         # API endpoints
│       └── services/       # Business logic
└── Front/                  # React Frontend
    ├── package.json        # Node dependencies
    ├── public/            # Static files
    └── src/
        ├── App.js         # Main App
        ├── components/    # React components
        ├── services/      # API calls
        └── styles/        # CSS files
```

## Quick Setup

### Backend
1. Navigate to `Back` folder
2. Create virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env`
6. Run: `cd App && python main.py`

### Frontend
1. Navigate to `Front` folder
2. Install dependencies: `npm install`
3. Start dev server: `npm start`

## Features
- User authentication
- Data management
- Modern UI with Material-UI
- REST API with FastAPI
- PostgreSQL/SQLite database support

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, Material-UI
- **ML**: scikit-learn, spaCy
- **Cloud**: Firebase (optional)
