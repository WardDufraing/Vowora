import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

test(
  "production app serves only an honest noindex foundation and no API/auth routes",
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
      for (const path of ["/api/v1", "/login", "/signup"]) {
        assert.equal(
          (await fetch("http://127.0.0.1:3101" + path)).status,
          404,
          path,
        );
      }
    } finally {
      server.kill("SIGTERM");
      if (server.exitCode === null)
        await new Promise((resolve) => server.once("exit", resolve));
    }
  },
);
