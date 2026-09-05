// Splits an integer amount (cents) across participants, distributing the
// remainder one cent at a time (deterministically, by array order) so the
// shares always sum exactly to the total.
export function splitEqually(totalCents, userIds) {
  const n = userIds.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return userIds.map((userId, i) => ({
    userId,
    shareCents: base + (i < remainder ? 1 : 0),
  }));
}

export function splitByPercentage(totalCents, entries) {
  const totalPct = entries.reduce((sum, e) => sum + e.percent, 0);
  if (Math.abs(totalPct - 100) > 0.001) {
    throw new Error(`Percentages must add up to 100 (got ${totalPct})`);
  }
  const shares = entries.map((e) => ({
    userId: e.userId,
    shareCents: Math.round((totalCents * e.percent) / 100),
  }));
  const sum = shares.reduce((s, e) => s + e.shareCents, 0);
  let diff = totalCents - sum;
  let i = 0;
  while (diff !== 0 && shares.length > 0) {
    shares[i % shares.length].shareCents += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    i++;
  }
  return shares;
}

export function splitExact(totalCents, entries) {
  const sum = entries.reduce((s, e) => s + e.shareCents, 0);
  if (sum !== totalCents) {
    throw new Error(
      `Exact shares (${sum}) must add up to the total amount (${totalCents})`
    );
  }
  return entries.map((e) => ({ userId: e.userId, shareCents: e.shareCents }));
}

export function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

export function toDollars(cents) {
  return Math.round(cents) / 100;
}
