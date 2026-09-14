import { Router } from "express";
import { AuthService } from "../services/auth.service";

export const authRouter = Router();
const auth = new AuthService();

authRouter.post("/login", async (req, res) => {
  try {
    const result = await auth.login(req.body ?? {});
    res.status(200).json(result);
  } catch (err) {
    res
      .status(401)
      .json({ error: err instanceof Error ? err.message : "Login failed" });
  }
});

authRouter.post("/register", async (req, res) => {
  const { email, password, registryId, role } = req.body ?? {};
  if (!email || !password || !registryId) {
    res
      .status(400)
      .json({ error: "email, password, and registryId are required" });
    return;
  }
  try {
    const result = await auth.register({
      email: String(email),
      password: String(password),
      registryId: String(registryId),
      role: role ? String(role) : undefined,
    });
    res.status(201).json(result);
  } catch (err) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Register failed" });
  }
});
