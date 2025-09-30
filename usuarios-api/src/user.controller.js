import pool from "./db.js";

export async function listUsers(req, res) {
  const [rows] = await pool.query(
    "SELECT id, nombre, email, creado_en FROM usuarios_db.usuarios ORDER BY id"
  );
  res.json(rows);
}

export async function getUser(req, res) {
  console.log("GET /usuarios/:id", req.params.id);
  const [rows] = await pool.query(
    "SELECT id, nombre, email, creado_en FROM usuarios_db.usuarios WHERE id=?",
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(rows[0]);
}

export async function createUser(req, res) {
  const { nombre, email } = req.body || {};
  if (!nombre || !email) return res.status(400).json({ error: "bad_request" });
  try {
    const [r] = await pool.query(
      "INSERT INTO usuarios_db.usuarios(nombre,email,hash) VALUES(?,?,?)",
      [nombre, email, ""]
    );
    res.status(201).json({ id: r.insertId, nombre, email });
  } catch {
    res.status(409).json({ error: "email_exists" });
  }
}

export async function updateUser(req, res) {
  const { nombre, email } = req.body || {};
  const [r] = await pool.query(
    "UPDATE usuarios_db.usuarios SET nombre=?, email=? WHERE id=?",
    [nombre, email, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.json({ id: Number(req.params.id), nombre, email });
}

export async function deleteUser(req, res) {
  const [r] = await pool.query("DELETE FROM usuarios_db.usuarios WHERE id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.status(204).send();
}
