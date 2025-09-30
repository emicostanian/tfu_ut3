import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "dev_secret";
const expiresIn = process.env.JWT_EXPIRES || "12h";

export function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function authMiddleware(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
