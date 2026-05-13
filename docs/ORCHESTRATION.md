# ShellGarden Orchestration

ShellGarden is intentionally boring to orchestrate: install dependencies, build once, then run fixture-backed commands.

## Local agent flow

```bash
npm install
npm run check
npm test
npm run smoke
bash scripts/validate.sh
```

## Execution boundaries

- Read/write scope is the requested ShellGarden workspace.
- Each command runs from its declared fixture directory.
- Commands that match the built-in unsafe patterns are skipped and reported as errors.
- `shellgarden run` dry-runs unless `--execute` is present.
- Transcript updates require explicit `--update`.

## CI recommendation

Run `npm run release:check` for a full local verification gate. Use `shellgarden check <path>` as an additional docs/examples gate in downstream projects.

## Agent handoff checklist

1. Read `shellgarden.config.json`.
2. Run `shellgarden explain <path>` to inspect the plan.
3. Run `shellgarden check <path> --format json` for deterministic results.
4. If transcripts intentionally changed, rerun with `--update`, inspect the diff, and commit the golden files.
