import os
from dotenv import load_dotenv


load_dotenv()


class Settings:
    def __init__(self):
        self.RL_SERVICE_KEY = os.getenv("RL_SERVICE_KEY")
        self.MODEL_DIR = os.getenv("MODEL_DIR", "./models")
        self.PORT = int(os.getenv("PORT", "8001"))

        if not self.RL_SERVICE_KEY:
            raise ValueError("RL_SERVICE_KEY is not set in .env")


settings = Settings()
