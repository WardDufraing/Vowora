import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url);
const workflowPath = new URL(".github/workflows/agent-policy.yml", root);
const workflow = readFileSync(workflowPath, "utf8");
const policyScript = extractRunScript(workflow);
const branchName = "chore/agent-workflow-policy-frozen-docs-fail-closed";

const scratch = mkdtempSync(join(tmpdir(), "vowora-agent-policy-"));
after(() => {
  rmSync(scratch, { recursive: true, force: true });
});

const gitEnv = cleanGitEnv();

test("workflow job stays policy, unfiltered, and fail-closed", () => {
  assert.match(workflow, /^ {2}policy:\s*$/m);
  assert.doesNotMatch(workflow, /\bif git diff\b/);
  assert.doesNotMatch(workflow, /--depth=/);
  assert.doesNotMatch(workflow, /^\s*paths:/m);
  assert.match(workflow, /HEAD_REF" == dependabot\/\*/);
  assert.match(workflow, /EVENT_NAME" == "pull_request"/);
  assert.match(
    policyScript,
    /git fetch --no-tags --unshallow origin "\$GITHUB_REF"/,
  );
  assert.match(
    policyScript,
    /docs\/product\/Wedding-Platform-Product-Specification\.md/,
  );
  assert.match(policyScript, /docs\/product\/product-architecture\.md/);
  assert.match(policyScript, /docs\/product\/UI-DESIGN-SYSTEM\.md/);
  assert.doesNotMatch(policyScript, /docs\/product\/\*/);
  assert.doesNotMatch(policyScript, /\bif git diff\b/);
});

test("shallow checkout with no frozen change passes", () => {
  const result = runOnCheckout("clean");
  assertPassed(result);
});

test("shallow checkout with a frozen file modified fails", () => {
  const result = runOnCheckout("modified");
  assertFrozenFailure(result, "docs/product/UI-DESIGN-SYSTEM.md");
});

test("a new file under docs/product that is not a frozen document passes", () => {
  const result = runOnCheckout("added");
  assertPassed(result);
});

test("shallow checkout with a frozen file deleted fails", () => {
  const result = runOnCheckout("deleted");
  assertFrozenFailure(result, "docs/product/product-architecture.md");
});

test("shallow checkout with a frozen file renamed out fails", () => {
  const result = runOnCheckout("renamed-out");
  assertFrozenFailure(result, "docs/product/UI-DESIGN-SYSTEM.md");
});

test("a file renamed onto a frozen document fails", () => {
  const result = runOnCheckout("renamed-in");
  assertFrozenFailure(
    result,
    "docs/product/Wedding-Platform-Product-Specification.md",
  );
});

test("a docs/product-extra path outside the frozen directory passes", () => {
  const result = runOnCheckout("near-miss");
  assertPassed(result);
});

test("quoted paths that are not the three frozen documents pass", () => {
  const result = runOnCheckout("quoted");
  assertPassed(result);
});

test("depth-1 main fetch is repaired instead of failing open", () => {
  const destination = mimicCheckout("clean");
  const broken = git(
    destination,
    ["fetch", "--no-tags", "origin", "main", "--depth=1"],
    {
      allowFail: true,
    },
  );
  assert.equal(broken.status, 0, formatResult(broken));
  const probe = spawnSync(
    "bash",
    [
      "--noprofile",
      "--norc",
      "-c",
      "set -euo pipefail; if git diff --name-only origin/main...HEAD | grep -E '^docs/product/'; then echo LEGACY_FROZEN; exit 1; fi; echo LEGACY_FAIL_OPEN",
    ],
    { cwd: destination, encoding: "utf8", env: gitEnv },
  );
  assert.equal(probe.status, 0, formatResult(probe));
  assert.match(probe.stdout, /LEGACY_FAIL_OPEN/);
  assert.match(probe.stderr, /no merge base/);

  const repaired = runPolicy(destination, { GITHUB_REF: fixture().refs.clean });
  assertPassed(repaired);
});

test("full history checkout still passes and still rejects a frozen edit", () => {
  const clean = fullCheckout("clean");
  git(clean, ["update-ref", "-d", "refs/remotes/origin/main"]);
  assertPassed(runPolicy(clean, { GITHUB_REF: fixture().refs.clean }));

  const modified = fullCheckout("modified");
  assertFrozenFailure(
    runPolicy(modified, { GITHUB_REF: fixture().refs.modified }),
    "docs/product/UI-DESIGN-SYSTEM.md",
  );
});

test("unrelated history fails closed", () => {
  const result = runOnCheckout("unrelated");
  assertFailedClosed(result);
  assert.match(result.stdout + result.stderr, /No merge base|failed closed/);
});

test("a git fetch error fails closed", () => {
  const destination = mimicCheckout("clean");
  git(destination, [
    "remote",
    "set-url",
    "origin",
    join(scratch, "missing-origin"),
  ]);
  const result = runPolicy(destination, { GITHUB_REF: fixture().refs.clean });
  assertFailedClosed(result);
  assert.match(result.stdout, /git fetch --unshallow failed/);
});

test("Dependabot without a frozen change passes and the name rule stays skipped", () => {
  const result = runOnCheckout("clean", {
    HEAD_REF: "dependabot/npm_and_yarn/better-auth-1.7.14",
    ACTOR: "dependabot[bot]",
  });
  assertPassed(result);
  assert.match(
    result.stdout,
    /Dependabot pull request; branch-name rule skipped/,
  );
});

test("Dependabot that edits a frozen file still fails", () => {
  const result = runOnCheckout("modified", {
    HEAD_REF: "dependabot/npm_and_yarn/better-auth-1.7.14",
    ACTOR: "dependabot[bot]",
  });
  assertFrozenFailure(result, "docs/product/UI-DESIGN-SYSTEM.md");
});

test("push and workflow_dispatch do not run the frozen check", () => {
  const empty = join(scratch, "not-a-repo");
  mkdirSync(empty);
  for (const eventName of ["push", "workflow_dispatch"]) {
    const result = runPolicy(empty, {
      EVENT_NAME: eventName,
      HEAD_REF: "",
      BASE_REF: "",
      GITHUB_REF: "refs/heads/main",
    });
    assertPassed(result);
  }
});

test("a non-main base and a bad branch name still fail", () => {
  const wrongBase = runPolicy(scratch, { BASE_REF: "develop" });
  assert.notEqual(wrongBase.status, 0, formatResult(wrongBase));
  assert.match(wrongBase.stdout, /PR must target main/);
  assert.doesNotMatch(wrongBase.stdout, /Agent policy checks passed/);

  const badName = runPolicy(scratch, { HEAD_REF: "bad-name" });
  assert.notEqual(badName.status, 0, formatResult(badName));
  assert.match(badName.stdout, /Expected feat\|fix\|chore/);
  assert.doesNotMatch(badName.stdout, /Agent policy checks passed/);
});

function extractRunScript(yaml) {
  const marker = "\n        run: |\n";
  const start = yaml.indexOf(marker);
  assert.notEqual(start, -1, "policy run block missing");
  const lines = yaml.slice(start + marker.length).split("\n");
  const body = [];
  let indent = -1;
  for (const line of lines) {
    if (line.trim() === "") {
      body.push("");
      continue;
    }
    const leading = line.match(/^( *)/)[1].length;
    if (indent === -1) indent = leading;
    if (leading < indent) break;
    body.push(line.slice(indent));
  }
  const script = `${body.join("\n").trim()}\n`;
  assert.match(script, /^set -euo pipefail\n/);
  return script;
}

function cleanGitEnv(overrides = {}) {
  const env = { ...process.env, ...overrides };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_PREFIX",
  ]) {
    delete env[key];
  }
  env.GIT_TERMINAL_PROMPT = "0";
  return env;
}

function git(cwd, args, { allowFail = false } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", env: gitEnv });
  if (!allowFail && result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed\n${formatResult(result)}`);
  }
  return result;
}

function runPolicy(cwd, overrides = {}) {
  return spawnSync("bash", ["--noprofile", "--norc", "-s"], {
    cwd,
    input: policyScript,
    encoding: "utf8",
    env: cleanGitEnv({
      EVENT_NAME: "pull_request",
      BASE_REF: "main",
      HEAD_REF: branchName,
      ACTOR: "tester",
      GITHUB_REF: "refs/pull/0/merge",
      ...overrides,
    }),
  });
}

function assertPassed(result) {
  assert.equal(result.status, 0, formatResult(result));
  assert.match(result.stdout, /Agent policy checks passed/);
}

function assertFailedClosed(result) {
  assert.notEqual(result.status, 0, formatResult(result));
  assert.doesNotMatch(result.stdout, /Agent policy checks passed/);
}

function assertFrozenFailure(result, path) {
  assertFailedClosed(result);
  assert.match(result.stdout, /Frozen product sources changed/);
  assert.match(
    result.stdout,
    new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
}

function formatResult(result) {
  return `status=${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;
}

let cachedFixture;
function fixture() {
  if (!cachedFixture) cachedFixture = buildFixture();
  return cachedFixture;
}

function buildFixture() {
  const source = join(scratch, "source");
  mkdirSync(source);
  git(source, ["init", "-q", "-b", "main"]);
  git(source, ["config", "user.email", "policy-test@example.com"]);
  git(source, ["config", "user.name", "Policy Test"]);
  git(source, ["config", "commit.gpgsign", "false"]);

  writeFiles(source, {
    "README.md": "readme\n",
    "NOTES.md": "notes\n",
    "docs/product/UI-DESIGN-SYSTEM.md": "design\n",
    "docs/product/Wedding-Platform-Product-Specification.md": "spec\n",
    "docs/product/product-architecture.md": "arch\n",
  });
  git(source, ["add", "."]);
  git(source, ["commit", "-q", "-m", "root"]);
  writeFiles(source, { "README.md": "readme\nmain2\n" });
  git(source, ["commit", "-q", "-am", "main2"]);
  const base = git(source, ["rev-parse", "HEAD"]).stdout.trim();
  writeFiles(source, { "README.md": "readme\nmain2\nmain3\n" });
  git(source, ["commit", "-q", "-am", "main3"]);
  const main = git(source, ["rev-parse", "HEAD"]).stdout.trim();

  const branches = {
    clean: () => writeFiles(source, { "CLEAN.txt": "clean\n" }),
    modified: () =>
      writeFiles(source, {
        "docs/product/UI-DESIGN-SYSTEM.md": "design\nchanged\n",
      }),
    added: () => writeFiles(source, { "docs/product/extra.md": "extra\n" }),
    deleted: () =>
      git(source, ["rm", "-q", "docs/product/product-architecture.md"]),
    "renamed-out": () =>
      git(source, [
        "mv",
        "docs/product/UI-DESIGN-SYSTEM.md",
        "docs/relocated-design-system.md",
      ]),
    "renamed-in": () => {
      git(source, [
        "rm",
        "-q",
        "docs/product/Wedding-Platform-Product-Specification.md",
      ]);
      git(source, [
        "mv",
        "NOTES.md",
        "docs/product/Wedding-Platform-Product-Specification.md",
      ]);
    },
    "near-miss": () =>
      writeFiles(source, { "docs/product-extra.md": "not frozen\n" }),
    quoted: () =>
      writeFiles(source, {
        'docs/product/quote"name.md': "quoted\n",
        "docs/product/back\\slash.md": "slash\n",
      }),
  };

  const refs = {};
  let pull = 1;
  for (const [name, change] of Object.entries(branches)) {
    git(source, ["checkout", "-q", "-b", name, base]);
    change();
    git(source, ["add", "-A"]);
    git(source, ["commit", "-q", "-m", name]);
    git(source, ["checkout", "-q", "--detach", main]);
    git(source, ["merge", "--no-ff", "-q", "-m", `Merge ${name}`, name]);
    const merge = git(source, ["rev-parse", "HEAD"]).stdout.trim();
    const ref = `refs/pull/${pull}/merge`;
    git(source, ["update-ref", ref, merge]);
    refs[name] = ref;
    pull += 1;
    git(source, ["checkout", "-q", "main"]);
  }

  git(source, ["checkout", "-q", "--orphan", "unrelated"]);
  git(source, ["rm", "-q", "-rf", "."]);
  writeFiles(source, { "ORPHAN.txt": "one\n" });
  git(source, ["add", "ORPHAN.txt"]);
  git(source, ["commit", "-q", "-m", "orphan1"]);
  writeFiles(source, { "ORPHAN.txt": "one\ntwo\n" });
  git(source, ["commit", "-q", "-am", "orphan2"]);
  const unrelated = git(source, ["rev-parse", "HEAD"]).stdout.trim();
  refs.unrelated = "refs/pull/99/merge";
  git(source, ["update-ref", refs.unrelated, unrelated]);
  git(source, ["checkout", "-q", "main"]);

  const origin = join(scratch, "origin.git");
  git(source, ["clone", "--bare", "-q", source, origin]);
  for (const ref of Object.values(refs)) {
    const sha = git(source, ["rev-parse", ref]).stdout.trim();
    git(origin, ["update-ref", ref, sha]);
  }
  git(origin, ["config", "uploadpack.allowReachableSHA1InWant", "true"]);
  return { origin: `file://${origin}`, refs };
}

function writeFiles(directory, files) {
  for (const [relative, contents] of Object.entries(files)) {
    const path = join(directory, relative);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, contents);
  }
}

function mimicCheckout(name) {
  const { origin, refs } = fixture();
  const destination = mkdtempSync(join(scratch, "shallow-"));
  git(destination, ["init", "-q"]);
  git(destination, ["remote", "add", "origin", origin]);
  const sha = git(join(scratch, "origin.git"), [
    "rev-parse",
    refs[name],
  ]).stdout.trim();
  git(destination, ["fetch", "-q", "--no-tags", "--depth", "1", "origin", sha]);
  git(destination, ["checkout", "-q", "--detach", "FETCH_HEAD"]);
  assert.equal(
    git(destination, ["rev-parse", "--is-shallow-repository"]).stdout.trim(),
    "true",
  );
  return destination;
}

function fullCheckout(name) {
  const { origin, refs } = fixture();
  const destination = mkdtempSync(join(scratch, "full-"));
  git(destination, ["clone", "-q", origin, destination]);
  git(destination, [
    "fetch",
    "-q",
    "--no-tags",
    "origin",
    `${refs[name]}:${refs[name]}`,
  ]);
  git(destination, ["checkout", "-q", "--detach", refs[name]]);
  assert.equal(
    git(destination, ["rev-parse", "--is-shallow-repository"]).stdout.trim(),
    "false",
  );
  return destination;
}

function runOnCheckout(name, overrides = {}) {
  const destination = mimicCheckout(name);
  return runPolicy(destination, {
    GITHUB_REF: fixture().refs[name],
    ...overrides,
  });
}
