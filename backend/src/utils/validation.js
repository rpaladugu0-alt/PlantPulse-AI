const limits = {
  health: { min: 0, max: 100, label: "Health" },
  temperature: { min: 0, max: 250, label: "Temperature" },
  vibration: { min: 0, max: 50, label: "Vibration" },
  pressure: { min: 0, max: 500, label: "Pressure" }
};

export const allowedPriorities = ["low", "medium", "high"];
export const allowedStatuses = ["Open", "Scheduled", "In Progress", "Completed"];
export const allowedRatings = ["helpful", "not-helpful"];

export function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function cleanText(value, { required = false, min = 0, max = 60, label = "Value" } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new Error(`${label} is required.`);
    return "";
  }
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  const cleaned = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (required && cleaned.length < Math.max(1, min)) throw new Error(`${label} is required.`);
  if (cleaned.length < min) throw new Error(`${label} must contain at least ${min} characters.`);
  if (cleaned.length > max) throw new Error(`${label} must not exceed ${max} characters.`);
  return cleaned;
}

export function validateReading(body) {
  if (!isRecord(body)) throw new Error("The request body must be a JSON object.");
  const reading = {
    name: cleanText(body.name, { required: true, max: 60, label: "Equipment name" }),
    line: cleanText(body.line, { max: 60, label: "Production area" })
  };
  for (const [field, rule] of Object.entries(limits)) {
    const raw = body[field];
    const value = typeof raw === "number" ? raw : Number(raw);
    if (raw === "" || raw === null || raw === undefined || !Number.isFinite(value)) {
      throw new Error(`${rule.label} must be a valid number.`);
    }
    if (value < rule.min || value > rule.max) {
      throw new Error(`${rule.label} must be between ${rule.min} and ${rule.max}.`);
    }
    reading[field] = value;
  }
  return reading;
}

export function validateWorkOrder(body, machineIds) {
  if (!isRecord(body)) throw new Error("The request body must be a JSON object.");
  const machineId = cleanText(body.machineId, { required: true, max: 30, label: "Machine" });
  if (!machineIds.has(machineId)) throw new Error("Select a valid machine.");
  const title = cleanText(body.title, { required: true, min: 8, max: 160, label: "Work-order description" });
  const priority = body.priority ?? "medium";
  if (!allowedPriorities.includes(priority)) throw new Error("Invalid work-order priority.");
  return { machineId, title, priority };
}

export function validateStatus(body) {
  if (!isRecord(body) || !allowedStatuses.includes(body.status)) {
    throw new Error("Invalid work-order status.");
  }
  return body.status;
}

export function validateFeedback(body, machineIds) {
  if (!isRecord(body) || !allowedRatings.includes(body.rating)) throw new Error("Invalid feedback.");
  const machineId = body.machineId ?? null;
  if (machineId !== null && (!machineIds.has(machineId) && machineId !== "MANUAL")) {
    throw new Error("Invalid feedback machine.");
  }
  return { rating: body.rating, machineId };
}
