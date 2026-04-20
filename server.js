import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^(?:export\s+)?(\w+)\s*=\s*["']?([^"'\n]+)["']?/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const PORT = 3000;
const API_KEY = process.env.DOCSTRANGE_API_KEY;

if (!API_KEY) {
  console.error("DOCSTRANGE_API_KEY not set");
  process.exit(1);
}

http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  if (req.url === "/api/extract" && req.method === "POST") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const options = {
        hostname: "extraction-api.nanonets.com",
        path: "/api/v1/extract/sync",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": req.headers["content-type"],
          "Content-Length": body.length,
        },
      };
      const proxy = https.request(options, (upstream) => {
        const upChunks = [];
        upstream.on("data", (c) => upChunks.push(c));
        upstream.on("end", () => {
          res.writeHead(upstream.statusCode, { ...corsHeaders(), "Content-Type": "application/json" });
          res.end(Buffer.concat(upChunks));
        });
      });
      proxy.on("error", (err) => {
        res.writeHead(502, corsHeaders());
        res.end(JSON.stringify({ error: err.message }));
      });
      proxy.write(body);
      proxy.end();
    });
    return;
  }

  res.writeHead(404, corsHeaders());
  res.end(JSON.stringify({ error: "Not found" }));
}).listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
