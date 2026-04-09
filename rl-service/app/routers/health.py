from fastapi import APIRouter
from app.schemas.outputs import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint. No authentication required.
    Used by Docker, monitoring tools, and load balancers.
    """
    # Import here to avoid circular import at module load time
    from app.routers.schedule import rl_brain

    model_name = None
    if rl_brain.model_loaded and rl_brain.model:
        try:
            import os
            from app.core.config import settings
            from pathlib import Path

            model_files = list(Path(settings.MODEL_DIR).glob("*.zip"))
            if model_files:
                latest = max(model_files, key=os.path.getctime)
                model_name = latest.name
        except Exception:
            pass

    return {
        "status": "ok",
        "model_loaded": rl_brain.model_loaded,
        "model_name": model_name,
    }
