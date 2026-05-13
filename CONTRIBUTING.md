# Contributing

Thanks for helping tend ShellGarden. Keep changes small, local-first, and fixture-backed.

## Development

```bash
npm install
npm run check
npm test
npm run smoke
bash scripts/validate.sh
```

## Commit style

Prefer focused commits that explain intent:

- `feat:` user-visible capability
- `fix:` bug or determinism correction
- `test:` fixture or automated coverage
- `docs:` documentation-only change
- `chore:` repository maintenance

## Adding command behavior

1. Add or update a fixture under `fixtures/`.
2. Add a node:test case under `tests/`.
3. Update docs when the CLI surface changes.
4. Run the full validation set.

## Safety expectations

Do not add hidden network calls, telemetry, or broad filesystem mutation. If a command can write transcripts, it must require explicit user intent.
