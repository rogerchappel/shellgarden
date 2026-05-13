export class ShellGardenError extends Error {
  constructor(
    message: string,
    public readonly exitCode = 2,
  ) {
    super(message);
    this.name = "ShellGardenError";
  }
}

export function isShellGardenError(error: unknown): error is ShellGardenError {
  return error instanceof ShellGardenError;
}
