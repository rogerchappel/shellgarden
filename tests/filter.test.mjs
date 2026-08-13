import test from 'node:test';
import assert from 'node:assert/strict';
import { runGarden } from '../dist/index.js';

for (const [label, filter, expectedCommands] of [
  ['garden id', 'read-file', ['list-files', 'print-message']],
  ['command id', 'print-message', ['print-message']],
  ['garden/command key', 'read-file/print-message', ['print-message']],
]) {
  test(`filter runs commands selected by ${label}`, async () => {
    const report = await runGarden('fixtures/pass', { filter });
    assert.equal(report.ok, true);
    assert.deepEqual(report.results.map((result) => result.commandId), expectedCommands);
  });
}

test('unmatched filter fails instead of returning an empty successful report', async () => {
  const report = await runGarden('fixtures/pass', { filter: 'does-not-exist' });
  assert.equal(report.ok, false);
  assert.equal(report.summary.commands, 0);
  assert.deepEqual(report.findings, [{
    level: 'error',
    code: 'filter-no-match',
    message: 'filter matched no garden or command: does-not-exist',
  }]);
});
