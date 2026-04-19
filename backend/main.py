from fastapi import FastAPI
from app.database import engine, Base
# Import all models to ensure they are registered with Base before creating tables
from app.models.schema import User, Deck, Card, CardState, ReviewLog, MagicImport, GamificationLedger, DeckMembership

app = FastAPI(title="Gizmo API", description="AI EdTech Platform", version="1.0.0")

# For development purposes, create tables directly
# In production, use Alembic migrations instead
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Gizmo API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
