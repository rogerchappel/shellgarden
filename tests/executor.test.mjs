import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executeCommand } from '../dist/executor.js';
import { runGarden } from '../dist/index.js';

test('executor reports elapsed monotonic time for a command that spans time', async () => {
  const transcript = await executeCommand(
    { id: 'delayed', run: `${process.execPath} -e "setTimeout(() => {}, 30)"` },
    { cwd: process.cwd(), workspaceRoot: process.cwd(), timeoutMs: 1000 },
  );

  assert.equal(transcript.exitCode, 0);
  assert.ok(transcript.durationMs > 0, `expected positive duration, got ${transcript.durationMs}`);
});

test('report retains timeout exit code and marker with a truthful duration', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-timeout-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'fixture'));
  fs.writeFileSync(path.join(root, 'shellgarden.config.json'), JSON.stringify({
    version: 1,
    defaultTimeoutMs: 20,
    gardens: [{
      id: 'timeout',
      fixture: 'fixture',
      commands: [{ id: 'wait', run: `${process.execPath} -e "setTimeout(() => {}, 1000)"` }],
    }],
  }));

  const report = await runGarden(root);
  const transcript = report.results[0].transcript;

  assert.equal(transcript.exitCode, null);
  assert.match(transcript.stderr, /<timed out after 20ms>/);
  assert.ok(transcript.durationMs >= 20, `expected timeout duration of at least 20ms, got ${transcript.durationMs}`);
});
