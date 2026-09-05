import { Router } from "express";
import { db } from "../db.js";
import { splitEqually, splitByPercentage, splitExact, toCents, toDollars } from "../split.js";

export const expensesRouter = Router();

function serializeExpense(expense) {
  const shares = db
    .prepare("SELECT user_id AS userId, share_cents AS shareCents FROM expense_shares WHERE expense_id = ?")
    .all(expense.id)
    .map((s) => ({ userId: s.userId, share: toDollars(s.shareCents) }));
  return {
    id: expense.id,
    description: expense.description,
    amount: toDollars(expense.amount_cents),
    paidBy: expense.paid_by,
    date: expense.expense_date,
    createdAt: expense.created_at,
    shares,
  };
}

expensesRouter.get("/", (req, res) => {
  const expenses = db
    .prepare("SELECT * FROM expenses ORDER BY expense_date DESC, id DESC")
    .all()
    .map(serializeExpense);
  res.json(expenses);
});

expensesRouter.post("/", (req, res) => {
  const { description, amount, paidBy, date, splitType, participants, shares, percentages } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: "description is required" });
  }
  const amountNum = Number(amount);
  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  if (!paidBy) {
    return res.status(400).json({ error: "paidBy is required" });
  }
  const amountCents = toCents(amountNum);

  let computedShares;
  try {
    if (splitType === "exact") {
      if (!Array.isArray(shares) || shares.length === 0) {
        return res.status(400).json({ error: "shares are required for an exact split" });
      }
      computedShares = splitExact(
        amountCents,
        shares.map((s) => ({ userId: s.userId, shareCents: toCents(s.amount) }))
      );
    } else if (splitType === "percentage") {
      if (!Array.isArray(percentages) || percentages.length === 0) {
        return res.status(400).json({ error: "percentages are required for a percentage split" });
      }
      computedShares = splitByPercentage(
        amountCents,
        percentages.map((p) => ({ userId: p.userId, percent: Number(p.percent) }))
      );
    } else {
      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ error: "participants are required for an equal split" });
      }
      computedShares = splitEqually(amountCents, participants);
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const insertExpense = db.prepare(
    "INSERT INTO expenses (description, amount_cents, paid_by, expense_date) VALUES (?, ?, ?, ?)"
  );
  const insertShare = db.prepare(
    "INSERT INTO expense_shares (expense_id, user_id, share_cents) VALUES (?, ?, ?)"
  );

  const create = db.transaction(() => {
    const info = insertExpense.run(
      description.trim(),
      amountCents,
      paidBy,
      date || new Date().toISOString().slice(0, 10)
    );
    for (const share of computedShares) {
      insertShare.run(info.lastInsertRowid, share.userId, share.shareCents);
    }
    return info.lastInsertRowid;
  });

  const id = create();
  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
  res.status(201).json(serializeExpense(expense));
});

expensesRouter.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM expenses WHERE id = ?").run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: "Expense not found" });
  }
  res.status(204).end();
});
