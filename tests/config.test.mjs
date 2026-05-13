import test from 'node:test';
import assert from 'node:assert/strict';
import { runGarden } from '../dist/index.js';

test('passing garden produces deterministic clean report', async () => {
  const report = await runGarden('fixtures/pass');
  assert.equal(report.ok, true);
  assert.equal(report.summary.commands, 2);
  assert.equal(report.summary.findings, 0);
  assert.equal(report.checkedAt, '1970-01-01T00:00:00.000Z');
});

test('missing transcript is a warning but not a failure', async () => {
  const report = await runGarden('fixtures/warn');
  assert.equal(report.ok, true);
  assert.equal(report.summary.warnings, 1);
  assert.equal(report.findings[0].code, 'missing-transcript');
});
