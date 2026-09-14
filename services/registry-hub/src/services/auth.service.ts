import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import { controlPlane, ensureControlPlane } from "../db/control-plane/client";
import { hashPassword, verifyPassword } from "../lib/password";

export interface AuthUser {
  userId: string;
  email?: string;
  role: string;
  registryId?: string;
  name?: string;
  jurisdiction?: string;
  signerAddress?: string;
  tier?: string;
}

function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      registryId: user.registryId,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export class AuthService {
  async login(params: {
    email?: string;
    password?: string;
    role?: string;
    registryId?: string;
  }): Promise<{ token: string; user: AuthUser }> {
    await ensureControlPlane();
    const email = params.email?.trim().toLowerCase();
    const password = params.password ?? "";

    if (
      params.role === "council" ||
      email === env.COUNCIL_EMAIL.toLowerCase()
    ) {
      if (email && email !== env.COUNCIL_EMAIL.toLowerCase()) {
        throw new Error("Invalid council credentials");
      }
      if (password && password !== env.COUNCIL_PASSWORD) {
        throw new Error("Invalid council credentials");
      }
      const user: AuthUser = {
        userId: "council-genesis",
        email: env.COUNCIL_EMAIL,
        role: "council",
        name: "CLEAR Secretariat Council",
        jurisdiction: "Global Secretariat",
      };
      return { token: signToken(user), user };
    }

    let dbUser = email
      ? await controlPlane.user.findUnique({ where: { email } })
      : null;

    if (!dbUser && params.registryId) {
      dbUser = await controlPlane.user.findFirst({
        where: { registryId: params.registryId, role: "registry" },
      });
    }

    if (!dbUser) {
      throw new Error("Invalid credentials");
    }
    if (!verifyPassword(password, dbUser.passwordHash)) {
      throw new Error("Invalid credentials");
    }

    const registry = await controlPlane.registry.findUnique({
      where: { id: dbUser.registryId },
    });
    const user: AuthUser = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      registryId: dbUser.registryId,
      name: registry?.name,
      jurisdiction: registry?.jurisdiction,
      signerAddress: registry?.signerAddress,
      tier: registry?.tier,
    };
    return { token: signToken(user), user };
  }

  async register(params: {
    email: string;
    password: string;
    registryId: string;
    role?: string;
  }): Promise<{ token: string; user: AuthUser }> {
    await ensureControlPlane();
    const email = params.email.trim().toLowerCase();
    const existing = await controlPlane.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }
    const created = await controlPlane.user.create({
      data: {
        id: randomUUID(),
        email,
        passwordHash: hashPassword(params.password),
        registryId: params.registryId,
        role: params.role ?? "registry",
      },
    });
    return this.login({ email: created.email, password: params.password });
  }
}
