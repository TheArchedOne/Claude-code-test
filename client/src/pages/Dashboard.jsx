import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

function formatMoney(n) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const result = await api.getBalances();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading…</p>;

  const { balances, settlements } = data;

  return (
    <div className="stack">
      <section>
        <h2>Balances</h2>
        <div className="card-grid">
          {balances.map((b) => (
            <div key={b.userId} className={"balance-card " + (b.net > 0 ? "positive" : b.net < 0 ? "negative" : "even")}>
              <div className="balance-name">{b.name}</div>
              <div className="balance-amount">
                {b.net === 0
                  ? "settled up"
                  : b.net > 0
                  ? `is owed ${formatMoney(b.net)}`
                  : `owes ${formatMoney(-b.net)}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Suggested settlements</h2>
        {settlements.length === 0 ? (
          <p className="muted">Everyone is settled up. 🎉</p>
        ) : (
          <ul className="settlement-list">
            {settlements.map((s, i) => (
              <li key={i} className="settlement-row">
                <span>
                  <strong>{s.from}</strong> pays <strong>{s.to}</strong>
                </span>
                <span className="settlement-amount">{formatMoney(s.amount)}</span>
                <button
                  className="btn-small"
                  onClick={() =>
                    navigate("/settle", {
                      state: { fromUser: s.fromId, toUser: s.toId, amount: s.amount },
                    })
                  }
                >
                  Record payment
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
