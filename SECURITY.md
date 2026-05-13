# Security Policy

ShellGarden executes commands declared in repository-controlled fixture config, so safety reports are welcome even before the first stable release.

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.1.x | Best-effort pre-1.0 support |
| < 0.1.0 | No |

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions.

Use GitHub private vulnerability reporting if it is enabled for the repository. If it is not enabled, open a public issue asking for a private contact path without including exploit details, secrets, personal data, or sensitive technical details.

## What to Include

When a private reporting path is available, include:

- A clear description of the issue.
- Affected versions, files, packages, workflows, or configuration.
- Steps to reproduce, proof of concept, or attack scenario when safe to share.
- Potential impact.
- Suggested mitigation, if known.

## Scope

In scope:

- ShellGarden command safety bypasses.
- Path traversal outside the selected garden workspace.
- Transcript writes outside the selected garden workspace.
- Hidden network, telemetry, or unsafe default execution behavior.
- CI, release, or dependency guidance maintained by this project.

Out of scope:

- General support requests.
- Unsafe commands deliberately added by downstream users to their own private gardens.
- Vulnerabilities in unrelated downstream projects.

## Disclosure

Coordinate disclosure with maintainers before publishing vulnerability details.
