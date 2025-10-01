import { pool } from "./index.js";

// POST "/" body: { proyecto_id, titulo }
export async function crearTarea(req, res) {
  try {
    const { proyecto_id, titulo } = req.body || {};
    if (!proyecto_id || !titulo) {
      return res.status(400).json({ error: "bad_request" });
    }
    const [r] = await pool.query(
      "INSERT INTO proyectos_db.tareas(proyecto_id,titulo,estado,asignado_a_usuario_id) VALUES(?,?, 'todo', NULL)",
      [proyecto_id, titulo]
    );
    res.status(201).json({ id: r.insertId, proyecto_id, titulo, estado: "todo" });
  } catch (e) {
    console.error("crearTarea error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// PATCH "/:id/estado" body: { estado: 'todo'|'doing'|'done' }
export async function cambiarEstado(req, res) {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body || {};
    if (!id || !["todo", "doing", "done"].includes(estado)) {
      return res.status(400).json({ error: "bad_request" });
    }
    await pool.query("UPDATE proyectos_db.tareas SET estado=? WHERE id=?", [estado, id]);
    res.json({ id, estado });
  } catch (e) {
    console.error("cambiarEstado error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}

// GET "/" query: ?proyecto_id=#
export async function listarPorProyecto(req, res) {
  try {
    const proyecto_id = Number(req.query.proyecto_id || 0);
    if (!proyecto_id) return res.status(400).json({ error: "bad_request" });
    const [rows] = await pool.query(
      "SELECT id, proyecto_id, titulo, estado, asignado_a_usuario_id, creado_en FROM proyectos_db.tareas WHERE proyecto_id=? ORDER BY id DESC",
      [proyecto_id]
    );
    res.json(rows);
  } catch (e) {
    console.error("listarPorProyecto error:", e);
    res.status(500).json({ error: "internal_error" });
  }
}
