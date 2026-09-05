import { Router } from "express";
import { db } from "../db.js";
import { toCents, toDollars } from "../split.js";

export const paymentsRouter = Router();

function serializePayment(p) {
  return {
    id: p.id,
    fromUser: p.from_user,
    toUser: p.to_user,
    amount: toDollars(p.amount_cents),
    date: p.payment_date,
    createdAt: p.created_at,
  };
}

paymentsRouter.get("/", (req, res) => {
  const payments = db
    .prepare("SELECT * FROM payments ORDER BY payment_date DESC, id DESC")
    .all()
    .map(serializePayment);
  res.json(payments);
});

paymentsRouter.post("/", (req, res) => {
  const { fromUser, toUser, amount, date } = req.body;
  if (!fromUser || !toUser) {
    return res.status(400).json({ error: "fromUser and toUser are required" });
  }
  if (fromUser === toUser) {
    return res.status(400).json({ error: "fromUser and toUser must differ" });
  }
  const amountNum = Number(amount);
  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const info = db
    .prepare("INSERT INTO payments (from_user, to_user, amount_cents, payment_date) VALUES (?, ?, ?, ?)")
    .run(fromUser, toUser, toCents(amountNum), date || new Date().toISOString().slice(0, 10));

  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(serializePayment(payment));
});
