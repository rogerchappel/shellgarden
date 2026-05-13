import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { executeCommand } from "./executor.js";
import { normalizeOutput, resolveInside } from "./pathing.js";
import { hasBlockingFinding, inspectCommand } from "./safety.js";
import type { CommandResult, Finding, GardenReport, Transcript } from "./types.js";

export interface RunOptions {
  dryRun?: boolean;
  update?: boolean;
  strictWarnings?: boolean;
}

const DEFAULT_TIMEOUT_MS = 5000;
const FIXED_CHECKED_AT = "1970-01-01T00:00:00.000Z";

export async function runGarden(target: string, options: RunOptions = {}): Promise<GardenReport> {
  const loaded = loadConfig(target);
  const findings: Finding[] = [];
  const results: CommandResult[] = [];

  for (const garden of loaded.config.gardens) {
    const fixturePath = resolveInside(loaded.root, garden.fixture);
    if (!fs.existsSync(fixturePath) || !fs.statSync(fixturePath).isDirectory()) {
      findings.push({ level: "error", code: "missing-fixture", message: `Fixture not found: ${garden.fixture}`, gardenId: garden.id, path: garden.fixture });
      continue;
    }
    for (const command of garden.commands) {
      const commandFindings = inspectCommand(command, garden.id);
      const result: CommandResult = {
        gardenId: garden.id,
        commandId: command.id,
        description: command.description,
        fixturePath: normalizeOutput(fixturePath, loaded.root),
        expectedExit: command.expectExit ?? 0,
        findings: [...commandFindings],
      };
      if (options.dryRun || hasBlockingFinding(commandFindings)) {
        result.skipped = true;
      } else {
        const transcript = await executeCommand(command, {
          cwd: fixturePath,
          workspaceRoot: loaded.root,
          timeoutMs: command.timeoutMs ?? loaded.config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS,
        });
        result.transcript = transcript;
        result.findings.push(...compareExit(command.expectExit ?? 0, transcript, garden.id, command.id, command.allowFail));
        result.findings.push(...compareTranscript(loaded.root, command.transcript, transcript, garden.id, command.id, options.update));
      }
      findings.push(...result.findings);
      results.push(result);
    }
  }

  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  return {
    ok: errors === 0 && (!options.strictWarnings || warnings === 0),
    checkedAt: FIXED_CHECKED_AT,
    root: normalizeOutput(loaded.root, loaded.root),
    configPath: normalizeOutput(loaded.configPath, loaded.root),
    summary: {
      gardens: loaded.config.gardens.length,
      commands: results.length,
      findings: findings.length,
      errors,
      warnings,
      skipped: results.filter((result) => result.skipped).length,
    },
    findings: findings.sort(sortFinding),
    results: results.sort((a, b) => `${a.gardenId}/${a.commandId}`.localeCompare(`${b.gardenId}/${b.commandId}`)),
  };
}

function compareExit(expected: number, transcript: Transcript, gardenId: string, commandId: string, allowFail?: boolean): Finding[] {
  if (transcript.exitCode === expected || allowFail) return [];
  return [{ level: "error", code: "exit-mismatch", message: `expected exit ${expected}, got ${transcript.exitCode}`, gardenId, commandId }];
}

function compareTranscript(root: string, transcriptPath: string | undefined, actual: Transcript, gardenId: string, commandId: string, update?: boolean): Finding[] {
  if (!transcriptPath) return [];
  const fullPath = resolveInside(root, transcriptPath);
  const rendered = renderTranscript(actual);
  if (update) {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `${rendered}\n`);
    return [];
  }
  if (!fs.existsSync(fullPath)) {
    return [{ level: "warning", code: "missing-transcript", message: `expected transcript is missing: ${transcriptPath}`, gardenId, commandId, path: transcriptPath }];
  }
  const expected = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n").trimEnd();
  if (expected !== rendered) {
    return [{ level: "error", code: "transcript-mismatch", message: `transcript changed: ${transcriptPath}`, gardenId, commandId, path: transcriptPath }];
  }
  return [];
}

export function renderTranscript(transcript: Transcript): string {
  const lines = [
    `$ ${transcript.command}`,
    `cwd: ${transcript.cwd}`,
    `exit: ${transcript.exitCode}`,
  ];
  if (transcript.stdout) lines.push("stdout:", transcript.stdout);
  if (transcript.stderr) lines.push("stderr:", transcript.stderr);
  return lines.join("\n");
}

function sortFinding(a: Finding, b: Finding): number {
  return `${a.level}/${a.gardenId ?? ""}/${a.commandId ?? ""}/${a.code}`.localeCompare(`${b.level}/${b.gardenId ?? ""}/${b.commandId ?? ""}/${b.code}`);
}
