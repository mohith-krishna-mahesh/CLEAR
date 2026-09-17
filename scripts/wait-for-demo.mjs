#!/usr/bin/env node
import net from "node:net";
import process from "node:process";

const [kind, target, timeoutArg = "120000"] = process.argv.slice(2);
const timeoutMs = Number(timeoutArg);
const startedAt = Date.now();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTcp(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(port) });
    socket.setTimeout(2500);
    socket.on("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.on("error", reject);
  });
}

async function waitForHttp(url) {
  const response = await fetch(url, { method: "GET" });
  if (response.status >= 500) {
    throw new Error(`HTTP ${response.status}`);
  }
}

async function waitForRpc(url) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body = await response.json();
  if (!body.result) {
    throw new Error("RPC result missing");
  }
}

async function check() {
  if (kind === "tcp") {
    const [host, port] = target.split(":");
    await waitForTcp(host, port);
    return;
  }
  if (kind === "http") {
    await waitForHttp(target);
    return;
  }
  if (kind === "rpc") {
    await waitForRpc(target);
    return;
  }
  throw new Error("Usage: wait-for-demo.mjs <tcp|http|rpc> <target> [timeoutMs]");
}

let lastError = null;
while (Date.now() - startedAt < timeoutMs) {
  try {
    await check();
    console.log(`[wait] ${kind} ${target} is ready`);
    process.exit(0);
  } catch (err) {
    lastError = err;
    await sleep(2000);
  }
}

console.error(
  `[wait] Timed out waiting for ${kind} ${target}: ${lastError?.message ?? "not ready"}`,
);
process.exit(1);
