import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "MASSS"
    PROJECT_VERSION: str = "1.0.0"

    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL")
        self.SECRET_KEY = os.getenv("SECRET_KEY")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
        )

        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set in .env")
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY is not set in .env")


settings = Settings()
