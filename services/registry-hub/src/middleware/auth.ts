import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthenticatedRequest extends Request {
  registryId?: string;
  role?: string;
  userId?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      registryId: string;
      role: string;
      userId: string;
    };
    req.registryId = payload.registryId;
    req.role = payload.role;
    req.userId = payload.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
