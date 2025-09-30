import express from "express";
import { createPool } from "mysql2/promise";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

import routes from "./projects.routes.js";
app.use(routes);

const pool = createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true, connectionLimit: 10
});

const secret = process.env.JWT_SECRET || "dev_secret";
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try { req.user = jwt.verify(token, secret); next(); }
  catch { return res.status(401).json({ error: "invalid_token" }); }
}

app.get("/health", (req,res)=> res.json({ ok:true, service: process.env.SERVICE_NAME || "proyectos-api" }));

app.get("/proyectos/", auth, async (req,res) => {
  const [rows] = await pool.query("SELECT * FROM proyectos_db.proyectos ORDER BY id");
  res.json(rows);
});

app.get("/proyectos/:id", auth, async (req,res) => {
  const [rows] = await pool.query("SELECT * FROM proyectos_db.proyectos WHERE id=?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error:"not_found" });
  res.json(rows[0]);
});

app.post("/proyectos/", auth, async (req,res) => {
  const { nombre, descripcion } = req.body || {};
  if (!nombre) return res.status(400).json({ error:"bad_request" });
  const owner = req.user?.sub;
  const [r] = await pool.query(
    "INSERT INTO proyectos_db.proyectos(nombre,descripcion,owner_usuario_id) VALUES(?,?,?)",
    [nombre, descripcion || null, owner]
  );
  res.status(201).json({ id: r.insertId, nombre, descripcion: descripcion || null, owner_usuario_id: owner });
});

app.put("/proyectos/:id", auth, async (req,res) => {
  const { nombre, descripcion } = req.body || {};
  const [r] = await pool.query("UPDATE proyectos_db.proyectos SET nombre=?, descripcion=? WHERE id=?", [nombre, descripcion || null, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error:"not_found" });
  res.json({ id: Number(req.params.id), nombre, descripcion: descripcion || null });
});

app.delete("/proyectos/:id", auth, async (req,res) => {
  const [r] = await pool.query("DELETE FROM proyectos_db.proyectos WHERE id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error:"not_found" });
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`proyectos-api on ${PORT}`));
