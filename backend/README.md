# Hospital Roster Solver Backend

This is the Python backend service for the Hospital Roster Planner, using Google OR-Tools CP-SAT solver for automatic schedule generation.

## Features

- **Automatic Plan Generation**: Creates optimal staff schedules using constraint programming
- **Hard Constraints**: Labor law compliance (11h rest, 48h max/week), qualifications, coverage requirements
- **Soft Constraints**: Fairness optimization (weekend distribution, workload balance), preference satisfaction
- **REST API**: FastAPI-based endpoints for frontend communication
- **Background Jobs**: Asynchronous solving with progress tracking

## Prerequisites

- Python 3.9 or higher
- pip package manager

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the development server:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or simply:
```bash
python main.py
```

The server will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns backend health status.

### Generate Plan
```
POST /api/generate-plan
```
Starts an asynchronous plan generation job.

**Request Body:**
```json
{
  "employees": [...],
  "shifts": [...],
  "days": [1, 2, 3, ...],
  "rules": [...],
  "availability": {...},
  "fixed_assignments": [...],
  "optimization_mode": "quick" | "optimal" | "custom",
  "time_limit": 30
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "message": "Job started"
}
```

### Check Job Status
```
GET /api/job-status/{job_id}
```
Returns the status and result of a plan generation job.

**Response:**
```json
{
  "job_id": "uuid",
  "status": "pending" | "running" | "completed" | "failed",
  "progress": 0.0 - 1.0,
  "result": {...},
  "error": null
}
```

### Find Replacement
```
POST /api/find-replacement
```
Finds best replacement candidates for emergency shift coverage.

## Testing

Run the solver tests:
```bash
python -m pytest tests/
```

Or run a quick test:
```bash
python tests/test_solver.py
```

## Architecture

```
backend/
├── main.py                 # FastAPI entry point
├── requirements.txt        # Python dependencies
├── api/
│   ├── routes.py          # API endpoints
│   └── schemas.py         # Pydantic models
├── solver/
│   ├── model.py           # Main OR-Tools solver
│   ├── constraints.py     # Hard constraint definitions
│   ├── objectives.py      # Soft constraints/optimization
│   └── solution.py        # Solution extraction/analysis
└── tests/
    └── test_solver.py     # Unit tests
```

## Constraint Types

### Hard Constraints (Must Be Satisfied)
- Each shift must have minimum required coverage
- Employee works at most one shift per day
- 11 hours minimum rest between shifts (German labor law)
- Maximum 48 hours per week
- Qualification requirements for specialized shifts
- Respect fixed/locked assignments
- Respect employee availability/time-off

### Soft Constraints (Optimization Goals)
- Fair weekend shift distribution
- Balanced workload across employees
- Minimize consecutive working days (prefer max 5)
- Maximize preference satisfaction
- Fair distribution of demanding shifts (night, on-call)

## Performance

| Scenario | Variables | Expected Time |
|----------|-----------|---------------|
| Small (10 emp, 7 days) | 350 | < 1 second |
| Medium (26 emp, 30 days) | 7,800 | 10-30 seconds |
| Large (50 emp, 30 days) | 22,500 | 1-5 minutes |

## Environment Variables

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## Troubleshooting

### Common Issues

1. **OR-Tools not installing**
   ```bash
   pip install --upgrade pip
   pip install ortools
   ```

2. **Port already in use**
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

3. **CORS errors**
   - Ensure the frontend URL is in the allowed origins in `main.py`

4. **Infeasible solutions**
   - Check for conflicting hard constraints
   - Ensure enough employees for required coverage
   - Verify qualification requirements are satisfiable

## Future Enhancements

- Redis/database for job storage (currently in-memory)
- WebSocket for real-time progress updates
- Solution caching for similar problems
- Parallel solving for multi-station plans
- Solution explanation/debugging tools
- Export to various formats (PDF, Excel)

## License

MIT
