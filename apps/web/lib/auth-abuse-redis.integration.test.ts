import { randomUUID } from "node:crypto";
import { createConnection } from "node:net";

import { describe, expect, it } from "vitest";

import { authAbuseCounterScript } from "./auth-abuse";

class IncompleteRedisResponse extends Error {}

type RedisValue = string | number | RedisValue[] | null;

function parseRedisResponse(input: string, start = 0): [RedisValue, number] {
  const lineEnd = input.indexOf("\r\n", start);
  if (lineEnd < 0) throw new IncompleteRedisResponse();
  const type = input[start];
  const value = input.slice(start + 1, lineEnd);
  if (type === "+") return [value, lineEnd + 2];
  if (type === "-") throw new Error(`Redis command failed: ${value}`);
  if (type === ":") return [Number(value), lineEnd + 2];
  if (type === "$") {
    const length = Number(value);
    if (length === -1) return [null, lineEnd + 2];
    const bodyStart = lineEnd + 2;
    const bodyEnd = bodyStart + length;
    if (input.length < bodyEnd + 2) throw new IncompleteRedisResponse();
    return [input.slice(bodyStart, bodyEnd), bodyEnd + 2];
  }
  if (type === "*") {
    const length = Number(value);
    const result: RedisValue[] = [];
    let offset = lineEnd + 2;
    for (let index = 0; index < length; index += 1) {
      const [entry, next] = parseRedisResponse(input, offset);
      result.push(entry);
      offset = next;
    }
    return [result, offset];
  }
  throw new Error("Unsupported Redis response");
}

const configuredURL = process.env.AUTH_ABUSE_REDIS_URL;
const redisURL = configuredURL ? new URL(configuredURL) : undefined;
if (
  redisURL &&
  (redisURL.protocol !== "redis:" ||
    !["127.0.0.1", "::1", "localhost"].includes(redisURL.hostname) ||
    redisURL.username ||
    redisURL.password ||
    (redisURL.pathname !== "" && redisURL.pathname !== "/"))
) {
  throw new Error(
    "AUTH_ABUSE_REDIS_URL must be a credential-free loopback test URL",
  );
}

function redisCommand(parts: readonly string[]): Promise<RedisValue> {
  if (!redisURL) throw new Error("AUTH_ABUSE_REDIS_URL is required");
  const command = `*${parts.length}\r\n${parts
    .map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`)
    .join("")}`;
  return new Promise((resolve, reject) => {
    const socket = createConnection({
      host: redisURL.hostname,
      port: Number(redisURL.port || 6379),
    });
    let response = "";
    const fail = (error: Error) => {
      socket.destroy();
      reject(error);
    };
    socket.setTimeout(5_000, () => fail(new Error("Redis test timed out")));
    socket.on("error", fail);
    socket.on("connect", () => socket.write(command));
    socket.on("data", (chunk: Buffer) => {
      response += chunk.toString("utf8");
      try {
        const [value] = parseRedisResponse(response);
        socket.destroy();
        resolve(value);
      } catch (error) {
        if (!(error instanceof IncompleteRedisResponse)) fail(error as Error);
      }
    });
  });
}

async function evaluate(
  key: string,
  dimension: "identity" | "network",
  windowSeconds = 60,
  maximumAttempts = 5,
) {
  const result = await redisCommand([
    "EVAL",
    authAbuseCounterScript,
    "1",
    key,
    String(windowSeconds),
    String(maximumAttempts),
    dimension,
  ]);
  if (!Array.isArray(result)) throw new Error("Unexpected Redis test result");
  return { outcome: String(result[0]), retryAfter: Number(result[1]) };
}

const redisDescribe = redisURL ? describe : describe.skip;

redisDescribe("authentication abuse Lua policy", () => {
  it("keeps an attacked identity solvable instead of creating a victim lockout", async () => {
    const key = `vowora:test:identity:${randomUUID()}`;
    const sequential = [];
    for (let attempt = 0; attempt < 20; attempt += 1) {
      sequential.push(await evaluate(key, "identity"));
    }
    expect(
      sequential.filter(({ outcome }) => outcome === "allow"),
    ).toHaveLength(5);
    expect(
      sequential.filter(({ outcome }) => outcome === "challenge"),
    ).toHaveLength(15);
    expect(sequential.some(({ outcome }) => outcome === "block")).toBe(false);

    const concurrentKey = `vowora:test:identity:${randomUUID()}`;
    const concurrent = await Promise.all(
      Array.from({ length: 20 }, () => evaluate(concurrentKey, "identity")),
    );
    expect(
      concurrent.filter(({ outcome }) => outcome === "allow"),
    ).toHaveLength(5);
    expect(
      concurrent.filter(({ outcome }) => outcome === "challenge"),
    ).toHaveLength(15);
    expect(concurrent.some(({ outcome }) => outcome === "block")).toBe(false);
    await redisCommand(["DEL", key, concurrentKey]);
  });

  it("atomically challenges then progressively blocks only a trusted network", async () => {
    const key = `vowora:test:network:${randomUUID()}`;
    const concurrent = await Promise.all(
      Array.from({ length: 20 }, () => evaluate(key, "network")),
    );
    expect(
      concurrent.filter(({ outcome }) => outcome === "allow"),
    ).toHaveLength(5);
    expect(
      concurrent.filter(({ outcome }) => outcome === "challenge"),
    ).toHaveLength(2);
    expect(
      concurrent.filter(({ outcome }) => outcome === "block"),
    ).toHaveLength(13);
    expect(
      concurrent.find(({ outcome }) => outcome === "block")?.retryAfter,
    ).toBe(60);

    const progressiveKey = `vowora:test:network:${randomUUID()}`;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await evaluate(progressiveKey, "network", 2);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_100));
    let secondBlock;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      secondBlock = await evaluate(progressiveKey, "network", 2);
    }
    expect(secondBlock).toEqual({ outcome: "block", retryAfter: 4 });
    const ttl = await redisCommand(["TTL", progressiveKey]);
    expect(ttl).toEqual(expect.any(Number));
    expect(Number(ttl)).toBeGreaterThan(86_390);
    expect(Number(ttl)).toBeLessThanOrEqual(86_400);
    await redisCommand(["DEL", key, progressiveKey]);
  });
});
