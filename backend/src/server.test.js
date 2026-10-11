import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { app } from "./server.js";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

test("serves dashboard data with security and no-cache headers", async () => {
  const { response, body } = await jsonRequest("/api/dashboard");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.machines));
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("accepts a valid analysis and rejects invalid ranges", async () => {
  const valid = await jsonRequest("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Pump", line: "A", health: 80, temperature: 75, vibration: 4.8, pressure: 130 })
  });
  assert.equal(valid.response.status, 201);
  assert.ok(valid.body.reasons.length > 0);

  const invalid = await jsonRequest("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Unsafe", line: "A", health: 101, temperature: 251, vibration: 51, pressure: 501 })
  });
  assert.equal(invalid.response.status, 400);
  assert.match(invalid.body.error, /health must be between/i);
});

test("returns controlled 400 errors for null and malformed JSON", async () => {
  const nullBody = await jsonRequest("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "null"
  });
  assert.equal(nullBody.response.status, 400);
  assert.match(nullBody.body.error, /invalid JSON/i);

  const malformed = await jsonRequest("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad"
  });
  assert.equal(malformed.response.status, 400);
  assert.match(malformed.body.error, /invalid JSON/i);
});

test("rejects invalid work-order priority and feedback machine", async () => {
  const order = await jsonRequest("/api/work-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ machineId: "M-101", title: "Inspect hydraulic press", priority: "urgent" })
  });
  assert.equal(order.response.status, 400);
  assert.match(order.body.error, /priority/i);

  const feedback = await jsonRequest("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: "helpful", machineId: "M-999" })
  });
  assert.equal(feedback.response.status, 400);
  assert.match(feedback.body.error, /machine/i);
});

test("blocks an unapproved development origin", async () => {
  const { response, body } = await jsonRequest("/api/health", { headers: { Origin: "https://evil.example" } });
  assert.equal(response.status, 403);
  assert.match(body.error, /origin/i);
});

test("returns JSON 404 for unknown API routes", async () => {
  const { response, body } = await jsonRequest("/api/not-real");
  assert.equal(response.status, 404);
  assert.match(body.error, /not found/i);
});
