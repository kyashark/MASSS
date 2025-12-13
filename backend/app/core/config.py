import os
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "MASSS"
    PROJECT_VERSION: str = "1.0.0"
    
    # Read the URL from the environment, crash if missing
    DATABASE_URL: str = os.getenv("DATABASE_URL")

settings = Settings()