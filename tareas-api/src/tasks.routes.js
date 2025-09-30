import { Router } from "express";
import jwt from "jsonwebtoken";
import { listTasks, getTask, createTask, updateTask, patchTaskState, deleteTask } from "./tasks.controller.js";

const r = Router();
const secret = process.env.JWT_SECRET || "dev_secret";

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try { req.user = jwt.verify(token, secret); next(); }
  catch { return res.status(401).json({ error: "invalid_token" }); }
}

r.get("/tareas/", auth, listTasks);
r.get("/tareas/:id", auth, getTask);
r.post("/tareas/", auth, createTask);
r.put("/tareas/:id", auth, updateTask);
r.patch("/tareas/:id/estado", auth, patchTaskState);
r.delete("/tareas/:id", auth, deleteTask);

export default r;
