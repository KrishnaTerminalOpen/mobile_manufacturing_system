import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from root or backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
env_path = ROOT_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    # Oracle DB Settings
    DB_USER: str = os.getenv("DB_USER", "mms_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "mms_password")
    DB_DSN: str = os.getenv("DB_DSN", "localhost:1521/XEPDB1")
    DB_POOL_MIN: int = int(os.getenv("DB_POOL_MIN", "2"))
    DB_POOL_MAX: int = int(os.getenv("DB_POOL_MAX", "10"))
    DB_POOL_INCREMENT: int = int(os.getenv("DB_POOL_INCREMENT", "1"))
    
    # Fallback option for demo when Oracle is offline
    USE_FALLBACK_IF_ORACLE_OFFLINE: bool = os.getenv("USE_FALLBACK_IF_ORACLE_OFFLINE", "true").lower() in ("true", "1", "yes")

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "manipal-mit-mca-dbms-mobile-manufacturing-secret-key-2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # Server settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

settings = Settings()
