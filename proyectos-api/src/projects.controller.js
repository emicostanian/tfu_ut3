import pool from "./db.js";

export async function listProjects(req, res) {
  const [rows] = await pool.query("SELECT * FROM proyectos_db.proyectos ORDER BY id");
  res.json(rows);
}

export async function getProject(req, res) {
  const [rows] = await pool.query("SELECT * FROM proyectos_db.proyectos WHERE id=?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(rows[0]);
}

export async function createProject(req, res) {
  const { nombre, descripcion } = req.body || {};
  if (!nombre) return res.status(400).json({ error: "bad_request" });
  const owner = req.user?.sub;
  const [r] = await pool.query(
    "INSERT INTO proyectos_db.proyectos(nombre,descripcion,owner_usuario_id) VALUES(?,?,?)",
    [nombre, descripcion || null, owner]
  );
  res.status(201).json({ id: r.insertId, nombre, descripcion: descripcion || null, owner_usuario_id: owner });
}

export async function updateProject(req, res) {
  const { nombre, descripcion } = req.body || {};
  const [r] = await pool.query(
    "UPDATE proyectos_db.proyectos SET nombre=?, descripcion=? WHERE id=?",
    [nombre, descripcion || null, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.json({ id: Number(req.params.id), nombre, descripcion: descripcion || null });
}

export async function deleteProject(req, res) {
  const [r] = await pool.query("DELETE FROM proyectos_db.proyectos WHERE id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.status(204).send();
}
