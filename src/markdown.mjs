export function cell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

export function table(headers, rows) {
  const head = `| ${headers.map(cell).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(cell).join(" | ")} |`);
  return [head, sep, ...body].join("\n");
}

export function banner(title, date) {
  return [
    `# ${title}`,
    "",
    "> **DRAFT. Not legal advice.** This text was generated from the answers in a configuration file.",
    "> It has not been reviewed by a lawyer and it does not know your situation. Every marker of the form",
    "> `[REVIEW NEEDED: ...]`, `[CONFIRM: ...]` or `[CHECK: ...]` is a place where an answer was missing,",
    "> uncertain, or needs a person to decide. Resolve all of them, and have a qualified professional review",
    "> the result, before you publish it. Remove this notice only after that.",
    ">",
    `> Draft generated on ${date}.`,
  ].join("\n");
}
