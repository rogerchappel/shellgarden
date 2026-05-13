# Roadmap

This roadmap describes intended direction, not a binding delivery promise. ShellGarden should stay small, deterministic, and local-first.

## Now

- Stabilize the `shellgarden.config.json` shape around real examples.
- Keep command execution reviewable with fixture-backed tests.
- Improve diagnostics for transcript drift and blocked commands.
- Collect feedback on README/example testing workflows.

## Next

- Add richer diff output for transcript mismatches.
- Support config schema discovery from editors and generated examples.
- Add optional JUnit or SARIF-style machine-readable output for CI.
- Explore per-command environment declarations that remain deterministic.

## Later

- Consider markdown snippet extraction once explicit config remains solid.
- Consider package-manager helpers for common docs examples.
- Investigate stronger sandbox adapters without making them mandatory.

## Not Planned

- Hidden telemetry or hosted execution.
- Running commands outside declared fixture directories.
- Mutating transcripts without explicit `--update` intent.
- Replacing full integration test suites; ShellGarden complements them.

## Roadmap Review

Before each meaningful release:

- Move completed user-visible work into `CHANGELOG.md`.
- Remove stale commitments.
- Promote only the next reviewable set of work into `Now`.
