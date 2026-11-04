import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generate, openFlagCount, unknownKeys } from "../src/index.mjs";
import { isBlank } from "../src/context.mjs";

const load = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
const DATE = "2026-01-31";

test("isBlank treats placeholders and empties as blank", () => {
  for (const v of [undefined, null, "", "  ", "TBD", "unknown", "?", []]) assert.equal(isBlank(v), true, String(v));
  for (const v of ["x", 0, false, ["a"]]) assert.equal(isBlank(v), false, String(v));
});

test("an empty config still yields all three drafts, each loudly flagged", () => {
  const r = generate({}, { date: DATE });
  assert.deepEqual(Object.keys(r.documents).sort(), ["cookies", "privacy", "terms"]);
  for (const { markdown } of Object.values(r.documents)) {
    assert.match(markdown, /DRAFT\. Not legal advice\./);
    assert.match(markdown, /\[REVIEW NEEDED: /);
  }
  assert.ok(openFlagCount(r.flags) >= 10);
});

test("a fully answered config leaves no missing or uncertain answers", () => {
  const r = generate(load("complete.json"), { date: DATE });
  assert.equal(openFlagCount(r.flags), 0, JSON.stringify(r.flags.filter((f) => f.kind !== "check")));
  for (const { markdown } of Object.values(r.documents)) {
    assert.doesNotMatch(markdown, /\[REVIEW NEEDED: (?!\.\.\.)/);
    assert.doesNotMatch(markdown, /\[CONFIRM: (?!\.\.\.)/);
  }
});

test("judgement calls stay flagged even when everything is answered", () => {
  const r = generate(load("complete.json"), { date: DATE });
  assert.ok(r.flags.some((f) => f.kind === "check" && f.field === "terms.liability"));
  assert.match(r.documents.terms.markdown, /\[CHECK: /);
  assert.match(r.report, /Judgement checks: \d+/);
});

test("the banner says not legal advice on every document and the report", () => {
  const r = generate(load("complete.json"), { date: DATE });
  for (const { markdown } of Object.values(r.documents)) assert.match(markdown, /Not legal advice/);
  assert.match(r.report, /Not legal advice/);
});

test("an unsure answer keeps its value but gets a CONFIRM marker and an uncertain flag", () => {
  const cfg = load("complete.json");
  cfg.business.contactEmail = { value: "privacy@example.com", unsure: true };
  const r = generate(cfg, { docs: ["privacy"], date: DATE });
  assert.match(r.documents.privacy.markdown, /privacy@example\.com \[CONFIRM: /);
  assert.ok(r.flags.some((f) => f.kind === "uncertain" && f.field === "business.contactEmail"));
});

test("an unknown lawful basis is flagged as uncertain instead of passed through quietly", () => {
  const cfg = load("complete.json");
  cfg.dataCollected[0].lawfulBasis = "because we want to";
  const r = generate(cfg, { docs: ["privacy"], date: DATE });
  assert.ok(r.flags.some((f) => f.kind === "uncertain" && f.field === "dataCollected.0.lawfulBasis"));
});

test("legitimate interests and consent produce judgement checks", () => {
  const cfg = load("complete.json");
  cfg.dataCollected.push(
    { category: "Mailing list", examples: ["email"], purpose: "Newsletter", lawfulBasis: "consent", retention: "Until unsubscribed" },
    { category: "Fraud checks", examples: ["IP-derived region"], purpose: "Stop abuse", lawfulBasis: "legitimate-interests", retention: "90 days" },
  );
  const r = generate(cfg, { docs: ["privacy"], date: DATE });
  const checks = r.flags.filter((f) => f.kind === "check").map((f) => f.field);
  assert.ok(checks.includes("dataCollected.1.lawfulBasis"));
  assert.ok(checks.includes("dataCollected.2.lawfulBasis"));
});

test("no cookies listed and no declaration is a missing answer, not a claim", () => {
  const cfg = load("complete.json");
  delete cfg.cookies;
  const r = generate(cfg, { docs: ["cookies"], date: DATE });
  assert.ok(r.flags.some((f) => f.kind === "missing" && f.field === "cookies"));
  assert.doesNotMatch(r.documents.cookies.markdown, /do not set cookies/);
});

test("declaring no cookies is allowed but still asks for a real scan", () => {
  const cfg = load("complete.json");
  delete cfg.cookies;
  cfg.cookiesDeclaredNone = true;
  const r = generate(cfg, { docs: ["cookies"], date: DATE });
  assert.match(r.documents.cookies.markdown, /do not set cookies/);
  assert.ok(r.flags.some((f) => f.kind === "check" && f.field === "cookiesDeclaredNone"));
});

test("non-essential cookies need a described consent mechanism", () => {
  const cfg = load("complete.json");
  delete cfg.consent;
  const r = generate(cfg, { docs: ["cookies"], date: DATE });
  assert.ok(r.flags.some((f) => f.kind === "missing" && f.field === "consent.mechanism"));
});

test("an unknown cookie category is flagged and filed under Other", () => {
  const cfg = load("complete.json");
  cfg.cookies[1].category = "tracking-ish";
  const r = generate(cfg, { docs: ["cookies"], date: DATE });
  assert.ok(r.flags.some((f) => f.kind === "uncertain" && f.field === "cookies.1.category"));
  assert.match(r.documents.cookies.markdown, /### Other/);
});

test("table cells cannot be broken by pipes or newlines in answers", () => {
  const cfg = load("complete.json");
  cfg.dataCollected[0].purpose = "a | b\nc";
  const r = generate(cfg, { docs: ["privacy"], date: DATE });
  assert.match(r.documents.privacy.markdown, /a \\\| b c/);
});

test("output is deterministic for the same input and date", () => {
  const a = generate(load("complete.json"), { date: DATE });
  const b = generate(load("complete.json"), { date: DATE });
  assert.deepEqual(a, b);
});

test("asking for an unknown document throws", () => {
  assert.throws(() => generate({}, { docs: ["imprint"] }), /unknown document "imprint"/);
});

test("unknownKeys catches typos in top-level keys", () => {
  assert.deepEqual(unknownKeys({ business: {}, proccessors: [] }), ["proccessors"]);
});

test("no generated text contains an en dash or em dash", () => {
  const r = generate(load("complete.json"), { date: DATE });
  const all = Object.values(r.documents).map((d) => d.markdown).join("\n") + r.report;
  assert.doesNotMatch(all, /[\u2013\u2014]/);
});
