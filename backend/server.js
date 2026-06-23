require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const scanRoutes = require("./routes/scan");
const flowsRoutes = require("./routes/flows");
const regressionRoutes = require("./routes/regression");
const { emitter } = require("./services/logEmitter");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const clients = new Set();

emitter.on("log", (payload) => {
  const line = `data: ${JSON.stringify({ type: "log", ...payload })}\n\n`;
  for (const res of clients) {
    try {
      res.write(line);
    } catch (_) {
      clients.delete(res);
    }
  }
});

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    process.env.FRONTEND_URL || "",
  ].filter(Boolean),
  credentials: true,
}));

app.post(
  "/api/webhook/github",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.WEBHOOK_SECRET;
      if (!secret) {
        return res.status(503).json({ error: "WEBHOOK_SECRET not configured" });
      }
      const sig = req.get("x-hub-signature-256") || "";
      const bodyBuf = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body || {}));
      const hmac = crypto
        .createHmac("sha256", secret)
        .update(bodyBuf)
        .digest("hex");
      const expected = `sha256=${hmac}`;
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: "Invalid signature" });
      }
      const event = JSON.parse(bodyBuf.toString("utf8"));
      const ref = event.ref || "";
      if (
        String(req.get("x-github-event")) === "push" &&
        (ref === "refs/heads/main" || ref === "refs/heads/master")
      ) {
        const defaultUrl = process.env.REGRESSION_BASE_URL || "";
        await regressionRoutes.runRegression({
          url: defaultUrl || undefined,
          includeUrlScan: Boolean(defaultUrl),
          includeFlows: true,
          triggeredBy: "code-push",
        });
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") res.flushHeaders();
  clients.add(res);
  req.on("close", () => clients.delete(res));
});

app.get("/api/health", (_req, res) => {
  console.log("GEMINI:", process.env.GEMINI_API_KEY ? "FOUND" : "MISSING");
  res.json({ ok: true, gemini: Boolean(process.env.GEMINI_API_KEY) });
});

app.use("/api/scan", scanRoutes);
app.use("/api/flows", flowsRoutes);
app.use("/api/regression", regressionRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

http.createServer(app).listen(port, () => {
  console.log(
    `QA Genie → http://localhost:${port}  (${dev ? "dev" : "production"})`,
  );
});
