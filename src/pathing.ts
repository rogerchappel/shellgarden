import path from "node:path";
import { ShellGardenError } from "./errors.js";

export function resolveInside(base: string, target: string): string {
  const root = path.resolve(base);
  const resolved = path.resolve(root, target);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new ShellGardenError(`Path escapes workspace: ${target}`);
  }
  return resolved;
}

export function relativePosix(from: string, to: string): string {
  const rel = path.relative(from, to) || ".";
  return rel.split(path.sep).join("/");
}

export function normalizeOutput(value: string, workspace: string): string {
  const unixWorkspace = workspace.split(path.sep).join("/");
  return value
    .replaceAll(workspace, "<workspace>")
    .replaceAll(unixWorkspace, "<workspace>")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trimEnd();
}
