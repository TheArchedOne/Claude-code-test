import { Router } from "express";
import { db } from "../db.js";

export const usersRouter = Router();

usersRouter.get("/", (req, res) => {
  const users = db.prepare("SELECT id, name FROM users ORDER BY id").all();
  res.json(users);
});

usersRouter.post("/", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  try {
    const info = db.prepare("INSERT INTO users (name) VALUES (?)").run(name.trim());
    res.status(201).json({ id: info.lastInsertRowid, name: name.trim() });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "A user with that name already exists" });
    }
    throw err;
  }
});
