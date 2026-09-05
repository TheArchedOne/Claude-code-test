import express from "express";
import cors from "cors";
import "./db.js";
import { usersRouter } from "./routes/users.js";
import { expensesRouter } from "./routes/expenses.js";
import { paymentsRouter } from "./routes/payments.js";
import { balancesRouter } from "./routes/balances.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/balances", balancesRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Splitwise-clone API listening on http://localhost:${PORT}`);
});
