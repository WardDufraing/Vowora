import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { problemDetailsSchema } from "@vowora/contracts";

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
      for (const [path, content] of [
        ["/sign-in", "<h1>Sign in</h1>"],
        ["/sign-up", "<h1>Create your account</h1>"],
        ["/verify-email", "<h1>Verify your email</h1>"],
      ]) {
        const accountPage = await fetch("http://127.0.0.1:3101" + path);
        assert.equal(accountPage.status, 200, path);
        assert.match(await accountPage.text(), new RegExp(content));
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
          links: {
            auth: "/api/v1/auth/get-session",
            health: "/api/v1/health",
            openapi: "/api/v1/openapi.json",
          },
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
      assert.doesNotThrow(() => problemDetailsSchema.parse(missingBody));
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
      assert.equal(method.headers.get("allow"), "GET, HEAD, OPTIONS");
      assert.equal(
        method.headers.get("content-type"),
        "application/problem+json",
      );
      const methodBody = await method.json();
      assert.equal(methodBody.code, "METHOD_NOT_ALLOWED");
      assert.doesNotThrow(() => problemDetailsSchema.parse(methodBody));

      const head = await fetch("http://127.0.0.1:3101/api/v1/health", {
        method: "HEAD",
      });
      assert.equal(head.status, 200);
      assert.equal(await head.text(), "");
      const options = await fetch("http://127.0.0.1:3101/api/v1/health", {
        method: "OPTIONS",
      });
      assert.equal(options.status, 204);
      assert.equal(options.headers.get("allow"), "GET, HEAD, OPTIONS");

      const specification = await fetch(
        "http://127.0.0.1:3101/api/v1/openapi.json",
      );
      assert.equal(specification.status, 200);
      assert.match(
        specification.headers.get("content-type") ?? "",
        /application\/json/,
      );
      const specificationBody = await specification.json();
      assert.equal(specificationBody.openapi, "3.1.0");
      assert.deepEqual(Object.keys(specificationBody.paths), [
        "/api/v1",
        "/api/v1/health",
        "/api/v1/openapi.json",
        "/api/v1/auth/sign-up/email",
        "/api/v1/auth/sign-in/email",
        "/api/v1/auth/send-verification-email",
        "/api/v1/auth/verify-email",
        "/api/v1/auth/get-session",
        "/api/v1/{path}",
      ]);
      assert.deepEqual(
        specificationBody.paths["/api/v1/{path}"].get.responses["404"],
        { $ref: "#/components/responses/ResourceNotFound" },
      );
      assert.deepEqual(
        specificationBody.paths["/api/v1/health"].post.responses["405"],
        { $ref: "#/components/responses/MethodNotAllowed" },
      );
      assert.deepEqual(
        specificationBody.paths["/api/v1/openapi.json"].post.responses["405"],
        { $ref: "#/components/responses/MethodNotAllowed" },
      );
      for (const component of ["ResourceNotFound", "MethodNotAllowed"]) {
        assert.deepEqual(
          specificationBody.components.responses[component].content[
            "application/problem+json"
          ].schema,
          { $ref: "#/components/schemas/ProblemDetails" },
        );
      }

      const specificationMethod = await fetch(
        "http://127.0.0.1:3101/api/v1/openapi.json",
        { method: "POST" },
      );
      assert.equal(specificationMethod.status, 405);
      assert.equal(
        specificationMethod.headers.get("content-type"),
        "application/problem+json",
      );
      const specificationMethodBody = await specificationMethod.json();
      assert.equal(specificationMethodBody.code, "METHOD_NOT_ALLOWED");
      assert.doesNotThrow(() =>
        problemDetailsSchema.parse(specificationMethodBody),
      );
    } finally {
      server.kill("SIGTERM");
      if (server.exitCode === null)
        await new Promise((resolve) => server.once("exit", resolve));
    }
  },
);
