#!/usr/bin/env node
import fs from 'node:fs';

const required = [
  'README.md',
  'docs/PRD.md',
  'docs/TASKS.md',
  'docs/ORCHESTRATION.md',
  'docs/CONFIG.md',
  'docs/SAFETY.md',
  'docs/orchestration.json',
  'docs/schema/shellgarden.schema.json'
];

let failed = false;
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`missing ${file}`);
    failed = true;
  }
}
for (const jsonFile of ['docs/orchestration.json', 'docs/schema/shellgarden.schema.json']) {
  JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
}
if (failed) process.exit(1);
console.log('docs ok');
