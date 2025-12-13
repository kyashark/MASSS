from fastapi import FastAPI
from sqlalchemy import text # Import text to write raw SQL
from app.core.database import engine
from app.core import base


from app.modules.scheduling.router import router as scheduling_router
# from app.modules.wellness.router import router as wellness_router (Teammate)

base.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MASSS")

# 👇 REGISTER ONLY ONE ROUTER PER MODULE
app.include_router(scheduling_router, prefix="/api/schedule",  # The Base URL for your whole module
    # tags are handled inside the master router now
)

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