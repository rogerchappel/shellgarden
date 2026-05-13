import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { listGarden } from '../dist/index.js';

const execFileAsync = promisify(execFile);

test('list command returns deterministic command inventory', () => {
  const inventory = listGarden('fixtures/pass');
  assert.equal(inventory.split('\n').length, 2);
  assert.match(inventory, /read-file\/print-message/);
});

test('init creates a runnable garden', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-init-'));
  const target = path.join(dir, 'demo');
  await execFileAsync(process.execPath, ['dist/index.js', 'init', target]);
  assert.equal(fs.existsSync(path.join(target, 'shellgarden.config.json')), true);
  await execFileAsync(process.execPath, ['dist/index.js', 'check', target, '--update']);
  await execFileAsync(process.execPath, ['dist/index.js', 'check', target]);
});
