import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

export function validateTag(tag, version) {
  const expected = `v${version}`;
  if (tag !== expected) throw new Error(`Release tag must be exactly ${expected}; received ${tag || '(empty)'}`);
}

export function validatePackOutput(output, packageJson, fileExists = existsSync) {
  let entries;
  try {
    entries = JSON.parse(output);
  } catch {
    throw new Error('npm pack did not return valid JSON');
  }
  if (!Array.isArray(entries) || entries.length !== 1) {
    throw new Error(`npm pack must return exactly one artifact; received ${Array.isArray(entries) ? entries.length : 'non-array output'}`);
  }
  const [pack] = entries;
  const expectedFilename = `${packageJson.name.replaceAll('@', '').replaceAll('/', '-')}-${packageJson.version}.tgz`;
  if (pack.name !== packageJson.name || pack.version !== packageJson.version || pack.filename !== expectedFilename) {
    throw new Error(`Packed identity mismatch; expected ${packageJson.name}@${packageJson.version} in ${expectedFilename}`);
  }
  if (!fileExists(pack.filename)) throw new Error(`Packed artifact is missing: ${pack.filename}`);
  return pack.filename;
}

export function createReleaseArtifact({ tag, outputFile = process.env.GITHUB_OUTPUT } = {}) {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  if (tag !== undefined) validateTag(tag, packageJson.version);
  const output = execFileSync('npm', ['pack', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const artifact = validatePackOutput(output, packageJson);
  if (outputFile) appendFileSync(outputFile, `artifact=${artifact}\n`);
  process.stdout.write(`${artifact}\n`);
  return artifact;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const tagIndex = process.argv.indexOf('--tag');
  const tag = tagIndex === -1 ? undefined : process.argv[tagIndex + 1];
  try {
    createReleaseArtifact({ tag });
  } catch (error) {
    console.error(`Release artifact validation failed: ${error.message}`);
    process.exit(1);
  }
}
