import path from "node:path";
import { loadConfig } from "./config.js";
import { inspectCommand } from "./safety.js";

export function explainGarden(target: string): string {
  const { root, config } = loadConfig(target);
  const lines = [
    `ShellGarden plan for ${config.name ?? path.basename(root)}`,
    `root: ${root}`,
    `gardens: ${config.gardens.length}`,
    "",
  ];
  for (const garden of config.gardens) {
    lines.push(`## ${garden.id}`);
    if (garden.description) lines.push(garden.description);
    lines.push(`fixture: ${garden.fixture}`);
    for (const command of garden.commands) {
      const findings = inspectCommand(command, garden.id);
      lines.push(`- ${command.id}: ${command.run}`);
      if (command.description) lines.push(`  ${command.description}`);
      if (command.transcript) lines.push(`  transcript: ${command.transcript}`);
      for (const finding of findings) lines.push(`  ${finding.level}: ${finding.message}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
