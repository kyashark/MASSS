import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "MASSS"
    PROJECT_VERSION: str = "1.0.0"

    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # Validate on startup — crash immediately with a clear message
    # instead of a confusing error later
    def __post_init__(self):
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set in .env")
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY is not set in .env")


settings = Settings()
