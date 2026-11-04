import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = new URL("../src/cli.mjs", import.meta.url).pathname;
const fixture = (n) => new URL(`../fixtures/${n}`, import.meta.url).pathname;
const example = (n) => new URL(`../examples/${n}`, import.meta.url).pathname;
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

test("--init prints a config that the generator accepts", () => {
  const r = run("--init");
  assert.equal(r.status, 0);
  const cfg = JSON.parse(r.stdout);
  assert.ok(cfg.business && cfg.dataCollected);
});

test("--out writes the three drafts, the report and the JSON flags", () => {
  const out = mkdtempSync(join(tmpdir(), "cdg-"));
  const r = run("--config", example("acme.json"), "--out", out, "--date", "2026-01-31");
  assert.equal(r.status, 0, r.stderr);
  for (const f of ["privacy-policy.md", "terms-of-service.md", "cookie-policy.md", "REVIEW-FLAGS.md", "review-flags.json"]) {
    assert.ok(existsSync(join(out, f)), f);
  }
  assert.match(readFileSync(join(out, "privacy-policy.md"), "utf8"), /Draft generated on 2026-01-31/);
  assert.match(r.stderr, /flags: \d+ missing/);
});

test("--strict exits 2 when answers are missing and 0 when all are given", () => {
  assert.equal(run("--config", example("acme.json"), "--strict", "--docs", "terms").status, 2);
  assert.equal(run("--config", fixture("complete.json"), "--strict").status, 0);
});

test("--docs limits the output", () => {
  const r = run("--config", fixture("complete.json"), "--docs", "cookies");
  assert.match(r.stdout, /cookie-policy\.md/);
  assert.doesNotMatch(r.stdout, /privacy-policy\.md/);
});

test("bad input fails with a clear message and exit code 1", () => {
  assert.equal(run().status, 1);
  const bad = run("--config", "/nonexistent/file.json");
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /cannot read/);
  assert.equal(run("--config", fixture("complete.json"), "--docs", "imprint").status, 1);
});
