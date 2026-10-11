import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCustomReading, analyzeMachine } from "./analyzer.js";

test("flags critical temperature and vibration as high risk", () => {
  const result = analyzeCustomReading({ name: "Test Press", line: "A", health: 35, temperature: 92, vibration: 8.5, pressure: 140 });
  assert.equal(result.risk, "High");
  assert.ok(result.riskScore >= 70);
  assert.match(result.recommendation, /inspection within 24 hours/i);
});

test("keeps healthy readings at low risk", () => {
  const result = analyzeCustomReading({ name: "Test Pump", line: "B", health: 95, temperature: 50, vibration: 2, pressure: 115 });
  assert.equal(result.risk, "Low");
  assert.ok(result.signals.every((signal) => signal.level === "normal"));
});

test("returns evidence and a human-review disclaimer", () => {
  const result = analyzeMachine({ id: "X", name: "Motor", line: "C", health: 68, temperature: 76, vibration: 5.4, pressure: 120, history: [80, 68] });
  assert.ok(result.reasons.length > 0);
  assert.match(result.disclaimer, /qualified technician/i);
});
