import { z } from "zod";

const publicEnvironmentSchema = z
  .object({
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).max(256).optional(),
  })
  .strict();

const serverEnvironmentSchema = z
  .object({
    VOWORA_ENV: z.enum(["local", "preview", "production"]).default("local"),
  })
  .strict();

const authEnvironmentSchema = z
  .object({
    AUTH_SECRET: z.string().min(32).max(512),
    AUTH_EMAIL_FROM: z.email().max(320),
    AUTH_ABUSE_HASH_SECRET: z.string().min(32).max(512),
    RESEND_API_KEY: z.string().min(16).max(512),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(16).max(2048),
    TURNSTILE_SECRET_KEY: z.string().min(16).max(2048),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).max(256),
    NEXT_PUBLIC_APP_URL: z.url(),
    VOWORA_ENV: z.enum(["local", "preview", "production"]).default("local"),
  })
  .strict();

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

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
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
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

export function readAuthEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): AuthEnvironment {
  const result = parseEnvironment(authEnvironmentSchema, {
    AUTH_SECRET: environment.AUTH_SECRET,
    AUTH_EMAIL_FROM: environment.AUTH_EMAIL_FROM,
    AUTH_ABUSE_HASH_SECRET: environment.AUTH_ABUSE_HASH_SECRET,
    RESEND_API_KEY: environment.RESEND_API_KEY,
    UPSTASH_REDIS_REST_URL: environment.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: environment.UPSTASH_REDIS_REST_TOKEN,
    TURNSTILE_SECRET_KEY: environment.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_URL: environment.NEXT_PUBLIC_APP_URL,
    VOWORA_ENV: environment.VOWORA_ENV || undefined,
  });
  const url = new URL(result.NEXT_PUBLIC_APP_URL);
  if (
    (result.VOWORA_ENV === "preview" || result.VOWORA_ENV === "production") &&
    url.protocol !== "https:"
  ) {
    throw new EnvironmentConfigurationError(["NEXT_PUBLIC_APP_URL"]);
  }
  return result;
}
