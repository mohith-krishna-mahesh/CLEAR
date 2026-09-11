import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("GET /health", () => {
  it("returns 200 and healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.service).toBe("registry-hub");
  });
});
