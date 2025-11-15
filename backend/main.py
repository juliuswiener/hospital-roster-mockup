"""Main FastAPI application for Hospital Roster Planning."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Try to import both configurations
try:
    from config import settings
    HAS_SETTINGS = True
except ImportError:
    HAS_SETTINGS = False

# Import CRUD routers (from persistence branch)
try:
    from routers import employees, shifts, assignments, rules
    HAS_CRUD_ROUTERS = True
except ImportError:
    HAS_CRUD_ROUTERS = False

# Import solver router (from auto-plan-creation branch)
try:
    from api.routes import router as api_router
    HAS_SOLVER_ROUTER = True
except ImportError:
    HAS_SOLVER_ROUTER = False

app = FastAPI(
    title="Hospital Roster API",
    description="Backend API for hospital shift scheduling and automatic roster generation",
    version="1.0.0",
)

# CORS configuration - combined for development
cors_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

if HAS_SETTINGS:
    cors_origins.extend(settings.CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CRUD routers for persistence
if HAS_CRUD_ROUTERS:
    app.include_router(employees.router)
    app.include_router(shifts.router)
    app.include_router(assignments.router)
    app.include_router(rules.router)

# Include solver router for automatic plan generation
if HAS_SOLVER_ROUTER:
    app.include_router(api_router, prefix="/api", tags=["solver"])


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "features": {
            "crud": HAS_CRUD_ROUTERS,
            "solver": HAS_SOLVER_ROUTER,
            "settings": HAS_SETTINGS,
        }
    }


@app.get("/")
def root():
    """Root endpoint with API information."""
    endpoints = {
        "docs": "/docs",
        "health": "/health",
    }

    if HAS_CRUD_ROUTERS:
        endpoints.update({
            "employees": "/employees",
            "shifts": "/shifts",
            "assignments": "/assignments",
            "rules": "/rules",
        })

    if HAS_SOLVER_ROUTER:
        endpoints.update({
            "generate_plan": "POST /api/generate-plan",
            "job_status": "GET /api/job-status/{job_id}",
            "find_replacement": "POST /api/find-replacement",
        })

    return {
        "name": "Hospital Roster API",
        "version": "1.0.0",
        "description": "Backend API for hospital shift scheduling and automatic roster generation",
        "endpoints": endpoints,
    }


if __name__ == "__main__":
    import uvicorn

    host = settings.API_HOST if HAS_SETTINGS else "0.0.0.0"
    port = settings.API_PORT if HAS_SETTINGS else 8000

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )
