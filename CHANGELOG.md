# Changelog

All notable changes to ShellGarden will be documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic versioning for tagged releases.

## [Unreleased]

### Added

- Local-first TypeScript CLI with `init`, `check`, `report`, `run`, `explain`, and `list` commands.
- Fixture-backed shell command declarations in `shellgarden.config.json`.
- Golden transcript comparison and explicit `--update` harvesting.
- Deterministic report rendering with normalized workspace paths and timestamps.
- Safety checks for destructive commands, network tools, privilege escalation, and path escapes.
- Strict warning policy, dry-run behavior, command filtering, and JSON/text report output.
- Example README command garden, config schema, orchestration notes, and safety documentation.
- Node test coverage, smoke checks, repository validation, and GitHub Actions CI.

## Release Links

- Unreleased: `https://github.com/rogerchappel/shellgarden/compare/v0.1.0...HEAD`
- Latest release: `https://github.com/rogerchappel/shellgarden/releases/latest`
