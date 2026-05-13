# ShellGarden PRD

Status: in-progress

## Pitch

A fixture-backed command garden: declare shell examples once, run them across sample projects, and harvest deterministic transcripts. 🪴

## Why It Matters

README commands rot. Agents need local command examples that can be validated and reused in docs/tests.

## Target users

- CLI authors who want deterministic local checks.
- Agentic coding workflows that need safe, inspectable fixtures.
- Maintainers who prefer useful small tools over SaaS dashboards.

## V1 Scope

- TypeScript Node.js CLI, local-first, no hidden network calls.
- Fixture-backed parser and planner core.
- Human-readable text output and JSON output.
- `init`, primary check/run command, and `explain`/`report` style command where appropriate.
- Useful examples under `examples/` and tests under `fixtures/`.
- Safety defaults: dry-run first, explicit paths, no destructive writes unless a future version adds opt-in mutation.

## Out of Scope

- Hosted service.
- Telemetry.
- Automatic destructive changes.
- LLM dependency.

## CLI/API Sketch

```bash
shellgarden --help
shellgarden init ./demo
shellgarden check ./demo --format text
shellgarden check ./demo --format json
shellgarden explain ./demo
```

## Functional requirements

- Reads only the requested workspace or fixture paths.
- Produces deterministic ordered findings.
- Exits `0` when clean, `1` when findings exceed default policy, `2` for invalid input/config.
- Includes enough context for another developer or agent to act safely.
- Ships fixture-backed tests for clean, warning, and failure cases.

## Verification

- `npm test`
- `npm run check`
- `npm run build`
- `npm run smoke`
- `bash scripts/validate.sh`
- At least one real CLI smoke against `fixtures/` or `examples/`.

## Source attribution

Inspired by doctest/literate testing patterns, reframed for shell snippets, fixtures, and CLI project docs.

## Agent Prompt

Build a polished local-first OSS CLI named `shellgarden`. Use StackForge scaffolding, keep the implementation deterministic and fixture-backed, add practical docs with personality, and publish a public GitHub repo under `rogerchappel/shellgarden` after local verification.
