# Splitup

A small Splitwise-style expense sharing app for a group of friends. Seeded
with four people: Sparks, Nick, Dan, and Bison.

Track shared expenses, split them equally, by exact amounts, or by
percentage, and see a simplified list of who owes whom — then record
payments as debts get settled.

## Stack

- `server/` — Express API backed by SQLite (`better-sqlite3`)
- `client/` — React app (Vite), talks to the API at `/api/*` via a dev proxy

## Running it

In one terminal:

```
cd server
npm install
npm run dev
```

This starts the API on `http://localhost:4000` and creates
`server/data/splitwise.sqlite` on first run, seeded with the four users.

In another terminal:

```
cd client
npm install
npm run dev
```

This starts the frontend on `http://localhost:5173` (proxies `/api` to the
server).

## Features

- **Dashboard** — each person's net balance, plus a simplified settle-up
  list (minimum number of payments to get everyone even)
- **Add Expense** — split equally, by exact dollar amounts, or by
  percentage, among any subset of the group
- **Expenses** — full history with per-person share breakdown; delete an
  expense to remove it from balances
- **Settle Up** — record a payment between two people (e.g. after a bank
  transfer) and see payment history

## API

| Method | Path             | Description                          |
| ------ | ---------------- | ------------------------------------ |
| GET    | /api/users       | List users                           |
| POST   | /api/users       | Add a user                           |
| GET    | /api/expenses    | List expenses (with per-user shares) |
| POST   | /api/expenses    | Add an expense                       |
| DELETE | /api/expenses/:id| Remove an expense                    |
| GET    | /api/payments    | List recorded settlements            |
| POST   | /api/payments    | Record a settlement payment          |
| GET    | /api/balances    | Net balances + suggested settlements |

All amounts are stored internally in cents to avoid floating-point rounding
issues.
