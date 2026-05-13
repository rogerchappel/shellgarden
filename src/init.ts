import fs from "node:fs";
import path from "node:path";
import { CONFIG_FILE } from "./config.js";
import { ShellGardenError } from "./errors.js";

export function initProject(target: string): string[] {
  const root = path.resolve(target);
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    throw new ShellGardenError(`Refusing to initialize non-empty directory: ${target}`);
  }
  fs.mkdirSync(path.join(root, "fixtures", "hello"), { recursive: true });
  fs.mkdirSync(path.join(root, "transcripts"), { recursive: true });
  fs.writeFileSync(path.join(root, "fixtures", "hello", "name.txt"), "ShellGarden\n");
  fs.writeFileSync(path.join(root, CONFIG_FILE), `${JSON.stringify(sampleConfig(), null, 2)}\n`);
  fs.writeFileSync(path.join(root, "README.md"), sampleReadme());
  return [CONFIG_FILE, "fixtures/hello/name.txt", "README.md"];
}

function sampleConfig(): unknown {
  return {
    version: 1,
    name: "demo-garden",
    defaultTimeoutMs: 5000,
    gardens: [
      {
        id: "hello",
        fixture: "fixtures/hello",
        description: "Tiny deterministic shell example",
        commands: [
          {
            id: "print-name",
            run: "printf 'hello '; cat name.txt",
            description: "Reads a fixture file and prints a greeting",
            expectExit: 0,
            transcript: "transcripts/hello-print-name.txt",
          },
        ],
      },
    ],
  };
}

function sampleReadme(): string {
  return `# Demo ShellGarden\n\nRun this fixture-backed shell example:\n\n\`\`\`bash\nshellgarden check . --update\nshellgarden check .\n\`\`\`\n`;
}
