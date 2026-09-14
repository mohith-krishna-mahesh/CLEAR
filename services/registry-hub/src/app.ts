import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { onboardingRouter } from "./routes/onboarding.routes";
import { registryRouter } from "./routes/registry.routes";
import { transferRouter } from "./routes/transfer.routes";
import { governanceRouter } from "./routes/governance.routes";
import { auditRouter } from "./routes/audit.routes";

export const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "registry-hub",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/registry", registryRouter);
app.use("/api/transfer", transferRouter);
app.use("/api/governance", governanceRouter);
app.use("/api/audit", auditRouter);
