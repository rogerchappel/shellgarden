import test from 'node:test';
import assert from 'node:assert/strict';
import { runGarden } from '../dist/index.js';

test('filter runs a single command by id', async () => {
  const report = await runGarden('fixtures/pass', { filter: 'print-message' });
  assert.equal(report.ok, true);
  assert.equal(report.summary.commands, 1);
  assert.equal(report.results[0].commandId, 'print-message');
});
