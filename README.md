# Hospital Roster Planner Mockup

Interactive mockup for a hospital shift planning application with advanced rule management and constraint solving.

## Features

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

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- Material UI (date pickers)
- Day.js (date handling)

## Demo Features

The mockup includes pre-filled demo data for easy demonstration:
- Sample employees with qualifications
- Shift types with requirements
- Example rules (hard and soft)
- Natural language input with default text
