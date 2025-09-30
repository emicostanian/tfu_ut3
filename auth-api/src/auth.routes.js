import { Router } from "express";
import { register, login, me } from "./auth.controller.js";
import { authMiddleware } from "./jwt.js";

const r = Router();
r.post("/auth/register", register);
r.post("/auth/login", login);
r.get("/auth/me", authMiddleware, me);

export default r;
