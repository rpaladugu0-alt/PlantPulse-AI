import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeCustomReading, analyzeMachine } from "./services/analyzer.js";
import { readStore, writeStore } from "./services/store.js";
import { findDuplicateActiveOrder, nextWorkOrderId } from "./services/workOrders.js";
import { validateFeedback, validateReading, validateStatus, validateWorkOrder } from "./utils/validation.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const production = process.env.NODE_ENV === "production";
const developmentOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);
const writeWindows = new Map();

app.disable("x-powered-by");
if (!production) {
  app.use(cors({
    origin(origin, callback) {
      if (!origin || developmentOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed."));
    }
  }));
}
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
  });
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function limitWrites(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const existing = writeWindows.get(key);
  const window = existing && now - existing.startedAt < 60_000 ? existing : { startedAt: now, count: 0 };
  window.count += 1;
  writeWindows.set(key, window);
  if (window.count > 60) return res.status(429).json({ error: "Too many changes were submitted. Please wait one minute and try again." });
  next();
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "PlantPulse AI", timestamp: new Date().toISOString() }));
app.get("/api/dashboard", (_req, res) => {
  const store = readStore();
  const analyses = store.machines.map(analyzeMachine);
  const summary = {
    total: analyses.length,
    healthy: analyses.filter((a) => a.risk === "Low").length,
    warnings: analyses.filter((a) => a.risk === "Medium").length,
    critical: analyses.filter((a) => a.risk === "High").length,
    openOrders: store.workOrders.filter((w) => w.status !== "Completed").length
  };
  res.json({ ...store, analyses, summary });
});

app.get("/api/machines/:id/analysis", (req, res) => {
  const machine = readStore().machines.find((item) => item.id === req.params.id);
  if (!machine) return res.status(404).json({ error: "Machine not found." });
  res.json(analyzeMachine(machine));
});

app.post("/api/analyze", limitWrites, (req, res) => {
  try {
    res.status(201).json(analyzeCustomReading(validateReading(req.body)));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/work-orders", limitWrites, (req, res) => {
  const store = readStore();
  try {
    const { machineId, title, priority } = validateWorkOrder(req.body, new Set(store.machines.map((machine) => machine.id)));
    const duplicate = findDuplicateActiveOrder(store.workOrders, machineId, title);
    if (duplicate) return res.status(409).json({
      code: "DUPLICATE_ACTIVE_ORDER",
      error: `An active order already exists for this equipment and task (${duplicate.id}). Review it in Work Orders.`,
      existingOrderId: duplicate.id
    });
    const order = { id: nextWorkOrderId(store.workOrders), machineId, title, priority, status: "Open", assignee: "Unassigned", createdAt: new Date().toISOString() };
    store.workOrders.unshift(order);
    writeStore(store);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/work-orders/:id", limitWrites, (req, res) => {
  let status;
  try {
    status = validateStatus(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const store = readStore();
  const order = store.workOrders.find((w) => w.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Work order not found." });
  order.status = status;
  writeStore(store);
  res.json(order);
});

app.post("/api/feedback", limitWrites, (req, res) => {
  const store = readStore();
  try {
    const feedback = validateFeedback(req.body, new Set(store.machines.map((machine) => machine.id)));
    store.feedback.push({ ...feedback, createdAt: new Date().toISOString() });
    writeStore(store);
    res.status(201).json({ message: "Feedback saved." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const frontendDist = path.resolve(currentDir, "../../frontend/dist");
app.use(express.static(frontendDist));
app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.get("*", (req, res, next) => req.path.startsWith("/api/") ? next() : res.sendFile(path.join(frontendDist, "index.html")));
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ error: "The request contains invalid JSON." });
  if (err.message === "Origin not allowed.") return res.status(403).json({ error: "Origin not allowed." });
  console.error(err);
  res.status(500).json({ error: "PlantPulse could not complete the request. Please try again." });
});

export function startServer(listenPort = port) {
  return app.listen(listenPort, "0.0.0.0", () => console.log(`PlantPulse API running at http://localhost:${listenPort}`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) startServer();

export { app };
