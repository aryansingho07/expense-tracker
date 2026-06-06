const API_URL = import.meta.env.VITE_API_URL ?? "https://expense-tracker-aiaf.onrender.com/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const error = new Error(details.error ?? "Request failed");
    error.details = details;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getCategories: () => request("/categories"),
  getExpenses: () => request("/expenses"),
  createExpense: (expense) =>
    request("/expenses", { method: "POST", body: JSON.stringify(expense) }),
  updateExpense: (id, expense) =>
    request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(expense) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),
  getBudgets: () => request("/budgets"),
  updateBudget: (category, amount) =>
    request(`/budgets/${category}`, { method: "PUT", body: JSON.stringify({ amount }) })
};
