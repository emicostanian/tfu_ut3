import bcrypt from "bcryptjs";
export async function hashPassword(plain) { return await bcrypt.hash(plain, 10); }
export async function verifyPassword(plain, hash) { return await bcrypt.compare(plain, hash); }
