from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import schedule, state, health

app = FastAPI(
    title="MASSS RL Scheduler Service",
    version="1.0.0",
    description="Standalone RL scheduling microservice. "
    "Accepts student context, returns schedule decisions.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Health check — no auth, always available
app.include_router(health.router)

# Core endpoints — all require X-Service-Key header
app.include_router(schedule.router)
app.include_router(state.router)


@app.on_event("startup")
async def startup_event():
    print("RL Scheduler Service starting...")
    from app.routers.schedule import rl_brain

    if rl_brain.model_loaded:
        print("✅ RL model loaded successfully")
    else:
        print("⚠️  No RL model found — schedule endpoint will return empty results")
        print("   Place a .zip model file in the models/ folder to enable RL")
