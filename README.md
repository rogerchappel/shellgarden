# ShellGarden 🪴

ShellGarden keeps shell examples alive. Declare commands once, point them at tiny fixture directories, and harvest deterministic transcripts you can trust in READMEs, tests, and agent handoffs.

It is local-first: no telemetry, no hidden network calls, and no mutation outside the garden path you ask it to inspect.

## Install

```bash
npm install -g shellgarden
```

For local development:

```bash
npm install
npm run build
node dist/bin.js --help
```

## Quick start

```bash
shellgarden init ./demo
cd demo
shellgarden check . --update
shellgarden check .
shellgarden report . --format json
shellgarden explain .
```

A garden config looks like this:

```json
{
  "version": 1,
  "name": "docs-examples",
  "defaultTimeoutMs": 5000,
  "gardens": [
    {
      "id": "read-file",
      "fixture": "fixtures/read-file",
      "commands": [
        {
          "id": "print-message",
          "run": "cat message.txt",
          "expectExit": 0,
          "transcript": "transcripts/read-file-print-message.txt"
        }
      ]
    }
  ]
}
```

## Commands

- `shellgarden init <dir>` creates a small demo garden.
- `shellgarden check <dir> [--format text|json] [--update] [--dry-run] [--strict-warnings] [--filter id]` executes safe examples and compares transcripts.
- `shellgarden report <dir> --format json` emits machine-readable results.
- `shellgarden run <dir> --execute` is an explicit execution alias; without `--execute`, it dry-runs.
- `shellgarden explain <dir>` prints the execution plan and safety notes.
- `shellgarden list <dir>` prints a tab-separated inventory of garden commands.

## Exit codes

- `0` — garden is clean.
- `1` — findings exceeded policy, such as exit or transcript mismatch.
- `2` — invalid input/config.

## Safety model

ShellGarden runs commands only inside declared fixture directories. It rejects path escapes and blocks obviously risky commands (`sudo`, destructive `rm`, common network tools, broad chmods, and system writes). The environment is normalized with UTC locale/timezone settings and output paths are replaced with `<workspace>`.

This is not a sandbox. Treat garden commands like test scripts: review them before accepting contributions. See [docs/SAFETY.md](docs/SAFETY.md) for the full boundary model.

## Examples

Try the repository fixtures:

```bash
node dist/bin.js check fixtures/pass
node dist/bin.js report fixtures/pass --format json
node dist/bin.js explain fixtures/pass
```

The `fixtures/warn`, `fixtures/fail`, and `fixtures/unsafe` gardens document warning, policy failure, and safety-blocked cases.

## Verify

```bash
npm test
npm run check
npm run smoke
npm run package:smoke
npm run release:check
```

## Why this exists

README commands rot quietly. Agents copy stale examples loudly. ShellGarden gives small projects a way to keep examples executable, deterministic, and easy to inspect.
