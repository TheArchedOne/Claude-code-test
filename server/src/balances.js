import { db } from "./db.js";
import { toDollars } from "./split.js";

// Net cents each user is owed (positive) or owes (negative), from expense
// shares and settlement payments combined.
export function computeNetBalances() {
  const users = db.prepare("SELECT id, name FROM users ORDER BY id").all();
  const net = new Map(users.map((u) => [u.id, 0]));

  const expenses = db.prepare("SELECT id, amount_cents, paid_by FROM expenses").all();
  const sharesByExpense = new Map();
  for (const share of db.prepare("SELECT expense_id, user_id, share_cents FROM expense_shares").all()) {
    if (!sharesByExpense.has(share.expense_id)) sharesByExpense.set(share.expense_id, []);
    sharesByExpense.get(share.expense_id).push(share);
  }

  for (const expense of expenses) {
    net.set(expense.paid_by, (net.get(expense.paid_by) || 0) + expense.amount_cents);
    const shares = sharesByExpense.get(expense.id) || [];
    for (const share of shares) {
      net.set(share.user_id, (net.get(share.user_id) || 0) - share.share_cents);
    }
  }

  for (const payment of db.prepare("SELECT from_user, to_user, amount_cents FROM payments").all()) {
    net.set(payment.from_user, (net.get(payment.from_user) || 0) + payment.amount_cents);
    net.set(payment.to_user, (net.get(payment.to_user) || 0) - payment.amount_cents);
  }

  return users.map((u) => ({
    userId: u.id,
    name: u.name,
    netCents: net.get(u.id) || 0,
    net: toDollars(net.get(u.id) || 0),
  }));
}

// Greedily matches debtors to creditors to minimize the number of
// transactions needed to settle all balances.
export function simplifyDebts() {
  const balances = computeNetBalances();
  const creditors = balances
    .filter((b) => b.netCents > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.netCents - a.netCents);
  const debtors = balances
    .filter((b) => b.netCents < 0)
    .map((b) => ({ ...b, netCents: -b.netCents }))
    .sort((a, b) => b.netCents - a.netCents);

  const settlements = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.netCents, debtor.netCents);
    if (amount > 0) {
      settlements.push({
        from: debtor.name,
        fromId: debtor.userId,
        to: creditor.name,
        toId: creditor.userId,
        amount: toDollars(amount),
      });
    }
    creditor.netCents -= amount;
    debtor.netCents -= amount;
    if (creditor.netCents === 0) ci++;
    if (debtor.netCents === 0) di++;
  }
  return settlements;
}
