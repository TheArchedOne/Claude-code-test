import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useUsers } from "../UsersContext.jsx";
import { api } from "../api.js";

const today = () => new Date().toISOString().slice(0, 10);

function formatMoney(n) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function SettleUp() {
  const { users, nameFor } = useUsers();
  const location = useLocation();
  const prefill = location.state || {};

  const [fromUser, setFromUser] = useState(prefill.fromUser ?? null);
  const [toUser, setToUser] = useState(prefill.toUser ?? null);
  const [amount, setAmount] = useState(prefill.amount ? String(prefill.amount) : "");
  const [date, setDate] = useState(today());
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (users.length === 0) return;
    if (fromUser === null) setFromUser(users[0].id);
    if (toUser === null) setToUser(users[1]?.id ?? users[0].id);
  }, [users, fromUser, toUser]);

  const loadPayments = useCallback(async () => {
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (fromUser === toUser) {
      setError("Choose two different people");
      return;
    }
    setSubmitting(true);
    try {
      await api.createPayment({ fromUser, toUser, amount: Number(amount), date });
      setAmount("");
      loadPayments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <h2>Settle up</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label className="field">
            <span>From</span>
            <select value={fromUser ?? ""} onChange={(e) => setFromUser(Number(e.target.value))}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>To</span>
            <select value={toUser ?? ""} onChange={(e) => setToUser(Number(e.target.value))}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Amount</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Recording…" : "Record payment"}
        </button>
      </form>

      <section>
        <h3>Payment history</h3>
        {payments.length === 0 ? (
          <p className="muted">No payments recorded yet.</p>
        ) : (
          <ul className="settlement-list">
            {payments.map((p) => (
              <li key={p.id} className="settlement-row">
                <span>
                  <strong>{nameFor(p.fromUser)}</strong> paid <strong>{nameFor(p.toUser)}</strong>
                </span>
                <span className="settlement-amount">{formatMoney(p.amount)}</span>
                <span className="muted small">{p.date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
