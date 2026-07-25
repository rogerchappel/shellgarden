import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('public entry imports without output or exit-code side effects', async () => {
  const script = `
    const api = await import('./dist/index.js');
    const expected = ['explainGarden', 'listGarden', 'renderTranscript', 'runGarden'];
    if (JSON.stringify(Object.keys(api).sort()) !== JSON.stringify(expected)) {
      throw new Error('unexpected public exports');
    }
    if (process.exitCode !== undefined) {
      throw new Error('public import changed process.exitCode');
    }
  `;

  const { stdout, stderr } = await execFileAsync(process.execPath, ['--input-type=module', '--eval', script]);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});
