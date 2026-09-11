import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

/**
 * Role-Based Access Control (RBAC) middleware factory.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      res.status(403).json({
        error: `Forbidden: requires one of roles [${allowedRoles.join(", ")}]`,
      });
      return;
    }
    next();
  };
}
