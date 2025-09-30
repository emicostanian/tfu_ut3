import express from "express";
import routes from "./auth.routes.js";

const app = express();
app.use(express.json());
app.get("/health", (req, res) => res.json({ ok: true, service: process.env.SERVICE_NAME || "auth-api" }));
app.use(routes);

// handler global: evita que cualquier error termine en 502 del gateway
app.use((err, req, res, next) => {
  console.error("auth-api error:", err);
  res.status(500).json({ error: "internal_error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`auth-api on ${PORT}`));
