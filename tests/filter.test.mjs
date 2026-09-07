import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

test('filter ignores missing fixtures outside the selected scope', async () => {
  const root = filteredFixtureRoot();
  const report = await runGarden(root, { filter: 'selected' });

  assert.equal(report.ok, true);
  assert.equal(report.summary.gardens, 1);
  assert.deepEqual(report.results.map((result) => result.commandId), ['ok']);
  assert.equal(report.findings.some((finding) => finding.code === 'missing-fixture'), false);
});

test('filter still reports a missing fixture in the selected scope', async () => {
  const root = filteredFixtureRoot();
  const report = await runGarden(root, { filter: 'missing' });

  assert.equal(report.ok, false);
  assert.equal(report.summary.gardens, 1);
  assert.deepEqual(report.findings, [{
    level: 'error',
    code: 'missing-fixture',
    message: 'Fixture not found: absent',
    gardenId: 'missing',
    path: 'absent',
  }]);
});

function filteredFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-filter-'));
  fs.mkdirSync(path.join(root, 'present'));
  fs.writeFileSync(path.join(root, 'shellgarden.config.json'), JSON.stringify({
    version: 1,
    name: 'filter-fixture-scope',
    gardens: [
      { id: 'selected', fixture: 'present', commands: [{ id: 'ok', run: 'true' }] },
      { id: 'missing', fixture: 'absent', commands: [{ id: 'broken', run: 'true' }] },
    ],
  }));
  return root;
}
