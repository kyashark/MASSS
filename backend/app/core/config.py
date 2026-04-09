import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL")
        self.SECRET_KEY = os.getenv("SECRET_KEY")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
        )
        # RL microservice connection
        self.RL_SERVICE_URL = os.getenv("RL_SERVICE_URL", "http://localhost:8001")
        self.RL_SERVICE_KEY = os.getenv("RL_SERVICE_KEY")

        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set in .env")
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY is not set in .env")
        if not self.RL_SERVICE_KEY:
            raise ValueError("RL_SERVICE_KEY is not set in .env")


settings = Settings()
