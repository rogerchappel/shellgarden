import { spawn } from "node:child_process";
import type { CommandSpec, Transcript } from "./types.js";
import { normalizeOutput } from "./pathing.js";

export interface ExecuteOptions {
  cwd: string;
  workspaceRoot: string;
  timeoutMs: number;
}

const MAX_CAPTURE_BYTES = 128 * 1024;

export async function executeCommand(command: CommandSpec, options: ExecuteOptions): Promise<Transcript> {
  const startedAt = process.hrtime.bigint();
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
    stdout = appendBounded(stdout, chunk);
  });
  child.stderr.on("data", (chunk: string) => {
    stderr = appendBounded(stderr, chunk);
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
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  return {
    command: command.run,
    cwd: normalizeOutput(options.cwd, options.workspaceRoot),
    exitCode: timedOut ? null : child.exitCode,
    stdout: normalizeOutput(stdout, options.workspaceRoot),
    stderr: normalizeOutput(timedOut ? `${stderr}\n<timed out after ${options.timeoutMs}ms>` : stderr, options.workspaceRoot),
    durationMs,
  };
}

function appendBounded(current: string, chunk: string): string {
  const next = current + chunk;
  if (Buffer.byteLength(next, "utf8") <= MAX_CAPTURE_BYTES) return next;
  return `${next.slice(0, MAX_CAPTURE_BYTES)}\n<output truncated>`;
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
