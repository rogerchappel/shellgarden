import type { CommandSpec, Finding } from "./types.js";

const BLOCKED_PATTERNS: Array<[RegExp, string]> = [
  [/\brm\s+(-[^\n]*[rf]|-[^\n]*r|-[^\n]*f)/, "destructive rm flags are blocked"],
  [/\bsudo\b/, "sudo is blocked"],
  [/\b(curl|wget|scp|sftp|ssh|ftp|nc|netcat)\b/, "network commands are blocked"],
  [/\bchmod\s+(-R\s+)?777\b/, "world-writable chmod is blocked"],
  [/(^|[;&|]\s*)(mkfs|diskutil|dd)\b/, "disk mutation commands are blocked"],
  [/>\s*\/(etc|bin|usr|var|System|Library)\b/, "absolute system writes are blocked"],
];

export function inspectCommand(command: CommandSpec, gardenId: string): Finding[] {
  const findings: Finding[] = [];
  for (const [pattern, message] of BLOCKED_PATTERNS) {
    if (pattern.test(command.run)) {
      findings.push({
        level: "error",
        code: "unsafe-command",
        message,
        gardenId,
        commandId: command.id,
      });
    }
  }
  if (command.run.length > 500) {
    findings.push({
      level: "warning",
      code: "long-command",
      message: "command is long enough to be hard to review",
      gardenId,
      commandId: command.id,
    });
  }
  if (/\$\(|`/.test(command.run)) {
    findings.push({
      level: "warning",
      code: "command-substitution",
      message: "command substitution can hide non-deterministic behavior",
      gardenId,
      commandId: command.id,
    });
  }
  return findings;
}

export function hasBlockingFinding(findings: Finding[]): boolean {
  return findings.some((finding) => finding.level === "error");
}
