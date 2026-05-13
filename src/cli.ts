import { initProject } from "./init.js";
import { explainGarden } from "./explain.js";
import { renderJson, renderText } from "./render.js";
import { runGarden } from "./runner.js";
import { listGarden } from "./list.js";
import type { OutputFormat } from "./types.js";

interface ParsedArgs {
  command: string;
  target: string;
  format: OutputFormat;
  dryRun: boolean;
  update: boolean;
  strictWarnings: boolean;
  help: boolean;
  version: boolean;
}

export const VERSION = "0.1.0";

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);
  if (args.help || args.command === "help") {
    console.log(helpText());
    return 0;
  }
  if (args.version) {
    console.log(VERSION);
    return 0;
  }

  if (args.command === "init") {
    const written = initProject(args.target);
    console.log(`ShellGarden initialized ${args.target}`);
    for (const file of written) console.log(`created ${file}`);
    return 0;
  }

  if (args.command === "explain") {
    console.log(explainGarden(args.target));
    return 0;
  }

  if (args.command === "list") {
    console.log(listGarden(args.target));
    return 0;
  }

  if (args.command === "check" || args.command === "report" || args.command === "run") {
    const dryRun = args.command === "run" ? !argv.includes("--execute") : args.dryRun;
    const report = await runGarden(args.target, { dryRun, update: args.update, strictWarnings: args.strictWarnings });
    console.log(args.format === "json" ? renderJson(report) : renderText(report));
    return report.ok ? 0 : 1;
  }

  console.error(`Unknown command: ${args.command}`);
  console.error("Run shellgarden --help for usage.");
  return 2;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: "help",
    target: ".",
    format: "text",
    dryRun: false,
    update: false,
    strictWarnings: false,
    help: false,
    version: false,
  };

  const positional: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--version" || arg === "-v") parsed.version = true;
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--update") parsed.update = true;
    else if (arg === "--strict-warnings") parsed.strictWarnings = true;
    else if (arg === "--execute") continue;
    else if (arg === "--format") parsed.format = readFormat(argv[++index]);
    else if (arg.startsWith("--format=")) parsed.format = readFormat(arg.slice("--format=".length));
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }
  parsed.command = positional[0] ?? parsed.command;
  parsed.target = positional[1] ?? parsed.target;
  return parsed;
}

function readFormat(value: string | undefined): OutputFormat {
  if (value === "text" || value === "json") return value;
  throw new Error("--format must be text or json");
}

export function helpText(): string {
  return `ShellGarden - fixture-backed shell examples that stay fresh\n\nUsage:\n  shellgarden init <dir>\n  shellgarden check <dir> [--format text|json] [--update] [--dry-run] [--strict-warnings]\n  shellgarden report <dir> [--format text|json]\n  shellgarden run <dir> --execute [--format text|json]\n  shellgarden explain <dir>\n  shellgarden list <dir>\n\nExit codes:\n  0 clean garden\n  1 findings exceeded policy\n  2 invalid input or config\n`;
}
