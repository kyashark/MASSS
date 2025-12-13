from fastapi import FastAPI
from sqlalchemy import text # Import text to write raw SQL
from app.core.database import engine

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Hello Shark, FastAPI is running!"}


@app.get("/test-db")
def test_db_connection():
    try:
        # Try to run a simple SQL query
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "Database Connected Successfully"}
    except Exception as e:
        return {"status": "Connection Failed", "error": str(e)}