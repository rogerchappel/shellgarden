import { spawn } from "node:child_process";
import type { CommandSpec, Transcript } from "./types.js";
import { normalizeOutput } from "./pathing.js";

export interface ExecuteOptions {
  cwd: string;
  workspaceRoot: string;
  timeoutMs: number;
}

const MAX_CAPTURE_BYTES = 128 * 1024;
const TRUNCATION_MARKER = "\n<output truncated>";
const MAX_CAPTURE_CONTENT_BYTES = MAX_CAPTURE_BYTES - Buffer.byteLength(TRUNCATION_MARKER, "utf8");

export async function executeCommand(command: CommandSpec, options: ExecuteOptions): Promise<Transcript> {
  const startedAt = process.hrtime.bigint();
  const child = spawn(command.run, {
    cwd: options.cwd,
    shell: "/bin/sh",
    env: deterministicEnv(options.workspaceRoot),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = emptyCapture();
  let stderr = emptyCapture();
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
    stdout: normalizeOutput(stdout.output, options.workspaceRoot),
    stderr: normalizeOutput(timedOut ? `${stderr.output}\n<timed out after ${options.timeoutMs}ms>` : stderr.output, options.workspaceRoot),
    durationMs,
  };
}

interface Capture {
  output: string;
  truncated: boolean;
}

function emptyCapture(): Capture {
  return { output: "", truncated: false };
}

function appendBounded(current: Capture, chunk: string): Capture {
  if (current.truncated) return current;
  const next = current.output + chunk;
  if (Buffer.byteLength(next, "utf8") <= MAX_CAPTURE_BYTES) return { output: next, truncated: false };
  return {
    output: `${utf8Prefix(next, MAX_CAPTURE_CONTENT_BYTES)}${TRUNCATION_MARKER}`,
    truncated: true,
  };
}

function utf8Prefix(value: string, maxBytes: number): string {
  let bytes = 0;
  let codeUnits = 0;
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (bytes + characterBytes > maxBytes) break;
    bytes += characterBytes;
    codeUnits += character.length;
  }
  return value.slice(0, codeUnits);
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
