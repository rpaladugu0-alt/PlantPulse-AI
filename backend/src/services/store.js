import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedMachines, seedWorkOrders } from "../data/seed.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.PLANTPULSE_STORE_FILE || path.resolve(directory, "../../data/plantpulse.runtime.json");

function initialState() {
  return { machines: seedMachines, workOrders: seedWorkOrders, feedback: [], lastUpdated: new Date().toISOString() };
}

function ensureStore() {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) atomicWrite(initialState());
}

function validState(value) {
  return Boolean(value) && Array.isArray(value.machines) && Array.isArray(value.workOrders) && Array.isArray(value.feedback);
}

function atomicWrite(state) {
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, file);
}

export function readStore() {
  ensureStore();
  try {
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!validState(state)) throw new Error("Invalid local store shape.");
    return state;
  } catch {
    const state = initialState();
    atomicWrite(state);
    return state;
  }
}

export function writeStore(state) {
  const next = { ...state, lastUpdated: new Date().toISOString() };
  if (!validState(next)) throw new Error("Refusing to write an invalid local store.");
  atomicWrite(next);
  return next;
}
