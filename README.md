# Mini Expense Tracker

## Project Title & Brief Description

Mini Expense Tracker is the expense-tracking exercise: a small full-stack app for logging personal expenses, organizing them by category, tracking monthly budgets, reviewing spending charts, and exporting transaction data. The frontend is a React dashboard, and the backend is an Express API that persists expenses and budgets to a local JSON file.

## Live Demo Links

- Deployed backend API: https://expense-tracker-aiaf.onrender.com/api
- Health check: https://expense-tracker-aiaf.onrender.com/api/health
- Deployed frontend: not included in the repository metadata. Add the hosted frontend URL here after deployment.

## Tech Stack

- React: builds the single-page dashboard UI and manages form, modal, onboarding, and filter state.
- Vite: provides a fast local dev server and production frontend build.
- Recharts: renders spending trend and category breakdown charts.
- Framer Motion: adds lightweight UI transitions for cards and modals.
- lucide-react: supplies consistent dashboard and action icons.
- date-fns: handles date parsing, month comparisons, and chart grouping.
- Express: exposes the REST API for categories, expenses, budgets, health, and summaries.
- cors: allows the Vite frontend to call the API during local development and deployment.
- Node.js JSON file storage: keeps the project simple by persisting data in `backend/data/db.json` without requiring a database setup.
- Node test runner: tests validation, filtering, and summary logic with no extra test framework.

## How to Run Locally

These commands assume Node.js and npm are installed.

Install dependencies from the project root:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Start the backend in one terminal:

```bash
npm --prefix backend run dev
```

Start the frontend in a second terminal on macOS/Linux:

```bash
VITE_API_URL=http://localhost:4000/api npm --prefix frontend run dev
```

Start the frontend in a second terminal on Windows PowerShell:

```powershell
$env:VITE_API_URL="http://localhost:4000/api"
npm --prefix frontend run dev
```

Open the Vite URL shown in the terminal, usually `http://127.0.0.1:5173`. The backend runs at `http://localhost:4000`.

Run backend tests:

```bash
npm --prefix backend test
```

Build the frontend:

```bash
npm --prefix frontend run build
```

## API Documentation

Base URL locally: `http://localhost:4000/api`

Expense object shape:

```json
{
  "id": "uuid",
  "amount": 125.5,
  "category": "Food",
  "date": "2026-06-07",
  "note": "Lunch"
}
```

Budget object shape:

```json
{
  "Food": 0,
  "Transport": 0,
  "Bills": 0,
  "Entertainment": 0,
  "Other": 0
}
```

| Method | Path | Request body | Response shape |
| --- | --- | --- | --- |
| `GET` | `/health` | None | `{ "ok": true }` |
| `GET` | `/categories` | None | `["Food", "Transport", "Bills", "Entertainment", "Other"]` |
| `GET` | `/expenses` | None. Optional query params: `category`, `from`, `to` | `Expense[]`, sorted newest first |
| `POST` | `/expenses` | `{ "amount": number, "category": string, "date": "YYYY-MM-DD", "note": string }` | `201 Created` with the created `Expense` |
| `PUT` | `/expenses/:id` | `{ "amount": number, "category": string, "date": "YYYY-MM-DD", "note": string }` | Updated `Expense` |
| `DELETE` | `/expenses/:id` | None | `204 No Content` |
| `GET` | `/budgets` | None | `Budget` |
| `PUT` | `/budgets/:category` | `{ "amount": number }` | Updated `Budget` |
| `GET` | `/summary` | None. Optional query params: `category`, `from`, `to` | `{ "totalSpentThisMonth": number, "totalPerCategory": Budget, "highestExpense": Expense | null }` |

Validation errors use these shapes:

```json
{
  "errors": {
    "amount": "Amount must be a positive number.",
    "category": "Choose a valid category.",
    "date": "Enter a valid date."
  }
}
```

```json
{
  "error": "Expense not found."
}
```

## Project Structure

```text
expense-tracker/
|-- backend/
|   |-- src/
|   |   |-- constants.js      # Shared categories and default budgets
|   |   |-- server.js         # Express app, routes, and summary builder
|   |   |-- store.js          # JSON file persistence helpers
|   |   `-- validation.js     # Expense, budget, and filter validation helpers
|   |-- test/
|   |   `-- validation.test.js # Backend unit tests
|   `-- package.json          # Backend scripts and dependencies
|-- frontend/
|   |-- src/
|   |   |-- App.jsx           # Main dashboard, onboarding, modals, charts, and CRUD flow
|   |   |-- api.js            # API client wrapper
|   |   |-- dateFilters.js    # Date helper utilities
|   |   |-- formatters.js     # Currency formatting helpers
|   |   |-- main.jsx          # React entry point
|   |   `-- styles.css        # Application styles
|   |-- index.html            # Vite HTML shell
|   `-- package.json          # Frontend scripts and dependencies
`-- README.md
```

Generated folders such as `node_modules`, `frontend/dist`, and `backend/data` are omitted from the tree.

## Next Steps

- Deploy the frontend and replace the placeholder in the Live Demo Links section with the public app URL.
- Add frontend component tests for the expense form, filters, onboarding, and budget modal.
- Add API integration tests that use a temporary JSON database instead of the development data file.
- Add category management so users are not limited to the fixed category list.
- Move persistence from JSON files to a real database if the app needs multiple users or durable hosted storage.
