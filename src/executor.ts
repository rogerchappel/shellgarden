import { spawn } from "node:child_process";
import type { CommandSpec, Transcript } from "./types.js";
import { normalizeOutput } from "./pathing.js";

export interface ExecuteOptions {
  cwd: string;
  workspaceRoot: string;
  timeoutMs: number;
}

export async function executeCommand(command: CommandSpec, options: ExecuteOptions): Promise<Transcript> {
  const child = spawn(command.run, {
    cwd: options.cwd,
    shell: "/bin/sh",
    env: deterministicEnv(options.workspaceRoot),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  const timedOut = await new Promise<boolean>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve(true);
    }, options.timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });

  return {
    command: command.run,
    cwd: normalizeOutput(options.cwd, options.workspaceRoot),
    exitCode: timedOut ? null : child.exitCode,
    stdout: normalizeOutput(stdout, options.workspaceRoot),
    stderr: normalizeOutput(timedOut ? `${stderr}\n<timed out after ${options.timeoutMs}ms>` : stderr, options.workspaceRoot),
    durationMs: 0,
  };
}

function deterministicEnv(root: string): NodeJS.ProcessEnv {
  return {
    HOME: root,
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    SHELL: "/bin/sh",
    LANG: "C",
    LC_ALL: "C",
    TZ: "UTC",
    CI: "1",
    NO_COLOR: "1",
  };
}
