import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("role isBanned");
    if (!user || user.isBanned) {
      return next();
    }
    req.user = { id: user._id.toString(), role: user.role };
  } catch (err) {
    // ignore invalid token
  }
  next();
}
