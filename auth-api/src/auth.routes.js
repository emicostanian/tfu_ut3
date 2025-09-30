import { Router } from "express";
import { register, login, me } from "./auth.controller.js";
import { authMiddleware } from "./jwt.js";
import pool from "./db.js";

const r = Router();
r.post("/auth/register", register);
r.post("/auth/login", login);
r.get("/auth/me", authMiddleware, me);

// diag para chequear MySQL
r.get("/auth/diag", async (_req, res) => {
  try { const [rows] = await pool.query("SELECT 1 AS ok"); res.json({ db: "up", result: rows[0] }); }
  catch { res.status(500).json({ db: "down", error: "db_error" }); }
});

export default r;
