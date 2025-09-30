import express from "express";
import { createPool } from "mysql2/promise";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

import routes from "./tasks.routes.js";
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

app.get("/health", (req,res)=> res.json({ ok:true, service: process.env.SERVICE_NAME || "tareas-api" }));

app.get("/tareas/", auth, async (req,res) => {
  const { proyecto_id } = req.query;
  if (proyecto_id) {
    const [rows] = await pool.query("SELECT * FROM proyectos_db.tareas WHERE proyecto_id=? ORDER BY id", [proyecto_id]);
    return res.json(rows);
  }
  const [rows] = await pool.query("SELECT * FROM proyectos_db.tareas ORDER BY id");
  res.json(rows);
});

app.get("/tareas/:id", auth, async (req,res) => {
  const [rows] = await pool.query("SELECT * FROM proyectos_db.tareas WHERE id=?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error:"not_found" });
  res.json(rows[0]);
});

app.post("/tareas/", auth, async (req,res) => {
  const { proyecto_id, titulo, asignado_a_usuario_id = null } = req.body || {};
  if (!proyecto_id || !titulo) return res.status(400).json({ error:"bad_request" });
  // Verifica que exista el proyecto
  const [p] = await pool.query("SELECT id FROM proyectos_db.proyectos WHERE id=?", [proyecto_id]);
  if (!p[0]) return res.status(422).json({ error:"invalid_project" });

  const [r] = await pool.query(
    "INSERT INTO proyectos_db.tareas(proyecto_id, titulo, asignado_a_usuario_id) VALUES(?,?,?)",
    [proyecto_id, titulo, asignado_a_usuario_id]
  );
  res.status(201).json({ id: r.insertId, proyecto_id, titulo, estado: "todo", asignado_a_usuario_id });
});

app.put("/tareas/:id", auth, async (req,res) => {
  const { titulo, asignado_a_usuario_id = null } = req.body || {};
  const [r] = await pool.query("UPDATE proyectos_db.tareas SET titulo=?, asignado_a_usuario_id=? WHERE id=?", [titulo, asignado_a_usuario_id, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error:"not_found" });
  res.json({ id: Number(req.params.id), titulo, asignado_a_usuario_id });
});

app.patch("/tareas/:id/estado", auth, async (req,res) => {
  const { estado } = req.body || {};
  if (!["todo","doing","done"].includes(estado)) return res.status(400).json({ error:"invalid_state" });
  const [r] = await pool.query("UPDATE proyectos_db.tareas SET estado=? WHERE id=?", [estado, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error:"not_found" });
  res.json({ id: Number(req.params.id), estado });
});

app.delete("/tareas/:id", auth, async (req,res) => {
  const [r] = await pool.query("DELETE FROM proyectos_db.tareas WHERE id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error:"not_found" });
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`tareas-api on ${PORT}`));
