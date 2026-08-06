import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executeCommand } from '../dist/executor.js';
import { runGarden } from '../dist/index.js';

const MAX_CAPTURE_BYTES = 128 * 1024;
const TRUNCATION_MARKER = '\n<output truncated>';

function outputCommand(stream, expression, writes = 1) {
  return `${process.execPath} -e ${JSON.stringify(`for (let index = 0; index < ${writes}; index += 1) process.${stream}.write(${expression})`)}`;
}

test('executor reports elapsed monotonic time for a command that spans time', async () => {
  const transcript = await executeCommand(
    { id: 'delayed', run: `${process.execPath} -e "setTimeout(() => {}, 30)"` },
    { cwd: process.cwd(), workspaceRoot: process.cwd(), timeoutMs: 1000 },
  );

  assert.equal(transcript.exitCode, 0);
  assert.ok(transcript.durationMs > 0, `expected positive duration, got ${transcript.durationMs}`);
});

test('report retains timeout exit code and marker with a truthful duration', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shellgarden-timeout-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'fixture'));
  fs.writeFileSync(path.join(root, 'shellgarden.config.json'), JSON.stringify({
    version: 1,
    defaultTimeoutMs: 20,
    gardens: [{
      id: 'timeout',
      fixture: 'fixture',
      commands: [{ id: 'wait', run: `${process.execPath} -e "setTimeout(() => {}, 1000)"` }],
    }],
  }));

  const report = await runGarden(root);
  const transcript = report.results[0].transcript;

  assert.equal(transcript.exitCode, null);
  assert.match(transcript.stderr, /<timed out after 20ms>/);
  assert.ok(transcript.durationMs >= 20, `expected timeout duration of at least 20ms, got ${transcript.durationMs}`);
});

for (const stream of ['stdout', 'stderr']) {
  test(`executor caps oversized ASCII ${stream} with one truncation marker`, async () => {
    const transcript = await executeCommand(
      { id: `large-ascii-${stream}`, run: outputCommand(stream, `"a".repeat(${MAX_CAPTURE_BYTES + 1})`) },
      { cwd: process.cwd(), workspaceRoot: process.cwd(), timeoutMs: 1000 },
    );
    const output = transcript[stream];

    assert.equal(Buffer.byteLength(output, 'utf8'), MAX_CAPTURE_BYTES);
    assert.equal(output.match(/<output truncated>/g)?.length, 1);
    assert.ok(output.endsWith(TRUNCATION_MARKER));
  });

  test(`executor caps repeated multibyte ${stream} chunks without splitting a character`, async () => {
    const transcript = await executeCommand(
      {
        id: `large-multibyte-${stream}`,
        run: outputCommand(stream, '"😀".repeat(4096)', 20),
      },
      { cwd: process.cwd(), workspaceRoot: process.cwd(), timeoutMs: 1000 },
    );
    const output = transcript[stream];
    const content = output.slice(0, -TRUNCATION_MARKER.length);

    assert.ok(Buffer.byteLength(output, 'utf8') <= MAX_CAPTURE_BYTES);
    assert.equal(output.match(/<output truncated>/g)?.length, 1);
    assert.ok(output.endsWith(TRUNCATION_MARKER));
    assert.equal(content.includes('\uFFFD'), false);
    assert.match(content, /^(?:😀)+$/u);
  });
}
