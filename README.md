# Mini Expense Tracker

A small full-stack expense tracker built with React and Express. It lets one user add daily spending, edit or delete entries, filter visible expenses, review summary totals, compare category budgets, and export the current view to CSV.

## Tech Stack

- Frontend: React, Vite, plain CSS, Recharts, lucide-react
- Backend: Node.js, Express
- Storage: JSON file at `backend/data/db.json`
- Tests: Node's built-in test runner for backend validation/summary helpers

## Features

- Add expenses with amount, category, date, and optional note
- Validation for positive amounts, required category, valid date, and no future dates
- Expense table sorted newest first
- Edit and delete expenses
- Filter by category and by all dates, this month, last month, or a custom date range
- Summary panel for this month's total, category totals, and highest single expense
- Bar chart for expenses by category
- Consistent INR currency formatting through `Intl.NumberFormat`
- Per-category budgets with progress indicators and over-budget state
- CSV export for the currently visible expenses
- JSON-file persistence through the Express API

## Running Locally

Install dependencies:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Start the backend in one terminal:

```bash
npm --prefix backend run dev
```

Start the frontend in another terminal:

```bash
npm --prefix frontend run dev
```

The API runs on `http://localhost:4000`.
The Vite app usually runs on `http://127.0.0.1:5173`.

## Tests

```bash
npm test
```

## API Overview

- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/categories`
- `GET /api/budgets`
- `PUT /api/budgets/:category`
- `GET /api/summary`

## What Works

The full required flow is implemented: CRUD, validation, filters, summaries, charting, CSV export, budgets, and JSON persistence.

## What I Would Improve With More Time

- Add frontend component tests for filtering and form behavior
- Add API integration tests with a temporary test database file
- Add import/reset controls for the JSON data
- Add category management instead of fixed categories
