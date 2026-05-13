# ShellGarden Tasks

## MVP build

- [x] Scaffold OSS TypeScript CLI with StackForge.
- [x] Implement config loading and validation.
- [x] Add safe path resolution for requested workspaces and fixture directories.
- [x] Add command safety inspection before execution.
- [x] Execute examples with deterministic environment defaults.
- [x] Normalize transcript output for stable paths and line endings.
- [x] Compare expected exits and golden transcript files.
- [x] Support `--update` for harvesting transcripts.
- [x] Render human-readable text output.
- [x] Render JSON reports for agents and CI.
- [x] Add `init`, `check`, `report`, `run`, and `explain` commands.
- [x] Add clean, warning, failure, and unsafe fixture gardens.
- [x] Add node:test coverage for reports, policy, and CLI exits.
- [x] Document safety model and local workflow.
- [x] Publish public GitHub repository.

## Near-term follow-ups

- [ ] Add Windows shell strategy once a Windows fixture matrix exists.
- [ ] Add richer transcript diff output.
- [ ] Add config schema publishing.
- [ ] Add README code-block extraction after the explicit config format settles.
