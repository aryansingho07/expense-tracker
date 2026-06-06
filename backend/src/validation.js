import { CATEGORIES } from "./constants.js";

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateExpense(input) {
  const errors = {};
  const amount = Number(input.amount);
  const category = input.category;
  const date = input.date;

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  if (!CATEGORIES.includes(category)) {
    errors.category = "Choose a valid category.";
  }

  if (!date || !isValidDateString(date)) {
    errors.date = "Enter a valid date.";
  } else if (date > todayString()) {
    errors.date = "Date cannot be in the future.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      amount: Math.round(amount * 100) / 100,
      category,
      date,
      note: String(input.note ?? "").trim()
    }
  };
}

export function validateBudget(category, amount) {
  if (!CATEGORIES.includes(category)) {
    return { ok: false, error: "Choose a valid category." };
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return { ok: false, error: "Budget must be zero or a positive number." };
  }

  return { ok: true, value: Math.round(parsedAmount * 100) / 100 };
}

export function filterExpenses(expenses, query) {
  return expenses.filter((expense) => {
    const categoryMatch = !query.category || query.category === "All" || expense.category === query.category;
    const fromMatch = !query.from || expense.date >= query.from;
    const toMatch = !query.to || expense.date <= query.to;
    return categoryMatch && fromMatch && toMatch;
  });
}

export { CATEGORIES };
