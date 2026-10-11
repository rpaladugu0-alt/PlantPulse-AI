import test from "node:test";
import assert from "node:assert/strict";
import { validateFeedback, validateReading, validateStatus, validateWorkOrder } from "./validation.js";

test("accepts a valid reading and converts numeric strings", () => {
  const result = validateReading({ name: " Pump 7 ", line: "Line A", health: "80", temperature: "72.5", vibration: "4.2", pressure: "130" });
  assert.equal(result.name, "Pump 7");
  assert.equal(result.temperature, 72.5);
});

test("rejects missing, infinite, and out-of-range reading values", () => {
  assert.throws(() => validateReading(null), /JSON object/i);
  assert.throws(() => validateReading({ name: "X", health: 50, temperature: "1e999", vibration: 2, pressure: 100 }), /valid number/i);
  assert.throws(() => validateReading({ name: "X", health: 101, temperature: 70, vibration: 2, pressure: 100 }), /between 0 and 100/i);
  assert.throws(() => validateReading({ name: "X", health: 50, temperature: 251, vibration: 2, pressure: 100 }), /between 0 and 250/i);
});

test("rejects non-text and overlong equipment names", () => {
  assert.throws(() => validateReading({ name: 42, health: 50, temperature: 70, vibration: 2, pressure: 100 }), /must be text/i);
  assert.throws(() => validateReading({ name: "x".repeat(61), health: 50, temperature: 70, vibration: 2, pressure: 100 }), /must not exceed 60/i);
});

test("validates work-order machine, description, and priority", () => {
  const ids = new Set(["M-101"]);
  assert.deepEqual(validateWorkOrder({ machineId: "M-101", title: "Inspect hydraulic press", priority: "high" }, ids), { machineId: "M-101", title: "Inspect hydraulic press", priority: "high" });
  assert.throws(() => validateWorkOrder({ machineId: "M-999", title: "Inspect machine", priority: "high" }, ids), /valid machine/i);
  assert.throws(() => validateWorkOrder({ machineId: "M-101", title: "Inspect machine", priority: "urgent" }, ids), /priority/i);
});

test("validates work-order status", () => {
  assert.equal(validateStatus({ status: "Completed" }), "Completed");
  assert.throws(() => validateStatus({ status: "Deleted" }), /status/i);
});

test("validates feedback rating and machine association", () => {
  const ids = new Set(["M-101"]);
  assert.deepEqual(validateFeedback({ rating: "helpful", machineId: "M-101" }, ids), { rating: "helpful", machineId: "M-101" });
  assert.deepEqual(validateFeedback({ rating: "not-helpful", machineId: "MANUAL" }, ids), { rating: "not-helpful", machineId: "MANUAL" });
  assert.throws(() => validateFeedback({ rating: "maybe", machineId: "M-101" }, ids), /feedback/i);
  assert.throws(() => validateFeedback({ rating: "helpful", machineId: "M-999" }, ids), /machine/i);
});
