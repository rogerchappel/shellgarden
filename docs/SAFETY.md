# Safety

ShellGarden is designed for reviewable local checks, not arbitrary automation.

## Boundaries

- Config must live inside the target workspace.
- Fixtures must resolve inside that workspace.
- Transcript writes require `--update` and also stay inside the workspace.
- `run` dry-runs unless `--execute` is present.
- Output replaces absolute workspace paths with `<workspace>`.

## Blocked commands

The first release blocks common foot-guns before execution:

- destructive `rm` flags
- `sudo`
- network utilities such as `curl`, `wget`, `ssh`, `scp`, and `nc`
- broad `chmod 777`
- disk mutation commands such as `dd`, `mkfs`, and `diskutil`
- writes aimed at obvious system directories

## Still review commands

ShellGarden is not a container or kernel sandbox. It is a deterministic harness for fixture examples. Treat garden config changes like test changes: inspect them in review, then let CI run them.
