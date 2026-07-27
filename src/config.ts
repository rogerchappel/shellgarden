import fs from "node:fs";
import path from "node:path";
import { ShellGardenError } from "./errors.js";
import type { CommandSpec, GardenSpec, ShellGardenConfig } from "./types.js";

export const CONFIG_FILE = "shellgarden.config.json";

export interface LoadedConfig {
  root: string;
  configPath: string;
  config: ShellGardenConfig;
}

export function findConfigPath(target: string): string {
  const resolved = path.resolve(target);
  const stat = fs.existsSync(resolved) ? fs.statSync(resolved) : undefined;
  const candidate = stat?.isFile() ? resolved : path.join(resolved, CONFIG_FILE);
  if (!fs.existsSync(candidate)) {
    throw new ShellGardenError(`No ${CONFIG_FILE} found at ${target}`);
  }
  return candidate;
}

export function loadConfig(target: string): LoadedConfig {
  const configPath = findConfigPath(target);
  const root = path.dirname(configPath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new ShellGardenError(`Cannot parse ${configPath}: ${(error as Error).message}`);
  }
  const config = validateConfig(parsed);
  return { root, configPath, config };
}

export function validateConfig(value: unknown): ShellGardenConfig {
  if (!isRecord(value)) throw new ShellGardenError("Config must be a JSON object");
  rejectUnknownProperties(value, ["version", "name", "defaultTimeoutMs", "gardens"], "Config");
  if (value.version !== 1) throw new ShellGardenError("Config version must be 1");
  if (!Array.isArray(value.gardens)) throw new ShellGardenError("Config gardens must be an array");
  if (value.gardens.length === 0) throw new ShellGardenError("Config gardens must contain at least one garden");
  const gardens = value.gardens.map(validateGarden);
  rejectDuplicateIds(gardens, "garden", (index) => `gardens[${index}].id`);
  return {
    version: 1,
    name: optionalString(value.name, "name"),
    defaultTimeoutMs: optionalPositiveInteger(value.defaultTimeoutMs, "defaultTimeoutMs"),
    gardens,
  };
}

function validateGarden(value: unknown, index: number): GardenSpec {
  if (!isRecord(value)) throw new ShellGardenError(`Garden ${index} must be an object`);
  rejectUnknownProperties(value, ["id", "fixture", "description", "commands"], `gardens[${index}]`);
  const id = requiredId(value.id, `gardens[${index}].id`);
  const fixture = requiredString(value.fixture, `gardens[${index}].fixture`);
  if (!Array.isArray(value.commands)) throw new ShellGardenError(`Garden ${id} commands must be an array`);
  if (value.commands.length === 0) throw new ShellGardenError(`Garden ${id} commands must contain at least one command`);
  const commands = value.commands.map((command, commandIndex) => validateCommand(command, id, index, commandIndex));
  rejectDuplicateIds(commands, "command", (commandIndex) => `gardens[${index}].commands[${commandIndex}].id`);
  return {
    id,
    fixture,
    description: optionalString(value.description, `gardens[${index}].description`),
    commands,
  };
}

function validateCommand(value: unknown, gardenId: string, gardenIndex: number, index: number): CommandSpec {
  if (!isRecord(value)) throw new ShellGardenError(`Command ${gardenId}/${index} must be an object`);
  rejectUnknownProperties(
    value,
    ["id", "run", "description", "expectExit", "allowFail", "timeoutMs", "transcript"],
    `gardens[${gardenIndex}].commands[${index}]`,
  );
  return {
    id: requiredId(value.id, `commands[${index}].id`),
    run: requiredString(value.run, `commands[${index}].run`),
    description: optionalString(value.description, `commands[${index}].description`),
    expectExit: optionalNonNegativeInteger(value.expectExit, `commands[${index}].expectExit`),
    allowFail: optionalBoolean(value.allowFail, `commands[${index}].allowFail`),
    timeoutMs: optionalPositiveInteger(value.timeoutMs, `commands[${index}].timeoutMs`),
    transcript: optionalString(value.transcript, `commands[${index}].transcript`),
  };
}

function rejectUnknownProperties(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown !== undefined) throw new ShellGardenError(`${path} has unknown property "${unknown}"`);
}

function rejectDuplicateIds<T extends { id: string }>(
  values: readonly T[],
  kind: string,
  pathForIndex: (index: number) => string,
): void {
  const seen = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (seen.has(value.id)) throw new ShellGardenError(`Duplicate ${kind} id "${value.id}" at ${pathForIndex(index)}`);
    seen.add(value.id);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new ShellGardenError(`${name} must be a non-empty string`);
  return value;
}

function requiredId(value: unknown, name: string): string {
  const text = requiredString(value, name);
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(text)) throw new ShellGardenError(`${name} must be a stable id`);
  return text;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, name);
}

function optionalBoolean(value: unknown, name: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new ShellGardenError(`${name} must be a boolean`);
  return value;
}

function optionalPositiveInteger(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) <= 0) throw new ShellGardenError(`${name} must be a positive integer`);
  return value as number;
}

function optionalNonNegativeInteger(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || (value as number) < 0) throw new ShellGardenError(`${name} must be a non-negative integer`);
  return value as number;
}
