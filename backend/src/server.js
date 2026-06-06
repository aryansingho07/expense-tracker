import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { readDb, writeDb } from "./store.js";
import { CATEGORIES, filterExpenses, validateBudget, validateExpense } from "./validation.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function sortNewestFirst(expenses) {
  return [...expenses].sort((a, b) => {
    if (a.date === b.date) {
      return b.id.localeCompare(a.id);
    }

    return b.date.localeCompare(a.date);
  });
}

function buildSummary(expenses) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthExpenses = expenses.filter((expense) => expense.date.startsWith(monthPrefix));
  const totalPerCategory = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));

  for (const expense of expenses) {
    totalPerCategory[expense.category] += expense.amount;
  }

  const highestExpense = expenses.reduce(
    (highest, expense) => (!highest || expense.amount > highest.amount ? expense : highest),
    null
  );

  return {
    totalSpentThisMonth: thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalPerCategory,
    highestExpense
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories", (_req, res) => {
  res.json(CATEGORIES);
});

app.get("/api/expenses", async (req, res, next) => {
  try {
    const db = await readDb();
    const filtered = filterExpenses(db.expenses, req.query);
    res.json(sortNewestFirst(filtered));
  } catch (error) {
    next(error);
  }
});

app.post("/api/expenses", async (req, res, next) => {
  try {
    const validation = validateExpense(req.body);
    if (!validation.ok) {
      return res.status(400).json({ errors: validation.errors });
    }

    const db = await readDb();
    const expense = { id: crypto.randomUUID(), ...validation.value };
    db.expenses.push(expense);
    await writeDb(db);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

app.put("/api/expenses/:id", async (req, res, next) => {
  try {
    const validation = validateExpense(req.body);
    if (!validation.ok) {
      return res.status(400).json({ errors: validation.errors });
    }

    const db = await readDb();
    const index = db.expenses.findIndex((expense) => expense.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Expense not found." });
    }

    db.expenses[index] = { id: req.params.id, ...validation.value };
    await writeDb(db);
    res.json(db.expenses[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/expenses/:id", async (req, res, next) => {
  try {
    const db = await readDb();
    const nextExpenses = db.expenses.filter((expense) => expense.id !== req.params.id);
    if (nextExpenses.length === db.expenses.length) {
      return res.status(404).json({ error: "Expense not found." });
    }

    db.expenses = nextExpenses;
    await writeDb(db);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/budgets", async (_req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.budgets);
  } catch (error) {
    next(error);
  }
});

app.put("/api/budgets/:category", async (req, res, next) => {
  try {
    const validation = validateBudget(req.params.category, req.body.amount);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const db = await readDb();
    db.budgets[req.params.category] = validation.value;
    await writeDb(db);
    res.json(db.budgets);
  } catch (error) {
    next(error);
  }
});

app.get("/api/summary", async (req, res, next) => {
  try {
    const db = await readDb();
    res.json(buildSummary(filterExpenses(db.expenses, req.query)));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong." });
});

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  app.listen(port, () => {
    console.log(`Expense API running on http://localhost:${port}`);
  });
}

export { app, buildSummary };
