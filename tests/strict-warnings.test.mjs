import test from 'node:test';
import assert from 'node:assert/strict';
import { runGarden } from '../dist/index.js';

test('strict warning policy marks warning reports as not ok', async () => {
  const report = await runGarden('fixtures/warn', { strictWarnings: true });
  assert.equal(report.ok, false);
  assert.equal(report.summary.warnings, 1);
});
