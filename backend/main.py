"""Main FastAPI application for Hospital Roster Solver."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router

app = FastAPI(
    title="Hospital Roster Solver API",
    description="Automatic roster generation using OR-Tools CP-SAT solver",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api", tags=["solver"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Hospital Roster Solver API",
        "version": "1.0.0",
        "description": "Automatic roster generation using OR-Tools CP-SAT",
        "endpoints": {
            "generate_plan": "POST /api/generate-plan",
            "job_status": "GET /api/job-status/{job_id}",
            "find_replacement": "POST /api/find-replacement",
            "health": "GET /api/health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
