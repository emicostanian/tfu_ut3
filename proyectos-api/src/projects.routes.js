import { Router } from "express";
import jwt from "jsonwebtoken";
import { listProjects, getProject, createProject, updateProject, deleteProject } from "./projects.controller.js";

const r = Router();
const secret = process.env.JWT_SECRET || "dev_secret";

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try { req.user = jwt.verify(token, secret); next(); }
  catch { return res.status(401).json({ error: "invalid_token" }); }
}

r.get("/proyectos/", auth, listProjects);
r.get("/proyectos/:id", auth, getProject);
r.post("/proyectos/", auth, createProject);
r.put("/proyectos/:id", auth, updateProject);
r.delete("/proyectos/:id", auth, deleteProject);

export default r;
