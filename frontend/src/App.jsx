import React, { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Pie, PieChart, Cell,
  CartesianGrid, ResponsiveContainer,
  Tooltip as RTooltip, XAxis, YAxis
} from "recharts";
import {
  Download, IndianRupee, Moon, Plus, ReceiptText,
  Sun, Trash2, X, Wallet, TrendingUp, TrendingDown,
  Target, ArrowUpRight, Utensils, Car, FileText,
  Tv, Folder, Search, Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "./api";
import { todayString } from "./dateFilters";
import { formatCurrency } from "./formatters";
import {
  parseISO, format, startOfWeek, startOfMonth, subMonths, isSameMonth
} from "date-fns";

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */
const emptyForm = { amount: "", category: "Food", date: todayString(), note: "" };

const CAT_COLORS = {
  Food: "#F59E0B",
  Transport: "#3B82F6",
  Bills: "#EF4444",
  Entertainment: "#8B5CF6",
  Other: "#71717A"
};

const CAT_ICONS = {
  Food: Utensils, Transport: Car, Bills: FileText,
  Entertainment: Tv, Other: Folder
};

/* ═══════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════ */
function validateForm(form) {
  const errors = {};
  const amount = Number(form.amount);
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Enter a positive amount.";
  if (!form.category) errors.category = "Choose a category.";
  if (!form.date) errors.date = "Choose a date.";
  else if (form.date > todayString()) errors.date = "Date cannot be in the future.";
  return errors;
}

function toCsv(expenses) {
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const rows = [["Date", "Category", "Amount", "Note"], ...expenses.map(e => [e.date, e.category, e.amount, e.note])];
  return rows.map(r => r.map(esc).join(",")).join("\n");
}

function downloadCsv(expenses) {
  const blob = new Blob([toCsv(expenses)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "expenses.csv"; link.click();
  URL.revokeObjectURL(url);
}

function budgetColor(pct) {
  if (pct >= 90) return "var(--danger)";
  if (pct >= 70) return "var(--warning)";
  return "var(--accent)";
}

/* ═══════════════════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border-strong)",
      borderRadius: 10, padding: "10px 14px", boxShadow: "var(--shadow-lg)"
    }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   HERO HEADER
   ═══════════════════════════════════════════════════ */
function HeroHeader({ expenses, isDark, toggleTheme, onExport, onAddExpense, budgets, userName, greeting }) {
  const today = parseISO(todayString());
  const currentExp = expenses.filter(e => isSameMonth(parseISO(e.date), today));
  const lastMonthExp = expenses.filter(e => isSameMonth(parseISO(e.date), subMonths(today, 1)));
  const spent = currentExp.reduce((s, e) => s + e.amount, 0);
  const lastSpent = lastMonthExp.reduce((s, e) => s + e.amount, 0);
  const momPct = lastSpent > 0 ? ((spent - lastSpent) / lastSpent) * 100 : null;
  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v || 0), 0);
  const remaining = totalBudget > 0 ? totalBudget - spent : null;
  const utilizedPct = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : null;

  return (
    <div className="card hero-card">
      <div className="hero-text">
        <div className="hero-heading">
          <p className="t-greeting" style={{ marginBottom: 8 }}>{greeting}, {userName}</p>
          <h1 className="t-page-title">Track spending, monitor budgets,<br />and understand your financial habits.</h1>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-label">Spent this month</span>
            <span className="hero-stat-value">{formatCurrency(spent)}</span>
            {momPct !== null && (
              <span className="hero-stat-sub" style={{ color: momPct > 0 ? "var(--danger)" : "var(--accent)" }}>
                {momPct > 0 ? "↑" : "↓"} {Math.abs(momPct).toFixed(1)}% vs last month
              </span>
            )}
          </div>
          {remaining !== null && (
            <div className="hero-stat">
              <span className="hero-stat-label">Remaining budget</span>
              <span className="hero-stat-value" style={{ color: remaining < 0 ? "var(--danger)" : undefined }}>
                {formatCurrency(remaining)}
              </span>
              <span className="hero-stat-sub">{utilizedPct}% of budget used</span>
            </div>
          )}
          {utilizedPct !== null && (
            <div className="hero-stat">
              <span className="hero-stat-label">Budget utilized</span>
              <span className="hero-stat-value" style={{ color: utilizedPct > 100 ? "var(--danger)" : undefined }}>
                {utilizedPct}%
              </span>
              <span className="hero-stat-sub">{utilizedPct <= 75 ? "Within target range" : utilizedPct <= 100 ? "Approaching limit" : "Over budget"}</span>
            </div>
          )}
        </div>
      </div>
      <div className="hero-actions">
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </motion.button>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn btn-secondary" onClick={onExport}>
          <Download size={15} /> Export
        </motion.button>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn btn-primary" onClick={onAddExpense}>
          <Plus size={15} /> Add Expense
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   KPI CARDS
   ═══════════════════════════════════════════════════ */
function KPICards({ expenses, budgets }) {
  const today = parseISO(todayString());
  const currentExp = expenses.filter(e => isSameMonth(parseISO(e.date), today));
  const lastExp = expenses.filter(e => isSameMonth(parseISO(e.date), subMonths(today, 1)));
  const spent = currentExp.reduce((s, e) => s + e.amount, 0);
  const lastSpent = lastExp.reduce((s, e) => s + e.amount, 0);
  const momPct = lastSpent > 0 ? ((spent - lastSpent) / lastSpent) * 100 : null;
  const avg = currentExp.length > 0 ? spent / currentExp.length : 0;
  const highest = expenses.reduce((h, e) => (!h || e.amount > h.amount ? e : h), null);
  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v || 0), 0);
  const remaining = totalBudget > 0 ? totalBudget - spent : null;
  const remainPct = totalBudget > 0 ? Math.round(((totalBudget - spent) / totalBudget) * 100) : null;

  const cards = [
    {
      label: "Monthly Spending",
      value: formatCurrency(spent),
      sub: momPct !== null ? `${momPct > 0 ? "+" : ""}${momPct.toFixed(1)}% vs last month` : "No prior data",
      trend: momPct !== null ? (momPct > 0 ? "up" : "down") : "neutral",
      icon: <Wallet size={16} color="var(--text-muted)" />
    },
    {
      label: "Average Transaction",
      value: formatCurrency(avg),
      sub: "Per transaction this month",
      trend: "neutral",
      icon: <ReceiptText size={16} color="var(--text-muted)" />
    },
    {
      label: "Highest Expense",
      value: highest ? formatCurrency(highest.amount) : formatCurrency(0),
      sub: highest ? `${highest.category} · ${highest.date}` : "No expenses yet",
      trend: "neutral",
      icon: <ArrowUpRight size={16} color="var(--text-muted)" />
    },
    {
      label: "Budget Remaining",
      value: remaining !== null ? formatCurrency(remaining) : "—",
      sub: remainPct !== null ? `${remainPct}% of total budget left` : "Set budgets to track",
      trend: remaining !== null ? (remaining < 0 ? "up" : "down") : "neutral",
      icon: <Target size={16} color="var(--text-muted)" />
    }
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          className="card kpi-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
        >
          <div className="kpi-header">
            <span className="t-kpi-label">{c.label}</span>
            {c.icon}
          </div>
          <div className="t-kpi-value" style={{ color: c.label === "Budget Remaining" && remaining < 0 ? "var(--danger)" : undefined }}>
            {c.value}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="t-meta">{c.sub}</span>
            {c.trend !== "neutral" && momPct !== null && c.label === "Monthly Spending" && (
              <span className={`kpi-trend ${c.trend}`}>
                {c.trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(momPct).toFixed(1)}%
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SPENDING TREND (seamless)
   ═══════════════════════════════════════════════════ */
function SpendingTrend({ expenses }) {
  const [tab, setTab] = useState("daily");

  const data = useMemo(() => {
    if (!expenses.length) return [];
    const sorted = [...expenses].sort((a, b) => a.date > b.date ? 1 : -1);
    const grouped = {};
    sorted.forEach(e => {
      const d = parseISO(e.date);
      const key = tab === "daily" ? e.date
        : tab === "weekly" ? format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d")
        : format(startOfMonth(d), "MMM yy");
      grouped[key] = (grouped[key] || 0) + e.amount;
    });
    return Object.keys(grouped).map(k => ({ date: k, amount: grouped[k] }));
  }, [expenses, tab]);

  return (
    <div>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2 className="t-section-title">Spending Trend</h2>
        <div className="chart-tabs">
          {["daily", "weekly", "monthly"].map(t => (
            <button key={t} className={`chart-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 280 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickMargin={10} minTickGap={24} />
              <YAxis tickFormatter={v => formatCurrency(v).split(".")[0]} tickLine={false} axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={72} />
              <RTooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={2}
                fill="url(#areaGrad)" fillOpacity={1} dot={false} activeDot={{ r: 5, fill: "var(--accent)" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ height: "100%" }}>
            <p className="t-meta">No spending data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CATEGORY BREAKDOWN (seamless)
   ═══════════════════════════════════════════════════ */
function CategoryBreakdown({ categoryTotals }) {
  const data = categoryTotals.filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = data.reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <h2 className="t-section-title" style={{ marginBottom: 24 }}>Category Breakdown</h2>
      {data.length > 0 ? (
        <>
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="category"
                  cx="50%" cy="50%" innerRadius="60%" outerRadius="84%"
                  paddingAngle={2} stroke="none">
                  {data.map((entry, i) => (
                    <Cell key={i} fill={CAT_COLORS[entry.category] || CAT_COLORS.Other} />
                  ))}
                </Pie>
                <RTooltip formatter={v => formatCurrency(v)}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10, boxShadow: "var(--shadow-lg)" }}
                  itemStyle={{ color: "var(--text-primary)", fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-center-value">{formatCurrency(total)}</span>
              <span className="donut-center-label">Total spent</span>
            </div>
          </div>
          <div className="donut-legend">
            {data.map(item => (
              <div key={item.category} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ background: CAT_COLORS[item.category] || CAT_COLORS.Other }} />
                <span className="donut-legend-name">{item.category}</span>
                <span className="donut-legend-val">{formatCurrency(item.amount)}</span>
                <span className="t-meta" style={{ minWidth: 32, textAlign: "right" }}>
                  {total > 0 ? Math.round((item.amount / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ padding: "32px 0" }}>
          <p className="t-meta">No category data yet</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TRANSACTIONS (seamless)
   ═══════════════════════════════════════════════════ */
function TransactionsSection({ expenses, categories, budgets, onEdit, onDelete, onAdd }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const today = parseISO(todayString());
  const catSpend = useMemo(() => {
    const cur = expenses.filter(e => isSameMonth(parseISO(e.date), today));
    const map = {};
    cur.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return map;
  }, [expenses]);

  const visible = useMemo(() => {
    return expenses.filter(e => {
      const mc = filterCat === "All" || e.category === filterCat;
      const ms = !search || e.note?.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
      return mc && ms;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterCat, search]);

  return (
    <div className="dash-section">
      <div className="section-head">
        <h2 className="t-section-title">Recent Transactions</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="search-wrapper" style={{ width: 220 }}>
            <Search size={14} />
            <input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="tx-table">
          <thead>
            <tr>
              <th className="t-kpi-label" style={{ width: "30%" }}>Description</th>
              <th className="t-kpi-label" style={{ width: "16%" }}>Category</th>
              <th className="t-kpi-label" style={{ width: "14%" }}>Date</th>
              <th className="t-kpi-label" style={{ width: "14%", textAlign: "right" }}>Amount</th>
              <th className="t-kpi-label" style={{ width: "16%" }}>Budget</th>
              <th className="t-kpi-label" style={{ width: "10%", textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(e => {
              const Icon = CAT_ICONS[e.category] || Folder;
              const bgt = Number(budgets[e.category] || 0);
              const spent = catSpend[e.category] || 0;
              const pct = bgt > 0 ? Math.min(Math.round((spent / bgt) * 100), 100) : 0;
              return (
                <tr key={e.id} className="tx-row">
                  <td>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                      {e.note || "No description"}
                    </span>
                  </td>
                  <td>
                    <span className="cat-badge" style={{ color: CAT_COLORS[e.category], borderColor: `${CAT_COLORS[e.category]}40` }}>
                      <Icon size={11} strokeWidth={2} />
                      {e.category}
                    </span>
                  </td>
                  <td><span className="t-meta">{e.date}</span></td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>
                    {formatCurrency(e.amount)}
                  </td>
                  <td>
                    {bgt > 0 ? (
                      <div className="budget-pill">
                        <div className="budget-pill-bar">
                          <div className="budget-pill-fill" style={{ width: `${pct}%`, background: budgetColor(pct) }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    ) : <span className="t-meta">—</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <motion.button whileHover={{ scale: 1.1 }} className="icon-btn" style={{ width: 30, height: 30, border: "none" }}
                        onClick={ev => { ev.stopPropagation(); onEdit(e); }}>
                        <Edit2 size={13} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} className="icon-btn" style={{ width: 30, height: 30, border: "none", color: "var(--danger)" }}
                        onClick={ev => { ev.stopPropagation(); onDelete(e.id); }}>
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><ReceiptText size={28} /></div>
            <p className="t-section-title" style={{ fontSize: 16 }}>No transactions found</p>
            <p className="t-body">Start tracking by adding your first expense.</p>
            <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={onAdd}>
              <Plus size={15} /> Add Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BUDGET TRACKER (seamless)
   ═══════════════════════════════════════════════════ */
function BudgetTracker({ budgets, categoryTotals, onEdit }) {
  return (
    <div className="dash-section">
      <div className="section-head">
        <h2 className="t-section-title">Budget Tracker</h2>
        <button className="btn btn-secondary" style={{ height: 34, fontSize: 13 }} onClick={onEdit}>
          <Edit2 size={13} /> Edit Budgets
        </button>
      </div>
      <div className="budget-grid">
        {categoryTotals.map(item => {
          const bgt = Number(budgets[item.category] || 0);
          const pct = bgt > 0 ? Math.min(Math.round((item.amount / bgt) * 100), 100) : 0;
          const color = budgetColor(pct);
          return (
            <div key={item.category} className="budget-item">
              <div className="budget-item-head">
                <span className="budget-item-name">{item.category}</span>
                <span className="budget-item-meta">
                  {bgt > 0 ? `${formatCurrency(item.amount)} / ${formatCurrency(bgt)}` : `${formatCurrency(item.amount)} spent`}
                </span>
              </div>
              <div className="budget-bar-bg">
                <motion.div className="budget-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{ background: color }}
                />
              </div>
              {bgt > 0 && (
                <p className="budget-pct" style={{ color }}>{pct}% used</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPENSE MODAL
   ═══════════════════════════════════════════════════ */
function ExpenseModal({ isOpen, onClose, form, categories, errors, isEditing, onChange, onSubmit }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div className="modal-box"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}>
            <div className="modal-head">
              <h2 className="t-section-title">{isEditing ? "Edit Transaction" : "New Transaction"}</h2>
              <button className="icon-btn" style={{ border: "none" }} onClick={onClose}><X size={18} /></button>
            </div>
            <form className="modal-body" onSubmit={onSubmit}>
              <div className="form-field">
                <label className="field-label">Amount</label>
                <div className="field-input-icon">
                  <IndianRupee size={15} />
                  <input type="number" step="0.01" min="0.01" className={`field-input ${errors.amount ? "error" : ""}`}
                    value={form.amount} onChange={e => onChange({ ...form, amount: e.target.value })}
                    placeholder="0.00" autoFocus />
                </div>
                {errors.amount && <span className="error-msg">{errors.amount}</span>}
              </div>
              <div className="form-field">
                <label className="field-label">Category</label>
                <select className={`field-input ${errors.category ? "error" : ""}`}
                  value={form.category} onChange={e => onChange({ ...form, category: e.target.value })}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="error-msg">{errors.category}</span>}
              </div>
              <div className="form-field">
                <label className="field-label">Date</label>
                <input type="date" max={todayString()} className={`field-input ${errors.date ? "error" : ""}`}
                  value={form.date} onChange={e => onChange({ ...form, date: e.target.value })} />
                {errors.date && <span className="error-msg">{errors.date}</span>}
              </div>
              <div className="form-field">
                <label className="field-label">Note (optional)</label>
                <input type="text" className="field-input" value={form.note}
                  onChange={e => onChange({ ...form, note: e.target.value })} placeholder="What was this for?" />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? "Save Changes" : "Add Expense"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════
   BUDGET MODAL
   ═══════════════════════════════════════════════════ */
function BudgetModal({ isOpen, onClose, budgets, categories, onSave }) {
  const [local, setLocal] = useState(budgets);
  useEffect(() => { setLocal(budgets); }, [budgets, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div className="modal-box"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}>
            <div className="modal-head">
              <h2 className="t-section-title">Monthly Budgets</h2>
              <button className="icon-btn" style={{ border: "none" }} onClick={onClose}><X size={18} /></button>
            </div>
            <form className="modal-body" onSubmit={e => { e.preventDefault(); onSave(local); onClose(); }}>
              <div style={{ display: "grid", gap: 12, maxHeight: "55vh", overflowY: "auto", paddingRight: 2 }}>
                {categories.map(cat => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{cat}</span>
                    <div className="field-input-icon" style={{ width: 160 }}>
                      <IndianRupee size={14} />
                      <input type="number" min="0" step="100" className="field-input"
                        value={local[cat] || ""} onChange={e => setLocal({ ...local, [cat]: e.target.value })}
                        placeholder="0" />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Budgets</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════
   ONBOARDING SCREENS
   ═══════════════════════════════════════════════════ */
function OnboardingName({ onNext }) {
  const [name, setName] = useState("");
  return (
    <div className="onboarding-screen">
      <motion.div className="onboarding-card"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="onboarding-icon">
          <Wallet size={32} />
        </div>
        <div>
          <h1 className="t-page-title" style={{ fontSize: 26, marginBottom: 10 }}>Welcome to Expense Tracker</h1>
          <p className="t-body" style={{ lineHeight: 1.7 }}>
            A premium personal finance dashboard to track spending, set budgets, and understand your money.
          </p>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (name.trim()) onNext(name.trim()); }}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          <div className="form-field">
            <label className="field-label">What's your name?</label>
            <input type="text" className="field-input" placeholder="e.g. Aryan Singh"
              value={name} onChange={e => setName(e.target.value)} autoFocus
              style={{ height: 46, fontSize: 15 }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 46, fontSize: 15, opacity: name.trim() ? 1 : 0.45 }}
            disabled={!name.trim()}>
            Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function OnboardingBudget({ userName, budgets, categories, onSave, onNext, onSkip }) {
  const [local, setLocal] = useState(budgets);
  return (
    <div className="onboarding-screen">
      <motion.div className="onboarding-card"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="onboarding-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
          <Target size={32} />
        </div>
        <div>
          <h1 className="t-page-title" style={{ fontSize: 26, marginBottom: 10 }}>Set Your Budgets, {userName}</h1>
          <p className="t-body" style={{ lineHeight: 1.7 }}>
            Set monthly spending limits for each category. You can always update these later.
          </p>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(local); onNext(); }}
          style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
          {categories.map(cat => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{cat}</span>
              <div className="field-input-icon" style={{ width: 160 }}>
                <IndianRupee size={14} />
                <input type="number" min="0" step="100" className="field-input"
                  value={local[cat] || ""} onChange={e => setLocal({ ...local, [cat]: e.target.value })}
                  placeholder="0" />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, height: 46 }} onClick={onSkip}>Skip</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 46 }}>Save & Continue</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OnboardingExpense({ onAddExpense, onSkip }) {
  return (
    <div className="onboarding-screen">
      <motion.div className="onboarding-card"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="onboarding-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          <ReceiptText size={32} />
        </div>
        <div>
          <h1 className="t-page-title" style={{ fontSize: 26, marginBottom: 10 }}>Add your first expense</h1>
          <p className="t-body" style={{ lineHeight: 1.7 }}>
            Log a transaction to start seeing insights. This is optional — you can add expenses any time from the dashboard.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-secondary" style={{ flex: 1, height: 46 }} onClick={onSkip}>Go to Dashboard</button>
          <button className="btn btn-primary" style={{ flex: 1, height: 46 }} onClick={onAddExpense}>
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════════ */
export default function App() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("loading");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const [userName, setUserName] = useState(() => window.localStorage.getItem("expense-user-name") || "");
  const [obStep, setObStep] = useState("name"); // name | budget | expense | done

  const [theme, setTheme] = useState(() => {
    const s = window.localStorage.getItem("expense-theme");
    if (s) return s;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("expense-theme", theme);
  }, [theme]);

  async function loadData() {
    try {
      const [c, e, b] = await Promise.all([api.getCategories(), api.getExpenses(), api.getBudgets()]);
      setCategories(c); setExpenses(e); setBudgets(b);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => { loadData(); }, []);

  const categoryTotals = useMemo(() => {
    const today = parseISO(todayString());
    const cur = expenses.filter(e => isSameMonth(parseISO(e.date), today));
    return categories.map(cat => ({
      category: cat,
      amount: cur.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
    }));
  }, [categories, expenses]);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = { ...form, amount: Number(form.amount) };
    try {
      if (editingId) await api.updateExpense(editingId, payload);
      else await api.createExpense(payload);
      await loadData();
      setIsExpenseModalOpen(false);
      setForm(emptyForm); setEditingId(null); setErrors({});
    } catch (err) {
      setErrors(err.details?.errors ?? { form: err.message });
    }
  }

  function handleEdit(exp) {
    setEditingId(exp.id);
    setForm({ amount: String(exp.amount), category: exp.category, date: exp.date, note: exp.note });
    setIsExpenseModalOpen(true);
  }

  async function handleDelete(id) {
    if (window.confirm("Delete this transaction?")) { await api.deleteExpense(id); await loadData(); }
  }

  async function handleSaveBudgets(newB) {
    const res = await Promise.all(categories.map(cat => api.updateBudget(cat, Number(newB[cat] || 0))));
    if (res.length) setBudgets(res[res.length - 1]);
  }

  const openAddExpense = () => { setEditingId(null); setForm(emptyForm); setIsExpenseModalOpen(true); };
  const openBudgetModal = () => setIsBudgetModalOpen(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const isDark = theme === "dark";

  /* ─── Onboarding ─── */
  if (status === "ok" && obStep !== "done") {
    if (obStep === "name") {
      if (userName) { setObStep("done"); }
      else return (
        <OnboardingName onNext={name => {
          window.localStorage.setItem("expense-user-name", name);
          setUserName(name); setObStep("budget");
        }} />
      );
    }
    if (obStep === "budget") return (
      <OnboardingBudget userName={userName} budgets={budgets} categories={categories}
        onSave={handleSaveBudgets} onNext={() => setObStep("expense")} onSkip={() => setObStep("expense")} />
    );
    if (obStep === "expense") return (
      <>
        <OnboardingExpense
          onAddExpense={() => { setObStep("done"); openAddExpense(); }}
          onSkip={() => setObStep("done")} />
        <ExpenseModal isOpen={isExpenseModalOpen}
          onClose={() => { setIsExpenseModalOpen(false); setForm(emptyForm); setErrors({}); setObStep("done"); }}
          form={form} categories={categories} errors={errors} isEditing={false}
          onChange={setForm} onSubmit={async e => { await handleSubmit(e); setObStep("done"); }} />
      </>
    );
  }

  /* ─── Loading ─── */
  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p className="t-meta">Loading your dashboard…</p>
    </div>
  );

  /* ─── Error ─── */
  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p style={{ color: "var(--danger)" }}>Could not connect to backend. Is the server running?</p>
    </div>
  );

  /* ─── Dashboard ─── */
  return (
    <div className="dashboard-root">
      <HeroHeader expenses={expenses} isDark={isDark}
        toggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
        onExport={() => downloadCsv(expenses)} onAddExpense={openAddExpense}
        budgets={budgets} userName={userName} greeting={greeting} />

      <KPICards expenses={expenses} budgets={budgets} />

      <div className="section-rule" />

      {/* Analytics */}
      <div className="dash-section" style={{ marginBottom: 0 }}>
        <div className="analytics-grid">
          <SpendingTrend expenses={expenses} />
          <CategoryBreakdown categoryTotals={categoryTotals} />
        </div>
      </div>

      <div className="section-rule" />

      <TransactionsSection
        expenses={expenses} categories={categories} budgets={budgets}
        onEdit={handleEdit} onDelete={handleDelete} onAdd={openAddExpense} />

      <div className="section-rule" />

      <BudgetTracker budgets={budgets} categoryTotals={categoryTotals} onEdit={openBudgetModal} />

      <ExpenseModal isOpen={isExpenseModalOpen}
        onClose={() => { setIsExpenseModalOpen(false); setEditingId(null); setForm(emptyForm); setErrors({}); }}
        form={form} categories={categories} errors={errors}
        isEditing={!!editingId} onChange={setForm} onSubmit={handleSubmit} />

      <BudgetModal isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgets={budgets} categories={categories} onSave={handleSaveBudgets} />
    </div>
  );
}
