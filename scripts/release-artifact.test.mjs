import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validatePackOutput, validateTag } from './release-artifact.mjs';

const packageJson = { name: 'shellgarden', version: '0.1.0' };
const validPack = { name: 'shellgarden', version: '0.1.0', filename: 'shellgarden-0.1.0.tgz' };

test('requires the release tag to exactly match the package version', () => {
  assert.doesNotThrow(() => validateTag('v0.1.0', packageJson.version));
  assert.throws(() => validateTag('v0.1.1', packageJson.version), /must be exactly v0\.1\.0/);
  assert.throws(() => validateTag('0.1.0', packageJson.version), /must be exactly v0\.1\.0/);
});

test('accepts one present artifact with the package identity', () => {
  assert.equal(validatePackOutput(JSON.stringify([validPack]), packageJson, () => true), validPack.filename);
});

test('rejects missing, ambiguous, and divergent pack output', () => {
  assert.throws(() => validatePackOutput('[]', packageJson), /exactly one artifact/);
  assert.throws(() => validatePackOutput(JSON.stringify([validPack, validPack]), packageJson), /exactly one artifact/);
  assert.throws(() => validatePackOutput(JSON.stringify([{ ...validPack, version: '0.1.1' }]), packageJson), /identity mismatch/);
  assert.throws(() => validatePackOutput(JSON.stringify([{ ...validPack, filename: 'repacked.tgz' }]), packageJson), /identity mismatch/);
  assert.throws(() => validatePackOutput(JSON.stringify([validPack]), packageJson, () => false), /artifact is missing/);
});

test('release workflows use one captured artifact and never a broad tarball glob', () => {
  for (const path of ['.github/workflows/release.yml', '.github/workflows/release-dry-run.yml']) {
    const workflow = readFileSync(path, 'utf8');
    assert.equal((workflow.match(/node scripts\/release-artifact\.mjs/g) ?? []).length, 1, path);
    assert.doesNotMatch(workflow, /\*\.tgz/, path);
  }
  const release = readFileSync('.github/workflows/release.yml', 'utf8');
  assert.match(release, /steps\.artifact\.outputs\.artifact/);
  assert.equal((release.match(/npm pack/g) ?? []).length, 0);
});
