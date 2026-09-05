import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../UsersContext.jsx";
import { api } from "../api.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function AddExpense() {
  const { users } = useUsers();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(null);
  const [date, setDate] = useState(today());
  const [splitType, setSplitType] = useState("equal");
  const [included, setIncluded] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});
  const [percentages, setPercentages] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (users.length === 0) return;
    if (paidBy === null) setPaidBy(users[0].id);
    setIncluded((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next = {};
      for (const u of users) next[u.id] = true;
      return next;
    });
  }, [users, paidBy]);

  const participantIds = users.filter((u) => included[u.id]).map((u) => u.id);
  const equalShare =
    splitType === "equal" && participantIds.length > 0 && amount
      ? Number(amount) / participantIds.length
      : null;

  const exactTotal = participantIds.reduce((sum, id) => sum + (Number(exactAmounts[id]) || 0), 0);
  const percentTotal = participantIds.reduce((sum, id) => sum + (Number(percentages[id]) || 0), 0);

  function toggleParticipant(userId) {
    setIncluded((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (participantIds.length === 0) {
      setError("Select at least one participant");
      return;
    }

    const payload = {
      description,
      amount: Number(amount),
      paidBy,
      date,
      splitType,
    };
    if (splitType === "exact") {
      payload.shares = participantIds.map((id) => ({ userId: id, amount: Number(exactAmounts[id]) || 0 }));
    } else if (splitType === "percentage") {
      payload.percentages = participantIds.map((id) => ({ userId: id, percent: Number(percentages[id]) || 0 }));
    } else {
      payload.participants = participantIds;
    }

    setSubmitting(true);
    try {
      await api.createExpense(payload);
      navigate("/expenses");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <h2>Add an expense</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Description</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner at Luigi's"
            required
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Amount</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        <label className="field">
          <span>Paid by</span>
          <select value={paidBy ?? ""} onChange={(e) => setPaidBy(Number(e.target.value))}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Split type</span>
          <select value={splitType} onChange={(e) => setSplitType(e.target.value)}>
            <option value="equal">Equally</option>
            <option value="exact">By exact amounts</option>
            <option value="percentage">By percentage</option>
          </select>
        </label>

        <div className="field">
          <span>Split between</span>
          <div className="participants">
            {users.map((u) => (
              <div key={u.id} className="participant-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!included[u.id]}
                    onChange={() => toggleParticipant(u.id)}
                  />
                  {u.name}
                </label>
                {included[u.id] && splitType === "equal" && equalShare !== null && (
                  <span className="muted">${equalShare.toFixed(2)}</span>
                )}
                {included[u.id] && splitType === "exact" && (
                  <input
                    className="inline-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={exactAmounts[u.id] ?? ""}
                    onChange={(e) =>
                      setExactAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                )}
                {included[u.id] && splitType === "percentage" && (
                  <input
                    className="inline-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={percentages[u.id] ?? ""}
                    onChange={(e) =>
                      setPercentages((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                    placeholder="%"
                  />
                )}
              </div>
            ))}
          </div>
          {splitType === "exact" && (
            <p className={"hint " + (Math.abs(exactTotal - Number(amount || 0)) > 0.005 ? "hint-warn" : "")}>
              Shares total ${exactTotal.toFixed(2)} of ${Number(amount || 0).toFixed(2)}
            </p>
          )}
          {splitType === "percentage" && (
            <p className={"hint " + (Math.abs(percentTotal - 100) > 0.005 ? "hint-warn" : "")}>
              Percentages total {percentTotal.toFixed(1)}%
            </p>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Add expense"}
        </button>
      </form>
    </div>
  );
}
