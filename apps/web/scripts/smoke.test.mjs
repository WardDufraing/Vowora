import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

test(
  "production app serves its noindex foundation and versioned public API",
  { timeout: 60000 },
  async () => {
    // Own process only; never reuse an unrelated service or stop a user process.
    const server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3101",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let log = "";
    server.stdout.on("data", (d) => (log += d));
    server.stderr.on("data", (d) => (log += d));
    try {
      let ready = false;
      for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw new Error(log);
        try {
          const response = await fetch("http://127.0.0.1:3101");
          if (response.ok) {
            ready = true;
            break;
          }
        } catch {}
        await setTimeout(200);
      }
      assert(ready, log);
      const response = await fetch("http://127.0.0.1:3101");
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /<html lang="en"/);
      assert.match(html, /<h1>The application is in development\.<\/h1>/);
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert.equal(response.headers.get("x-powered-by"), null);
      assert.match(
        await (await fetch("http://127.0.0.1:3101/robots.txt")).text(),
        /Disallow: \//,
      );
      for (const path of ["/login", "/signup"]) {
        assert.equal(
          (await fetch("http://127.0.0.1:3101" + path)).status,
          404,
          path,
        );
      }

      const suppliedCorrelationId = "6f4f8aa8-9cb8-46d7-92f7-d70156ab40d2";
      const root = await fetch("http://127.0.0.1:3101/api/v1", {
        headers: { "x-correlation-id": suppliedCorrelationId },
      });
      assert.equal(root.status, 200);
      assert.match(root.headers.get("content-type") ?? "", /application\/json/);
      assert.equal(root.headers.get("cache-control"), "no-store");
      assert.equal(root.headers.get("x-correlation-id"), suppliedCorrelationId);
      assert.deepEqual(await root.json(), {
        data: {
          name: "Vowora API",
          version: "v1",
          status: "ok",
          links: { health: "/api/v1/health" },
        },
        meta: { correlationId: suppliedCorrelationId },
      });

      const health = await fetch("http://127.0.0.1:3101/api/v1/health");
      assert.equal(health.status, 200);
      const healthBody = await health.json();
      assert.deepEqual(healthBody.data, {
        service: "vowora-api",
        version: "v1",
        status: "ok",
      });
      assert.match(healthBody.meta.correlationId, /^[0-9a-f-]{36}$/);
      assert.equal(
        health.headers.get("x-correlation-id"),
        healthBody.meta.correlationId,
      );

      const invalidCorrelation = "private-value-that-must-not-be-reflected";
      const missing = await fetch(
        "http://127.0.0.1:3101/api/v1/not-a-resource",
        { headers: { "x-correlation-id": invalidCorrelation } },
      );
      assert.equal(missing.status, 404);
      assert.equal(
        missing.headers.get("content-type"),
        "application/problem+json",
      );
      const missingBody = await missing.json();
      assert.deepEqual(
        {
          title: missingBody.title,
          status: missingBody.status,
          detail: missingBody.detail,
          instance: missingBody.instance,
          code: missingBody.code,
        },
        {
          title: "Resource not found",
          status: 404,
          detail: "The requested API resource does not exist.",
          instance: "/api/v1/not-a-resource",
          code: "RESOURCE_NOT_FOUND",
        },
      );
      assert.notEqual(missingBody.correlationId, invalidCorrelation);

      const method = await fetch("http://127.0.0.1:3101/api/v1/health", {
        method: "POST",
      });
      assert.equal(method.status, 405);
      assert.equal(method.headers.get("allow"), "GET");
      assert.equal(
        method.headers.get("content-type"),
        "application/problem+json",
      );
      assert.equal((await method.json()).code, "METHOD_NOT_ALLOWED");
    } finally {
      server.kill("SIGTERM");
      if (server.exitCode === null)
        await new Promise((resolve) => server.once("exit", resolve));
    }
  },
);
