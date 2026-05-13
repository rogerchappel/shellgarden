import type { GardenReport } from "./types.js";
import { renderTranscript } from "./runner.js";

export function renderText(report: GardenReport): string {
  const icon = report.ok ? "✓" : "✗";
  const lines = [
    `${icon} ShellGarden ${report.ok ? "passed" : "found issues"}`,
    `gardens: ${report.summary.gardens}  commands: ${report.summary.commands}  findings: ${report.summary.findings}`,
  ];

  for (const finding of report.findings) {
    const where = [finding.gardenId, finding.commandId].filter(Boolean).join("/");
    lines.push(`${finding.level.toUpperCase()} ${finding.code}${where ? ` ${where}` : ""}: ${finding.message}`);
  }

  for (const result of report.results) {
    lines.push("", `# ${result.gardenId}/${result.commandId}`);
    if (result.skipped) lines.push("skipped");
    if (result.transcript) lines.push(renderTranscript(result.transcript));
  }

  return lines.join("\n");
}

export function renderJson(report: GardenReport): string {
  return JSON.stringify(report, null, 2);
}
