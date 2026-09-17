import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const port = Number(process.env.EXPLORER_PORT ?? 4000);
const rpcUrl = process.env.EXPLORER_RPC_URL ?? "http://localhost:8545";
const blockscoutApiUrl =
  process.env.EXPLORER_BLOCKSCOUT_API_URL ?? "http://localhost:4001";
const explorerIndex = join(
  root,
  "infra",
  "blockscout",
  "explorer",
  "index.html",
);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function proxy(req, res, targetBase, stripPrefix = "") {
  const body = await readBody(req);
  const upstreamPath = stripPrefix
    ? req.url.replace(new RegExp(`^${stripPrefix}`), "")
    : req.url;
  const target = new URL(upstreamPath || "/", targetBase);

  const response = await fetch(target, {
    method: req.method,
    headers: {
      "content-type": req.headers["content-type"] ?? "application/json",
    },
    body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : body,
  });

  const responseBody = Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, {
    "content-type":
      response.headers.get("content-type") ?? "application/octet-stream",
    "access-control-allow-origin": "*",
  });
  res.end(responseBody);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }

    if (req.url === "/rpc") {
      await proxy(req, res, rpcUrl, "/rpc");
      return;
    }

    if (req.url?.startsWith("/api")) {
      await proxy(req, res, blockscoutApiUrl);
      return;
    }

    const body = await readFile(explorerIndex);
    res.writeHead(200, {
      "content-type": contentTypes[extname(explorerIndex)] ?? "text/plain",
    });
    res.end(body);
  } catch (error) {
    res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Explorer proxy failed",
      }),
    );
  }
});

server.listen(port, () => {
  console.log(`[explorer] CLEAR local explorer listening on http://localhost:${port}`);
});
