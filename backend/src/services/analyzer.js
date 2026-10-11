const thresholds = {
  temperature: { warning: 70, critical: 85 },
  vibration: { warning: 4.5, critical: 7.0 },
  pressure: { warning: 135, critical: 150 }
};

function severity(value, limits) {
  if (value >= limits.critical) return "critical";
  if (value >= limits.warning) return "warning";
  return "normal";
}

export function analyzeMachine(machine) {
  const signals = [
    { label: "Temperature", value: machine.temperature, unit: "°C", level: severity(machine.temperature, thresholds.temperature) },
    { label: "Vibration", value: machine.vibration, unit: "mm/s", level: severity(machine.vibration, thresholds.vibration) },
    { label: "Pressure", value: machine.pressure, unit: "psi", level: severity(machine.pressure, thresholds.pressure) }
  ];
  const critical = signals.filter((s) => s.level === "critical");
  const warnings = signals.filter((s) => s.level === "warning");
  const trendDrop = machine.history[0] - machine.history.at(-1);
  const riskScore = Math.min(99, Math.max(5,
    Math.round((100 - machine.health) * 0.62 + critical.length * 18 + warnings.length * 9 + trendDrop * 0.8)
  ));
  const risk = riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low";
  const reasons = signals.filter((s) => s.level !== "normal").map((s) => `${s.label} is ${s.level} at ${s.value}${s.unit}`);
  if (trendDrop >= 10) reasons.push(`Health declined ${trendDrop} points across the latest readings`);
  if (!reasons.length) reasons.push("All monitored signals remain within configured operating ranges");
  const recommendation = risk === "High"
    ? "Pause nonessential operation and schedule an inspection within 24 hours. A technician must confirm the diagnosis."
    : risk === "Medium"
      ? "Schedule inspection during the next maintenance window and continue monitoring the flagged signals."
      : "Continue normal operation and follow the preventive-maintenance schedule.";
  return { machine, risk, riskScore, confidence: risk === "High" ? 91 : risk === "Medium" ? 84 : 88, signals, reasons, recommendation, disclaimer: "AI-assisted recommendation only. A qualified technician must verify the condition before maintenance or shutdown decisions." };
}

export function analyzeCustomReading(input) {
  const machine = {
    id: "MANUAL", name: input.name.trim(), line: input.line.trim() || "Manual entry", type: "Other",
    status: "unknown", health: Number(input.health), temperature: Number(input.temperature),
    vibration: Number(input.vibration), pressure: Number(input.pressure), lastService: "Not provided",
    runtimeHours: 0, history: [Math.min(100, Number(input.health) + 8), Number(input.health)]
  };
  return analyzeMachine(machine);
}
