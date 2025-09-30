import { signToken } from "./jwt.js";
import { hashPassword, verifyPassword } from "./password.js";
import pool from "./db.js";

export async function register(req, res) {
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "bad_request" });
  }
  const hash = await hashPassword(password);
  try {
    const [r] = await pool.query(
      "INSERT INTO usuarios_db.usuarios(nombre,email,hash) VALUES(?,?,?)",
      [nombre, email, hash]
    );
    return res.status(201).json({ id: r.insertId, nombre, email });
  } catch (e) {
    return res.status(409).json({ error: "email_exists" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "bad_request" });
    }

    // Buscar usuario por email
    const [rows] = await pool.query(
      "SELECT id, nombre, email, hash FROM usuarios_db.usuarios WHERE email = ?",
      [email]
    );
    const user = rows?.[0];
    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Si el usuario tiene hash vacío/incorrecto (p.ej. creado desde otra API sin password)
    if (!user.hash || user.hash.length < 20) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Comparación segura (si bcrypt falla, tratamos como credenciales inválidas)
    let ok = false;
    try {
      ok = await verifyPassword(password, user.hash);
    } catch {
      ok = false;
    }
    if (!ok) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // OK -> emitir token
    const token = signToken({ sub: user.id, email: user.email, nombre: user.nombre });
    return res.json({ token });
  } catch (e) {
    console.error("auth/login error:", e);
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
