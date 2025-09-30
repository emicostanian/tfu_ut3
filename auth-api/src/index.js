import express from "express";
import { createPool } from "mysql2/promise";
import { signToken, authMiddleware } from "./jwt.js";
import { hashPassword, verifyPassword } from "./password.js";

const app = express();
app.use(express.json());

import routes from "./auth.routes.js";
app.use(routes);


const pool = createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true, connectionLimit: 10
});

app.get("/health", (req,res)=> res.json({ ok:true, service: process.env.SERVICE_NAME || "auth-api" }));

app.post("/auth/register", async (req,res) => {
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) return res.status(400).json({ error:"bad_request" });
  const hash = await hashPassword(password);
  try {
    const [r] = await pool.query(
      "INSERT INTO usuarios_db.usuarios(nombre,email,hash) VALUES(?,?,?)",
      [nombre, email, hash]
    );
    return res.status(201).json({ id: r.insertId, nombre, email });
  } catch (e) {
    return res.status(409).json({ error:"email_exists" });
  }
});

app.post("/auth/login", async (req,res) => {
  const { email, password } = req.body || {};
  const [rows] = await pool.query("SELECT id, nombre, email, hash FROM usuarios_db.usuarios WHERE email = ?", [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error:"invalid_credentials" });
  const ok = await verifyPassword(password, user.hash);
  if (!ok) return res.status(401).json({ error:"invalid_credentials" });
  const token = signToken({ sub: user.id, email: user.email, nombre: user.nombre });
  res.json({ token });
});

app.get("/auth/me", authMiddleware, async (req,res) => {
  res.json({ user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`auth-api on ${PORT}`));
