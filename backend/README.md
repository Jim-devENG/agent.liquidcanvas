# Backend API Service

FastAPI backend for art outreach automation system.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables (create `.env` file):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/art_outreach
REDIS_URL=redis://localhost:6379/0
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_password
HUNTER_IO_API_KEY=your_api_key
GEMINI_API_KEY=your_api_key
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
JWT_SECRET_KEY=your_secret_key
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/                 # API route handlers
│   ├── clients/             # Third-party API clients
│   ├── services/            # Business logic
│   └── db/                  # Database configuration
├── alembic/                 # Database migrations
├── tests/                   # Test files
├── requirements.txt
└── README.md
```

