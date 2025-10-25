"""
Health check endpoints
"""

from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime
import psutil
import os

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    timestamp: datetime
    version: str
    environment: str


class DetailedHealthResponse(HealthResponse):
    """Detailed health check response"""
    database: str
    redis: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "development")
    )


@router.get("/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check():
    """Detailed health check with system metrics"""
    
    # TODO: Add actual database and Redis health checks
    db_status = "connected"  # Placeholder
    redis_status = "connected"  # Placeholder
    
    return DetailedHealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        environment=os.getenv("ENVIRONMENT", "development"),
        database=db_status,
        redis=redis_status,
        cpu_percent=psutil.cpu_percent(interval=1),
        memory_percent=psutil.virtual_memory().percent,
        disk_percent=psutil.disk_usage('/').percent
    )


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    # TODO: Check if all dependencies are ready
    return {"status": "ready"}


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive"}

