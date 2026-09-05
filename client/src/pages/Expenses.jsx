import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { useUsers } from "../UsersContext.jsx";

function formatMoney(n) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function Expenses() {
  const { nameFor } = useUsers();
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.deleteExpense(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="stack">
      <h2>All expenses</h2>
      {expenses.length === 0 ? (
        <p className="muted">No expenses yet. Add one to get started.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((exp) => (
            <li key={exp.id} className="expense-item">
              <div
                className="expense-summary"
                onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
              >
                <div>
                  <div className="expense-description">{exp.description}</div>
                  <div className="muted small">
                    {exp.date} · paid by {nameFor(exp.paidBy)}
                  </div>
                </div>
                <div className="expense-amount">{formatMoney(exp.amount)}</div>
              </div>
              {expandedId === exp.id && (
                <div className="expense-details">
                  <ul>
                    {exp.shares.map((s) => (
                      <li key={s.userId}>
                        {nameFor(s.userId)}: {formatMoney(s.share)}
                      </li>
                    ))}
                  </ul>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(exp.id)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
