import { Router } from "express";
import { computeNetBalances, simplifyDebts } from "../balances.js";

export const balancesRouter = Router();

balancesRouter.get("/", (req, res) => {
  res.json({
    balances: computeNetBalances(),
    settlements: simplifyDebts(),
  });
});
