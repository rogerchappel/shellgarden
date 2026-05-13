export type OutputFormat = "text" | "json";
export type FindingLevel = "error" | "warning" | "info";

export interface CommandSpec {
  id: string;
  run: string;
  description?: string;
  expectExit?: number;
  allowFail?: boolean;
  timeoutMs?: number;
  transcript?: string;
}

export interface GardenSpec {
  id: string;
  fixture: string;
  description?: string;
  commands: CommandSpec[];
}

export interface ShellGardenConfig {
  version: 1;
  name?: string;
  defaultTimeoutMs?: number;
  gardens: GardenSpec[];
}

export interface Finding {
  level: FindingLevel;
  code: string;
  message: string;
  gardenId?: string;
  commandId?: string;
  path?: string;
}

export interface Transcript {
  command: string;
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface CommandResult {
  gardenId: string;
  commandId: string;
  description?: string;
  fixturePath: string;
  expectedExit: number;
  transcript?: Transcript;
  findings: Finding[];
  skipped?: boolean;
}

export interface GardenReport {
  ok: boolean;
  checkedAt: string;
  root: string;
  configPath: string;
  summary: {
    gardens: number;
    commands: number;
    findings: number;
    errors: number;
    warnings: number;
    skipped: number;
  };
  findings: Finding[];
  results: CommandResult[];
}
