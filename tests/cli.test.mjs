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

test('report rejects --update before it can recreate a transcript', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-report-read-only-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync('fixtures/pass', dir, { recursive: true });
  const transcript = path.join(dir, 'transcripts', 'read-file-print-message.txt');
  fs.rmSync(transcript);

  await assert.rejects(
    execFileAsync(process.execPath, ['dist/bin.js', 'report', dir, '--update', '--format', 'json']),
    (error) => error.code === 2
      && error.stderr.includes('report does not support --update')
      && error.stderr.includes('Supported options: --format')
      && error.stdout === ''
  );
  assert.equal(fs.existsSync(transcript), false);
});

for (const [command, option] of [
  ['init', '--format=json'],
  ['check', '--execute'],
  ['report', '--dry-run'],
  ['run', '--update'],
  ['explain', '--strict-warnings'],
  ['list', '--filter=print-message'],
]) {
  test(`cli rejects ${option} for ${command}`, async () => {
    await assert.rejects(
      execFileAsync(process.execPath, ['dist/bin.js', command, 'fixtures/pass', option]),
      (error) => error.code === 2
        && error.stderr.includes(`${command} does not support ${option.split('=')[0]}`)
        && error.stdout === ''
    );
  });
}

test('check --update still creates missing transcripts', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-check-update-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync('fixtures/pass', dir, { recursive: true });
  const transcript = path.join(dir, 'transcripts', 'read-file-print-message.txt');
  fs.rmSync(transcript);

  await execFileAsync(process.execPath, ['dist/bin.js', 'check', dir, '--update']);
  assert.match(fs.readFileSync(transcript, 'utf8'), /hello from the garden/);
});

test('run preserves dry-run and explicit execution semantics', async () => {
  const dryRun = await execFileAsync(process.execPath, ['dist/bin.js', 'run', 'fixtures/pass', '--format', 'json']);
  const execute = await execFileAsync(process.execPath, ['dist/bin.js', 'run', 'fixtures/pass', '--execute', '--format', 'json']);

  assert.equal(JSON.parse(dryRun.stdout).summary.skipped, 2);
  assert.equal(JSON.parse(execute.stdout).summary.skipped, 0);
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
