import { Router } from "express";
import { register, login, me, diag } from "./auth.controller.js";
import { authMiddleware } from "./jwt.js";
const r = Router();

r.get("/health", (req,res)=> res.json({ ok:true, service: process.env.SERVICE_NAME || "auth-api" }));
r.get("/auth/health", (req,res)=> res.json({ ok:true, service: process.env.SERVICE_NAME || "auth-api" }));

r.get("/auth/diag", diag);
r.get("/diag", diag);

r.post("/auth/register", register);
r.post("/register", register);

r.post("/auth/login", login);
r.post("/login", login);

r.get("/auth/me", authMiddleware, me);
r.get("/me",      authMiddleware, me);

export default r;
