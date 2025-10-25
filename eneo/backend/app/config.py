"""
Configuration settings for Eneo backend
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_SECRET_KEY: str = "changeme_secret_key"
    
    # Database
    DB_HOST: str = "eneo-db"
    DB_PORT: int = 5432
    DB_NAME: str = "eneo"
    DB_USER: str = "eneo"
    DB_PASSWORD: str = "changeme"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Redis
    REDIS_HOST: str = "eneo-redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "changeme"
    
    @property
    def REDIS_URL(self) -> str:
        return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
    
    # OAuth2
    OAUTH2_CLIENT_ID: str = ""
    OAUTH2_CLIENT_SECRET: str = ""
    OAUTH2_AUTHORIZE_URL: str = "http://localhost/index.php/apps/oauth2/authorize"
    OAUTH2_TOKEN_URL: str = "http://localhost/index.php/apps/oauth2/api/v1/token"
    OAUTH2_USERINFO_URL: str = "http://localhost/ocs/v2.php/cloud/user"
    OAUTH2_REDIRECT_URI: str = "http://localhost/eneo/oauth/callback"
    
    # Nextcloud
    NEXTCLOUD_URL: str = "http://nextcloud"
    NEXTCLOUD_WEBDAV_PATH: str = "/remote.php/webdav"
    
    @property
    def NEXTCLOUD_WEBDAV_URL(self) -> str:
        return f"{self.NEXTCLOUD_URL}{self.NEXTCLOUD_WEBDAV_PATH}"
    
    # AI Model
    AI_MODEL_TYPE: str = "local"  # 'local' or 'openai'
    AI_MODEL_NAME: str = "llama2"
    AI_MODEL_PATH: str = "/models/model.gguf"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Vector Database
    VECTOR_DIMENSION: int = 384
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost", "http://localhost:3000"]
    
    # Session
    SESSION_LIFETIME: int = 3600  # seconds
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = "lax"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Performance
    ENEO_WORKERS: int = 4
    CACHE_TTL: int = 3600
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

