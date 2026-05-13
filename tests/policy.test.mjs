import test from 'node:test';
import assert from 'node:assert/strict';
import { runGarden } from '../dist/index.js';

test('exit mismatches fail policy', async () => {
  const report = await runGarden('fixtures/fail');
  assert.equal(report.ok, false);
  assert.equal(report.summary.errors, 1);
  assert.equal(report.findings[0].code, 'exit-mismatch');
});

test('unsafe commands are blocked before execution', async () => {
  const report = await runGarden('fixtures/unsafe');
  assert.equal(report.ok, false);
  assert.equal(report.summary.skipped, 1);
  assert.equal(report.findings[0].code, 'unsafe-command');
});
