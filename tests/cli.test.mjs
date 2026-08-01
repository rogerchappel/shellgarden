import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

test('cli emits json reports', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['dist/bin.js', 'report', 'fixtures/pass', '--format', 'json']);
  const report = JSON.parse(stdout);
  assert.equal(report.ok, true);
  assert.equal(report.summary.commands, 2);
});

test('cli returns exit code 1 for failing fixtures', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, ['dist/bin.js', 'check', 'fixtures/fail']),
    (error) => error.code === 1 && error.stdout.includes('exit-mismatch')
  );
});

test('cli reports invalid config with exit code 2', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-invalid-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'shellgarden.config.json'), JSON.stringify({
    version: 1,
    gardens: [],
  }));

  await assert.rejects(
    execFileAsync(process.execPath, ['dist/bin.js', 'check', dir]),
    (error) => error.code === 2 && error.stderr.includes('Config gardens must contain at least one garden')
  );
});

for (const args of [
  ['check', 'fixtures/pass', '--filter'],
  ['check', 'fixtures/pass', '--filter='],
]) {
  test(`cli rejects an empty filter value: ${args.join(' ')}`, async () => {
    await assert.rejects(
      execFileAsync(process.execPath, ['dist/bin.js', ...args]),
      (error) => error.code === 2
        && error.stderr.includes('--filter requires a non-empty value')
        && !error.stdout.includes('ShellGarden passed')
    );
  });
}

for (const args of [
  ['report', 'fixtures/pass', '--format'],
  ['report', 'fixtures/pass', '--format='],
]) {
  test(`cli rejects an empty format value: ${args.join(' ')}`, async () => {
    await assert.rejects(
      execFileAsync(process.execPath, ['dist/bin.js', ...args]),
      (error) => error.code === 2
        && error.stderr.includes('--format requires a non-empty value')
        && error.stdout === ''
    );
  });
}

test('cli rejects surplus positional arguments', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, ['dist/bin.js', 'check', 'fixtures/pass', 'extra-target']),
    (error) => error.code === 2
      && error.stderr.includes('Unexpected argument: extra-target')
      && !error.stdout.includes('ShellGarden passed')
  );
});
