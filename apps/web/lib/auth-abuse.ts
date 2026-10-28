import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export interface AuthAbuseRule {
  readonly windowSeconds: number;
  readonly maximumAttempts: number;
}

export interface AuthAbuseInput {
  readonly route: string;
  readonly identity: string;
  readonly clientAddress?: string;
  readonly challengeToken?: string;
  readonly rule: AuthAbuseRule;
}

export type AuthAbuseDecision =
  | { readonly outcome: "allow" }
  | { readonly outcome: "challenge" }
  | { readonly outcome: "block"; readonly retryAfter: number };

export interface AuthAbuseProtection {
  evaluate(input: AuthAbuseInput): Promise<AuthAbuseDecision>;
}

export const authAbuseCounterScript = `
local now = tonumber(redis.call('TIME')[1])
local values = redis.call('HMGET', KEYS[1], 'count', 'window_started', 'strikes', 'blocked_until', 'last_seen')
local count = tonumber(values[1]) or 0
local window_started = tonumber(values[2]) or now
local strikes = tonumber(values[3]) or 0
local blocked_until = tonumber(values[4]) or 0
local last_seen = tonumber(values[5]) or 0
local window = tonumber(ARGV[1])
local maximum = tonumber(ARGV[2])
local dimension = ARGV[3]
if dimension == 'identity' then
  blocked_until = 0
  strikes = 0
end
if blocked_until > now then
  return {'block', blocked_until - now, strikes}
end
if now - window_started >= window then
  count = 0
  window_started = now
  if last_seen > 0 and now - last_seen >= window * 4 then
    strikes = math.max(0, strikes - 1)
  end
end
count = count + 1
local outcome = 'allow'
local retry_after = 0
if dimension == 'identity' and count > maximum then
  count = maximum
  outcome = 'challenge'
elseif count > maximum + 2 then
  strikes = math.min(6, strikes + 1)
  retry_after = math.min(900, window * (2 ^ (strikes - 1)))
  blocked_until = now + retry_after
  outcome = 'block'
elseif count > maximum then
  outcome = 'challenge'
end
redis.call('HSET', KEYS[1], 'count', count, 'window_started', window_started, 'strikes', strikes, 'blocked_until', blocked_until, 'last_seen', now)
redis.call('EXPIRE', KEYS[1], math.max(86400, retry_after))
return {outcome, retry_after, strikes}
`;

interface CounterResult {
  readonly outcome: "allow" | "challenge" | "block";
  readonly retryAfter: number;
}

function safeRule(rule: AuthAbuseRule): boolean {
  return (
    Number.isInteger(rule.windowSeconds) &&
    rule.windowSeconds >= 1 &&
    rule.windowSeconds <= 3600 &&
    Number.isInteger(rule.maximumAttempts) &&
    rule.maximumAttempts >= 1 &&
    rule.maximumAttempts <= 100
  );
}

function safeKeyPart(value: string, maximum: number): boolean {
  return value.length > 0 && value.length <= maximum;
}

export function trustedVercelClientAddress(
  request: Request,
  vercelDeployment: boolean,
): string | undefined {
  if (!vercelDeployment) return undefined;
  // Vercel documents that it overwrites this header at its public boundary to
  // prevent spoofing. Reject proxy chains because they are outside that
  // documented contract and must not become attacker-selected dimensions.
  const candidate = request.headers.get("x-forwarded-for")?.trim();
  if (candidate?.includes(",")) return undefined;
  return candidate && isIP(candidate) !== 0
    ? candidate.toLowerCase()
    : undefined;
}

export function createUpstashAuthAbuseProtection(config: {
  readonly redisUrl: string;
  readonly redisToken: string;
  readonly hashSecret: string;
  readonly turnstileSecret: string;
  readonly expectedHostname: string;
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
}): AuthAbuseProtection {
  const request = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 3_000;
  const redisEndpoint = new URL(config.redisUrl);
  if (
    redisEndpoint.protocol !== "https:" ||
    redisEndpoint.username ||
    redisEndpoint.password ||
    redisEndpoint.search ||
    redisEndpoint.hash ||
    !safeKeyPart(config.redisToken, 2048) ||
    config.hashSecret.length < 32 ||
    config.hashSecret.length > 512 ||
    !safeKeyPart(config.turnstileSecret, 2048) ||
    !safeKeyPart(config.expectedHostname, 253) ||
    config.expectedHostname !== config.expectedHostname.toLowerCase() ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 100 ||
    timeoutMs > 10_000
  ) {
    throw new Error("Invalid authentication abuse configuration");
  }
  const evaluateCounter = async (
    dimension: "identity" | "network",
    value: string,
    input: AuthAbuseInput,
  ): Promise<CounterResult> => {
    const digest = createHmac("sha256", config.hashSecret)
      .update(`v1\0${input.route}\0${dimension}\0${value}`)
      .digest("hex");
    const response = await request(redisEndpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.redisToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        authAbuseCounterScript,
        "1",
        `vowora:auth:v1:${digest}`,
        String(input.rule.windowSeconds),
        String(input.rule.maximumAttempts),
        dimension,
      ]),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error("Authentication abuse store unavailable");
    const body: unknown = await response.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("result" in body) ||
      !Array.isArray(body.result) ||
      !new Set(["allow", "challenge", "block"]).has(String(body.result[0]))
    ) {
      throw new Error("Authentication abuse store unavailable");
    }
    const retryAfter = Number(body.result[1]);
    if (
      !Number.isSafeInteger(retryAfter) ||
      retryAfter < 0 ||
      retryAfter > 900
    ) {
      throw new Error("Authentication abuse store unavailable");
    }
    return {
      outcome: String(body.result[0]) as CounterResult["outcome"],
      retryAfter,
    };
  };
  const verifyChallenge = async (token: string): Promise<boolean> => {
    if (!safeKeyPart(token, 4096)) return false;
    const form = new FormData();
    form.set("secret", config.turnstileSecret);
    form.set("response", token);
    const response = await request(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form, signal: AbortSignal.timeout(timeoutMs) },
    );
    if (!response.ok) throw new Error("Authentication challenge unavailable");
    const body: unknown = await response.json();
    return Boolean(
      typeof body === "object" &&
      body !== null &&
      "success" in body &&
      body.success === true &&
      "hostname" in body &&
      body.hostname === config.expectedHostname &&
      "action" in body &&
      body.action === "vowora-auth",
    );
  };
  return {
    async evaluate(input) {
      if (
        !safeRule(input.rule) ||
        !safeKeyPart(input.route, 160) ||
        !safeKeyPart(input.identity, 4096) ||
        (input.clientAddress !== undefined && isIP(input.clientAddress) === 0)
      ) {
        throw new Error("Invalid authentication abuse policy");
      }
      const decisions = [
        await evaluateCounter("identity", input.identity, input),
      ];
      if (input.clientAddress) {
        decisions.push(
          await evaluateCounter("network", input.clientAddress, input),
        );
      }
      const blocked = decisions.find((entry) => entry.outcome === "block");
      if (blocked) {
        return { outcome: "block", retryAfter: blocked.retryAfter };
      }
      if (decisions.some((entry) => entry.outcome === "challenge")) {
        return input.challengeToken &&
          (await verifyChallenge(input.challengeToken))
          ? { outcome: "allow" }
          : { outcome: "challenge" };
      }
      return { outcome: "allow" };
    },
  };
}
