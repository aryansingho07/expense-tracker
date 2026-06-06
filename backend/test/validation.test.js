import test from "node:test";
import assert from "node:assert/strict";
import { buildSummary } from "../src/server.js";
import { filterExpenses, validateExpense } from "../src/validation.js";

test("validateExpense rejects invalid amount, category, and future date", () => {
  const futureYear = new Date().getFullYear() + 1;
  const result = validateExpense({
    amount: -20,
    category: "Snacks",
    date: `${futureYear}-01-01`
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.amount, "Amount must be a positive number.");
  assert.equal(result.errors.category, "Choose a valid category.");
  assert.equal(result.errors.date, "Date cannot be in the future.");
});

test("filterExpenses applies category and date range together", () => {
  const expenses = [
    { id: "1", amount: 10, category: "Food", date: "2026-05-01" },
    { id: "2", amount: 20, category: "Food", date: "2026-06-01" },
    { id: "3", amount: 30, category: "Bills", date: "2026-06-02" }
  ];

  assert.deepEqual(filterExpenses(expenses, { category: "Food", from: "2026-06-01", to: "2026-06-30" }), [
    expenses[1]
  ]);
});

test("buildSummary returns category totals and highest expense", () => {
  const expenses = [
    { id: "1", amount: 10, category: "Food", date: "2026-06-01" },
    { id: "2", amount: 25, category: "Bills", date: "2026-06-02" }
  ];

  const summary = buildSummary(expenses);
  assert.equal(summary.totalPerCategory.Food, 10);
  assert.equal(summary.totalPerCategory.Bills, 25);
  assert.equal(summary.highestExpense.id, "2");
});
