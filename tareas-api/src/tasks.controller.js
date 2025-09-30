import pool from "./db.js";

export async function listTasks(req, res) {
  const { proyecto_id } = req.query;
  if (proyecto_id) {
    const [rows] = await pool.query(
      "SELECT * FROM proyectos_db.tareas WHERE proyecto_id=? ORDER BY id",
      [proyecto_id]
    );
    return res.json(rows);
  }
  const [rows] = await pool.query("SELECT * FROM proyectos_db.tareas ORDER BY id");
  res.json(rows);
}

export async function getTask(req, res) {
  const [rows] = await pool.query("SELECT * FROM proyectos_db.tareas WHERE id=?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(rows[0]);
}

export async function createTask(req, res) {
  const { proyecto_id, titulo, asignado_a_usuario_id = null } = req.body || {};
  if (!proyecto_id || !titulo) return res.status(400).json({ error: "bad_request" });

  const [p] = await pool.query("SELECT id FROM proyectos_db.proyectos WHERE id=?", [proyecto_id]);
  if (!p[0]) return res.status(422).json({ error: "invalid_project" });

  const [r] = await pool.query(
    "INSERT INTO proyectos_db.tareas(proyecto_id, titulo, asignado_a_usuario_id) VALUES(?,?,?)",
    [proyecto_id, titulo, asignado_a_usuario_id]
  );
  res.status(201).json({ id: r.insertId, proyecto_id, titulo, estado: "todo", asignado_a_usuario_id });
}

export async function updateTask(req, res) {
  const { titulo, asignado_a_usuario_id = null } = req.body || {};
  const [r] = await pool.query(
    "UPDATE proyectos_db.tareas SET titulo=?, asignado_a_usuario_id=? WHERE id=?",
    [titulo, asignado_a_usuario_id, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.json({ id: Number(req.params.id), titulo, asignado_a_usuario_id });
}

export async function patchTaskState(req, res) {
  const { estado } = req.body || {};
  if (!["todo", "doing", "done"].includes(estado)) return res.status(400).json({ error: "invalid_state" });
  const [r] = await pool.query("UPDATE proyectos_db.tareas SET estado=? WHERE id=?", [estado, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.json({ id: Number(req.params.id), estado });
}

export async function deleteTask(req, res) {
  const [r] = await pool.query("DELETE FROM proyectos_db.tareas WHERE id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: "not_found" });
  res.status(204).send();
}
