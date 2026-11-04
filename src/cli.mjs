#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generate, openFlagCount, unknownKeys, DOCUMENTS } from "./index.mjs";
import { TEMPLATE } from "./template.mjs";

const HELP = `compliance-doc-generator: draft privacy, terms and cookie documents with review flags.
Drafts only. Not legal advice.

Usage:
  compliance-doc-generator --init                         print a starter config to stdout
  compliance-doc-generator --config business.json --out ./drafts [options]

Options:
  --config <file>   JSON file with the business inputs
  --out <dir>       directory to write the drafts and REVIEW-FLAGS.md into (default: print to stdout)
  --docs <list>     comma-separated: privacy,terms,cookies (default: all three)
  --date <date>     date to print on the drafts, YYYY-MM-DD (default: today)
  --strict          exit with code 2 if any answer is missing or uncertain
  --init            print a starter config and exit
  --help            show this text
`;

function fail(message, code = 1) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(code);
}

let args;
try {
  args = parseArgs({
    options: {
      config: { type: "string" },
      out: { type: "string" },
      docs: { type: "string" },
      date: { type: "string" },
      strict: { type: "boolean", default: false },
      init: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  }).values;
} catch (e) {
  fail(e.message);
}

if (args.help) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (args.init) {
  process.stdout.write(JSON.stringify(TEMPLATE, null, 2) + "\n");
  process.exit(0);
}
if (!args.config) fail("missing --config <file> (run with --help, or --init for a starter file)");

let config;
try {
  config = JSON.parse(readFileSync(args.config, "utf8"));
} catch (e) {
  fail(`cannot read ${args.config}: ${e.message}`);
}
if (config === null || typeof config !== "object" || Array.isArray(config)) fail("config must be a JSON object");

const typos = unknownKeys(config);
if (typos.length) process.stderr.write(`warning: ignoring unknown top-level keys: ${typos.join(", ")}\n`);

const docs = args.docs ? args.docs.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
if (docs) for (const d of docs) if (!DOCUMENTS[d]) fail(`unknown document "${d}"; choose from ${Object.keys(DOCUMENTS).join(", ")}`);
if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) fail("--date must look like 2026-01-31");

const result = generate(config, { docs, date: args.date });
const open = openFlagCount(result.flags);

if (args.out) {
  mkdirSync(args.out, { recursive: true });
  const written = [];
  for (const d of Object.values(result.documents)) {
    writeFileSync(join(args.out, d.fileName), d.markdown);
    written.push(d.fileName);
  }
  writeFileSync(join(args.out, "REVIEW-FLAGS.md"), result.report);
  writeFileSync(join(args.out, "review-flags.json"), JSON.stringify(result.flags, null, 2) + "\n");
  written.push("REVIEW-FLAGS.md", "review-flags.json");
  process.stdout.write(`wrote ${written.join(", ")} to ${args.out}\n`);
} else {
  for (const d of Object.values(result.documents)) process.stdout.write(`<!-- ${d.fileName} -->\n${d.markdown}\n`);
  process.stdout.write(`<!-- REVIEW-FLAGS.md -->\n${result.report}`);
}

const counts = { missing: 0, uncertain: 0, check: 0 };
for (const f of result.flags) counts[f.kind] += 1;
process.stderr.write(`flags: ${counts.missing} missing, ${counts.uncertain} uncertain, ${counts.check} to check. Not legal advice; have the drafts reviewed.\n`);
if (args.strict && open > 0) process.exit(2);
