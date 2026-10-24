import { z } from "zod";

const publicEnvironmentSchema = z
  .object({ NEXT_PUBLIC_APP_URL: z.url().optional() })
  .strict();

const serverEnvironmentSchema = z
  .object({
    VOWORA_ENV: z.enum(["local", "preview", "production"]).default("local"),
  })
  .strict();

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export class EnvironmentConfigurationError extends Error {
  readonly variables: readonly string[];

  constructor(variables: readonly string[]) {
    super(`Invalid environment configuration: ${variables.join(", ")}`);
    this.name = "EnvironmentConfigurationError";
    this.variables = variables;
  }
}

function parseEnvironment<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const variables = [
    ...new Set(
      result.error.issues.map((issue) =>
        String(issue.path[0] ?? "environment"),
      ),
    ),
  ].sort();
  throw new EnvironmentConfigurationError(variables);
}

export function readPublicEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): PublicEnvironment {
  return parseEnvironment(publicEnvironmentSchema, {
    NEXT_PUBLIC_APP_URL: environment.NEXT_PUBLIC_APP_URL || undefined,
  });
}

export function readServerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ServerEnvironment {
  return parseEnvironment(serverEnvironmentSchema, {
    VOWORA_ENV: environment.VOWORA_ENV || undefined,
  });
}

export function readApplicationEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const publicEnvironment = readPublicEnvironment(environment);
  const serverEnvironment = readServerEnvironment(environment);
  if (
    serverEnvironment.VOWORA_ENV === "production" &&
    (!publicEnvironment.NEXT_PUBLIC_APP_URL ||
      new URL(publicEnvironment.NEXT_PUBLIC_APP_URL).protocol !== "https:")
  ) {
    throw new EnvironmentConfigurationError(["NEXT_PUBLIC_APP_URL"]);
  }
  return { publicEnvironment, serverEnvironment } as const;
}
