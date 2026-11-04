import { createContext } from "./context.mjs";
import { table } from "./markdown.mjs";
import * as privacy from "./documents/privacy.mjs";
import * as terms from "./documents/terms.mjs";
import * as cookies from "./documents/cookies.mjs";

export const DOCUMENTS = { privacy, terms, cookies };

export const KNOWN_TOP_LEVEL_KEYS = [
  "business", "dpo", "audience", "dataCollected", "otherSources", "processors", "transfers",
  "automatedDecisions", "automatedDecisionsDescription", "cookies", "cookiesDeclaredNone",
  "consent", "terms",
];

export function unknownKeys(config) {
  return Object.keys(config).filter((k) => !KNOWN_TOP_LEVEL_KEYS.includes(k));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function reviewReport(flags, date) {
  const counts = { missing: 0, uncertain: 0, check: 0 };
  for (const f of flags) counts[f.kind] += 1;
  const lines = [
    "# Review flags",
    "",
    "> **Not legal advice.** These drafts need a human decision at every item below, and a review by a qualified professional before publication.",
    "",
    `Generated on ${date}.`,
    "",
    `- Missing answers: ${counts.missing} (the draft has a placeholder where the answer should be)`,
    `- Uncertain answers: ${counts.uncertain} (you marked the answer as unsure)`,
    `- Judgement checks: ${counts.check} (the draft made a default choice that a person must own)`,
    "",
  ];
  if (flags.length === 0) {
    lines.push("No flags were raised. That does not mean the drafts are correct, only that every question had an answer.");
  } else {
    lines.push(table(["Document", "Kind", "Field", "What to do"], flags.map((f) => [f.doc, f.kind, f.field, f.message])));
  }
  return lines.join("\n") + "\n";
}

// config: parsed business inputs. options: { docs: ["privacy","terms","cookies"], date }
export function generate(config, options = {}) {
  const docs = options.docs && options.docs.length ? options.docs : Object.keys(DOCUMENTS);
  const date = options.date || today();
  const documents = {};
  const flags = [];
  for (const id of docs) {
    const mod = DOCUMENTS[id];
    if (!mod) throw new Error(`unknown document "${id}"; choose from ${Object.keys(DOCUMENTS).join(", ")}`);
    const ctx = createContext(config, id);
    documents[id] = { fileName: mod.fileName, markdown: mod.render(ctx, date) };
    flags.push(...ctx.flags);
  }
  return { documents, flags, report: reviewReport(flags, date) };
}

export function openFlagCount(flags) {
  return flags.filter((f) => f.kind === "missing" || f.kind === "uncertain").length;
}
