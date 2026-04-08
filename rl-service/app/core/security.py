from fastapi import Header, HTTPException, status
from app.core.config import settings


def verify_service_key(x_service_key: str = Header(...)) -> None:
    """
    Dependency that verifies the service-to-service secret key.
    Used on all endpoints except /health.

    The caller must include the header:
      X-Service-Key: {shared-secret}

    This prevents random internet traffic from hitting the RL service.
    It is NOT the user's JWT token — this is machine-to-machine auth.
    """
    if x_service_key != settings.RL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service key",
        )
