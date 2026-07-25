#!/usr/bin/env node
import { main } from "./cli.js";
import { isShellGardenError } from "./errors.js";

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
