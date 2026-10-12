import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedMachines } from '../data/seed.js';

const temporary = mkdtempSync(path.join(tmpdir(), 'plantpulse-order-test-'));
const storeFile = path.join(temporary, 'store.json');
let server, base;
const title = 'Inspect Hydraulic Press 4 based on AI-assisted condition alert';
function reset(orders = []) {
  writeFileSync(storeFile, JSON.stringify({ machines: seedMachines, workOrders: orders, feedback: [] }));
}
const payload = (task = title, machineId = 'M-101') => ({ machineId, title: task, priority: 'high' });
async function post(body) {
  const response = await fetch(base + '/api/work-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
async function orders() { return (await (await fetch(base + '/api/dashboard')).json()).workOrders; }
before(async () => {
  reset();
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
    env: { ...process.env, PORT: String(port), PLANTPULSE_STORE_FILE: storeFile }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  server.stderr.on('data', data => { logs += data; });
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
    if (server.exitCode !== null) throw new Error(logs || 'Server stopped');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Test server did not start');
});
after(async () => {
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill(); await stopped;
  }
  rmSync(temporary, { recursive: true, force: true });
});

test('a repeated create returns the existing order without adding another', async () => {
  reset(); const first = await post(payload()); const second = await post(payload());
  assert.equal(first.status, 201); assert.equal(second.status, 409);
  assert.equal(second.body.code, 'DUPLICATE_ACTIVE_ORDER');
  assert.equal(second.body.existingOrderId, first.body.id);
  assert.equal((await orders()).length, 1);
});
test('six simultaneous identical requests create exactly one order', async () => {
  reset(); const results = await Promise.all(Array.from({ length: 6 }, () => post(payload())));
  assert.equal(results.filter(x => x.status === 201).length, 1);
  assert.equal(results.filter(x => x.status === 409).length, 5);
  assert.equal((await orders()).length, 1);
});
test('Scheduled and In Progress orders continue to prevent duplicate tasks', async () => {
  for (const status of ['Scheduled', 'In Progress']) {
    reset([{ id: 'WO-1052', ...payload(), status }]);
    assert.equal((await post(payload())).status, 409);
    assert.equal((await orders()).length, 1);
  }
});
test('a completed task permits a new follow-up order with a unique ID', async () => {
  reset([{ id: 'WO-1053', ...payload(), status: 'Completed' }]);
  const result = await post(payload());
  assert.equal(result.status, 201); assert.equal(result.body.id, 'WO-1054');
  assert.equal((await orders()).length, 2);
});
test('different maintenance tasks on the same equipment remain allowed', async () => {
  reset(); await post(payload());
  assert.equal((await post(payload('Replace damaged hydraulic seals'))).status, 201);
  assert.equal((await orders()).length, 2);
});
test('the same description for different equipment remains allowed', async () => {
  reset(); await post(payload());
  assert.equal((await post(payload(title, 'M-204'))).status, 201);
  assert.equal((await orders()).length, 2);
});
test('case and repeated spaces cannot bypass duplicate detection', async () => {
  reset(); await post(payload());
  assert.equal((await post(payload('  INSPECT  Hydraulic Press 4 based on AI-assisted condition alert  '))).status, 409);
  assert.equal((await orders()).length, 1);
});
