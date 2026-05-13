import { loadConfig } from "./config.js";

export function listGarden(target: string): string {
  const { config } = loadConfig(target);
  const lines: string[] = [];
  for (const garden of config.gardens) {
    for (const command of garden.commands) {
      lines.push(`${garden.id}/${command.id}\t${garden.fixture}\t${command.run}`);
    }
  }
  return lines.sort().join("\n");
}
