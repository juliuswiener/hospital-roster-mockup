# Hospital Roster Planner with OR-Tools

Interactive hospital shift planning application with **automatic schedule generation** powered by Google OR-Tools CP-SAT solver.

## Features

- **Automatic Plan Generation** (NEW)
  - OR-Tools CP-SAT constraint satisfaction solver
  - Hard constraints: labor law compliance, qualifications, coverage requirements
  - Soft constraints: fairness optimization, preference satisfaction, workload balancing
  - Configurable optimization modes (quick, optimal, custom)
  - Real-time progress tracking

- **Multiple Planning Views**
  - Mitarbeiter (Employee) view
  - Kompakt (Compact) view
  - Schichten (Excel) view

- **Rule Management**
  - Hard rules (cannot be violated)
  - Soft rules (optimization goals) with weighting
  - Natural language rule input
  - Rule editing interface

- **Advanced Features**
  - Constraint violation detection and suggestions
  - Emergency coverage finder (Ersatzfinder)
  - Plan generation with full configuration
  - Employee and shift management
  - Detailed side panels for information display

## Quick Start

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Backend Dependencies
```bash
npm run backend:install
# or: cd backend && pip install -r requirements.txt
```

### 3. Start the Backend Server
```bash
npm run backend:start
# or: cd backend && python -m uvicorn main:app --reload
```

The backend will be available at http://localhost:8000

### 4. Start the Frontend
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Using Automatic Plan Generation

1. Click the **"Generieren"** button in the planning view
2. Configure your optimization settings:
   - **Time period**: Select the date range to plan
   - **Stations**: Choose which departments to include
   - **Optimization mode**: Quick (30s), Optimal (3-5min), or Custom
3. Click **"Generieren"** to start the solver
4. Watch the real-time progress as the solver optimizes the schedule
5. The generated plan will automatically appear in the grid

## Architecture

```
hospital-roster-mockup/
├── frontend/                    # React + Vite application
│   ├── index.jsx               # Main application
│   ├── src/
│   │   ├── solver/             # OR-Tools API client
│   │   │   ├── api.js          # Backend communication
│   │   │   └── hooks.js        # React hooks
│   │   ├── components/         # UI components
│   │   └── data/               # Sample data
│   └── package.json
│
└── backend/                     # Python FastAPI + OR-Tools
    ├── main.py                 # FastAPI entry point
    ├── solver/
    │   ├── model.py            # CP-SAT model builder
    │   ├── constraints.py      # Hard constraints
    │   ├── objectives.py       # Soft constraints
    │   └── solution.py         # Solution extraction
    ├── api/
    │   ├── routes.py           # REST endpoints
    │   └── schemas.py          # Data models
    └── requirements.txt
```

## Technologies

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- Material UI (date pickers)
- Day.js (date handling)

**Backend:**
- Python 3.9+
- Google OR-Tools CP-SAT
- FastAPI
- Pydantic
- Uvicorn

## Constraint Types

### Hard Constraints (Must Be Satisfied)
- Each shift covered by minimum required staff
- One shift per day per employee
- 11 hours minimum rest between shifts (Arbeitszeitgesetz)
- Maximum 48 hours per week
- Qualification requirements for specialized shifts
- Respect fixed/locked assignments
- Respect employee availability

### Soft Constraints (Optimization Goals)
- Fair weekend shift distribution
- Balanced workload across employees
- Minimize consecutive working days (max 5)
- Maximize preference satisfaction
- Fair distribution of demanding shifts

## Development Scripts

```bash
# Frontend
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build

# Backend
npm run backend:install  # Install Python dependencies
npm run backend:start    # Start backend server
npm run backend:test     # Run solver tests
```

## API Endpoints

- `GET /api/health` - Backend health check
- `POST /api/generate-plan` - Start plan generation job
- `GET /api/job-status/{job_id}` - Check job progress
- `POST /api/find-replacement` - Find shift replacement candidates

## Performance

| Scenario | Variables | Expected Time |
|----------|-----------|---------------|
| Small (10 emp, 7 days) | ~350 | < 1 second |
| Medium (26 emp, 30 days) | ~7,800 | 10-30 seconds |
| Large (50 emp, 30 days) | ~22,500 | 1-5 minutes |

## Troubleshooting

### Backend not connecting
- Ensure the backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Verify Python 3.9+ is installed

### OR-Tools installation fails
```bash
pip install --upgrade pip
pip install ortools
```

### Plan generation fails
- Check for conflicting hard constraints
- Ensure enough employees for required coverage
- Verify qualifications match shift requirements

## Documentation

- [Automatic Plan Creation Plan](./AUTOMATIC_PLAN_CREATION_PLAN.md) - Detailed implementation architecture
- [Backend README](./backend/README.md) - Backend-specific documentation

## License

MIT
