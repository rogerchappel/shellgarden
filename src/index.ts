#!/usr/bin/env node
import { isShellGardenError } from "./errors.js";
import { main } from "./cli.js";

main().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  if (isShellGardenError(error)) {
    console.error(error.message);
    process.exitCode = error.exitCode;
    return;
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});

export { runGarden, renderTranscript } from "./runner.js";
export { explainGarden } from "./explain.js";
export type { ShellGardenConfig, GardenReport, CommandSpec, GardenSpec } from "./types.js";
