import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('cli emits json reports', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['dist/index.js', 'report', 'fixtures/pass', '--format', 'json']);
  const report = JSON.parse(stdout);
  assert.equal(report.ok, true);
  assert.equal(report.summary.commands, 2);
});

test('cli returns exit code 1 for failing fixtures', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, ['dist/index.js', 'check', 'fixtures/fail']),
    (error) => error.code === 1 && error.stdout.includes('exit-mismatch')
  );
});
