# Configuration

ShellGarden reads `shellgarden.config.json` from the directory passed to `check`, `report`, `run`, or `explain`.

## Fields

- `version`: currently `1`.
- `name`: optional display name.
- `defaultTimeoutMs`: optional command timeout in milliseconds.
- `gardens`: non-empty ordered list of fixture-backed command groups. Garden IDs must be unique.

Each garden has:

- `id`: stable identifier used in reports.
- `fixture`: path under the workspace. Commands execute from here.
- `description`: optional human context.
- `commands`: non-empty ordered command declarations. Command IDs must be unique within their garden.

Each command has:

- `id`: stable identifier.
- `run`: shell command run with `/bin/sh`.
- `expectExit`: expected exit code, default `0`.
- `allowFail`: records the transcript without failing on exit mismatch.
- `timeoutMs`: per-command timeout override.
- `transcript`: optional golden transcript path under the workspace.

## Schema

See [`docs/schema/shellgarden.schema.json`](schema/shellgarden.schema.json).

Configuration objects are strict: properties not listed above are rejected instead of being ignored.

## Report transcripts

Executed commands include a `transcript` in JSON reports. Its `durationMs` is the non-negative elapsed command time measured with a monotonic clock and may include fractional milliseconds. A command stopped by `timeoutMs` has `exitCode: null` and ends `stderr` with `<timed out after Nms>`.

Each transcript captures stdout and stderr independently, up to 128 KiB per stream measured as UTF-8 bytes. Oversized output is cut at a complete character and ends with exactly one `<output truncated>` marker; the marker is included within the 128 KiB limit.
