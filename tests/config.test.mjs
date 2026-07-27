import test from 'node:test';
import assert from 'node:assert/strict';
import { runGarden } from '../dist/index.js';
import { validateConfig } from '../dist/config.js';

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

const validConfig = {
  version: 1,
  gardens: [{
    id: 'example',
    fixture: 'fixtures/pass',
    commands: [{ id: 'hello', run: 'printf hello' }],
  }],
};

test('runtime validation accepts a valid config', () => {
  const validated = validateConfig(validConfig);
  assert.equal(validated.gardens[0].id, 'example');
  assert.equal(validated.gardens[0].commands[0].id, 'hello');
});

for (const [name, config, message] of [
  ['top-level properties', { ...validConfig, unknown: true }, 'Config has unknown property "unknown"'],
  ['garden properties', { ...validConfig, gardens: [{ ...validConfig.gardens[0], unknown: true }] }, 'gardens[0] has unknown property "unknown"'],
  ['command properties', { ...validConfig, gardens: [{ ...validConfig.gardens[0], commands: [{ ...validConfig.gardens[0].commands[0], unknown: true }] }] }, 'gardens[0].commands[0] has unknown property "unknown"'],
]) {
  test(`runtime validation rejects unknown ${name}`, () => {
    assert.throws(() => validateConfig(config), { message });
  });
}

test('runtime validation rejects an empty garden list', () => {
  assert.throws(() => validateConfig({ version: 1, gardens: [] }), {
    message: 'Config gardens must contain at least one garden',
  });
});

test('runtime validation rejects an empty command list', () => {
  assert.throws(() => validateConfig({ ...validConfig, gardens: [{ ...validConfig.gardens[0], commands: [] }] }), {
    message: 'Garden example commands must contain at least one command',
  });
});

test('runtime validation rejects duplicate garden ids', () => {
  assert.throws(() => validateConfig({ ...validConfig, gardens: [validConfig.gardens[0], validConfig.gardens[0]] }), {
    message: 'Duplicate garden id "example" at gardens[1].id',
  });
});

test('runtime validation rejects duplicate command ids within a garden', () => {
  const command = validConfig.gardens[0].commands[0];
  assert.throws(() => validateConfig({
    ...validConfig,
    gardens: [{ ...validConfig.gardens[0], commands: [command, command] }],
  }), {
    message: 'Duplicate command id "hello" at gardens[0].commands[1].id',
  });
});
