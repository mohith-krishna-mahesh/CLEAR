import { Router } from "express";

export const authRouter = Router();

// TODO(P1): implement user login, register, and JWT signing
authRouter.post("/login", (req, res) => {
  res.status(501).json({ error: "Auth login: Not implemented" });
});

authRouter.post("/register", (req, res) => {
  res.status(501).json({ error: "Auth register: Not implemented" });
});
