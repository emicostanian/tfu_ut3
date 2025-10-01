import express from "express";
import { createPool } from "mysql2/promise";
import tareasRoutes from "./tareas.routes.js";

const app = express();
app.use(express.json());

// DB pool
export const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,        // proyectos_db
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

app.get("/health", (req, res) =>
  res.json({ ok: true, service: process.env.SERVICE_NAME || "tareas-api" })
);

// Diag simple de DB
app.get("/diag", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ db: "up", result: rows[0] });
  } catch (e) {
    res.status(500).json({ db: "down", error: String(e?.message || e) });
  }
});

// Rutas de negocio en **raíz**
app.use("/", tareasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`tareas-api on ${PORT}`));
