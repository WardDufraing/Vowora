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
  mode = "",
) {
  const result = await redisCommand([
    "EVAL",
    authAbuseCounterScript,
    "1",
    key,
    String(windowSeconds),
    String(maximumAttempts),
    dimension,
    ...(mode ? [mode] : []),
  ]);
  if (!Array.isArray(result)) throw new Error("Unexpected Redis test result");
  return { outcome: String(result[0]), retryAfter: Number(result[1]) };
}

const redisDescribe = redisURL ? describe : describe.skip;

async function redisTime(): Promise<number> {
  const clock = await redisCommand(["TIME"]);
  if (!Array.isArray(clock)) throw new Error("Unexpected Redis time");
  return Number(clock[0]);
}

async function hashNumber(key: string, field: string): Promise<number> {
  const value = await redisCommand(["HMGET", key, field]);
  if (!Array.isArray(value)) throw new Error("Unexpected Redis hash");
  return Number(value[0]);
}

redisDescribe("authentication abuse Lua policy", () => {
  it("keeps unsolved identity traffic at a challenge and arms a capped delay only on penalize", async () => {
    const key = `vowora:test:identity:${randomUUID()}`;
    const concurrentKey = `vowora:test:identity:${randomUUID()}`;
    try {
      const unsolved = [];
      for (let attempt = 0; attempt < 30; attempt += 1) {
        unsolved.push(await evaluate(key, "identity"));
      }
      expect(
        unsolved.filter(({ outcome }) => outcome === "allow"),
      ).toHaveLength(5);
      expect(
        unsolved.filter(({ outcome }) => outcome === "challenge"),
      ).toHaveLength(25);
      expect(unsolved.some(({ outcome }) => outcome === "block")).toBe(false);
      expect(unsolved.every(({ retryAfter }) => retryAfter === 0)).toBe(true);
      expect(await hashNumber(key, "strikes")).toBe(0);
      expect(await hashNumber(key, "blocked_until")).toBe(0);

      const concurrent = await Promise.all(
        Array.from({ length: 20 }, () => evaluate(concurrentKey, "identity")),
      );
      expect(
        concurrent.filter(({ outcome }) => outcome === "allow"),
      ).toHaveLength(5);
      expect(concurrent.some(({ outcome }) => outcome === "block")).toBe(false);
      expect(concurrent.every(({ retryAfter }) => retryAfter === 0)).toBe(true);

      const delays: number[] = [];
      for (let step = 0; step < 8; step += 1) {
        const armed = await evaluate(key, "identity", 60, 5, "penalize");
        expect(armed.outcome).toBe("block");
        expect(Number.isInteger(armed.retryAfter)).toBe(true);
        expect(armed.retryAfter).toBeGreaterThan(0);
        expect(armed.retryAfter).toBeLessThanOrEqual(30);
        delays.push(armed.retryAfter);
        const strikes = await hashNumber(key, "strikes");
        const now = await redisTime();
        await redisCommand(["HSET", key, "blocked_until", String(now + 30)]);
        const deadline = await hashNumber(key, "blocked_until");
        const repeat = await evaluate(key, "identity", 60, 5, "penalize");
        const observe = await evaluate(key, "identity");
        expect(repeat.outcome).toBe("block");
        expect(observe.outcome).toBe("block");
        expect(repeat.retryAfter).toBeLessThanOrEqual(30);
        expect(observe.retryAfter).toBeLessThanOrEqual(30);
        expect(await hashNumber(key, "blocked_until")).toBe(deadline);
        expect(await hashNumber(key, "strikes")).toBe(strikes);
        expect(strikes).toBe(Math.min(6, step + 1));
        await redisCommand(["HSET", key, "blocked_until", "0"]);
      }
      expect(delays).toEqual([1, 2, 4, 8, 16, 30, 30, 30]);

      const expiredAt = await redisTime();
      await redisCommand(["HSET", key, "blocked_until", String(expiredAt - 1)]);
      expect(await evaluate(key, "identity")).toEqual({
        outcome: "challenge",
        retryAfter: 0,
      });
      expect(await hashNumber(key, "blocked_until")).toBe(0);
      expect(await hashNumber(key, "strikes")).toBe(6);

      const corruptNow = await redisTime();
      await redisCommand([
        "HSET",
        key,
        "blocked_until",
        String(corruptNow + 10_000),
      ]);
      const repaired = await evaluate(key, "identity");
      expect(repaired).toEqual({ outcome: "challenge", retryAfter: 0 });
      expect(await hashNumber(key, "blocked_until")).toBe(0);

      const ttl = await redisCommand(["TTL", key]);
      expect(Number(ttl)).toBeGreaterThan(86_390);
      expect(Number(ttl)).toBeLessThanOrEqual(86_400);
    } finally {
      await redisCommand(["DEL", key, concurrentKey]);
    }
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
