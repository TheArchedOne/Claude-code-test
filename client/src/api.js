const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getUsers: () => request("/users"),
  createUser: (name) => request("/users", { method: "POST", body: JSON.stringify({ name }) }),

  getExpenses: () => request("/expenses"),
  createExpense: (payload) => request("/expenses", { method: "POST", body: JSON.stringify(payload) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),

  getPayments: () => request("/payments"),
  createPayment: (payload) => request("/payments", { method: "POST", body: JSON.stringify(payload) }),

  getBalances: () => request("/balances"),
};
