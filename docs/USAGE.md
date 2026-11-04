# Usage

Compliance Doc Generator turns a JSON file of facts about a business into three draft documents: a privacy policy, terms of service, and a cookie policy. Wherever an answer is missing, uncertain, or needs a human decision, the draft says so in the text and in a separate review report.

**These are drafts, not legal advice.** The text is generic and aimed at a GDPR-style, EU-generic setting. It does not know your jurisdiction, your sector, or your facts. Have a qualified professional review the result before you publish it.

## Install

Requires Node 20 or newer. There are no dependencies.

```bash
git clone https://github.com/Kim-Like/compliance-doc-generator.git
cd compliance-doc-generator
npm test
```

Run the CLI directly with `node src/cli.mjs`, or link it (`npm link`) to get the `compliance-doc-generator` command. The examples below use the command name.

## Run

```bash
compliance-doc-generator --init > business.json     # starter config, edit it
compliance-doc-generator --config business.json --out ./drafts
```

Options:

| Option | Meaning |
| --- | --- |
| `--config <file>` | JSON file with the business inputs (required unless `--init`) |
| `--out <dir>` | Write the drafts, `REVIEW-FLAGS.md` and `review-flags.json` here. Without it, everything prints to stdout |
| `--docs <list>` | Comma-separated subset of `privacy,terms,cookies` |
| `--date <YYYY-MM-DD>` | Date printed on the drafts. Default is today. Use it for reproducible output |
| `--strict` | Exit with code 2 if any answer is missing or uncertain |
| `--init` | Print a starter config and exit |

Exit codes: 0 success, 1 bad input or usage, 2 `--strict` and at least one open answer. The flag counts are printed on stderr.

## The config file

Top-level keys: `business`, `dpo`, `audience`, `dataCollected`, `otherSources`, `processors`, `transfers`, `automatedDecisions`, `automatedDecisionsDescription`, `cookies`, `cookiesDeclaredNone`, `consent`, `terms`. Unknown top-level keys produce a warning, so a typo does not go unnoticed. `--init` prints every field with a placeholder value.

Three ways to answer a question:

- Give the value. The draft uses it.
- Leave it out, set it to `null`, an empty string, an empty list, or write `TBD`, `unknown` or `?`. The draft prints `[REVIEW NEEDED: ...]` there.
- Say you are not sure: `{ "value": "privacy@example.com", "unsure": true }`. The draft uses the value and adds `[CONFIRM: ...]`.

Yes/no answers (`dpo.appointed`, `transfers.outsideEea`, `automatedDecisions`, `terms.hasAccounts`, and so on) must be real `true` or `false`. `null` means "I do not know" and is flagged.

## What the flags mean

| Marker | Kind | Meaning |
| --- | --- | --- |
| `[REVIEW NEEDED: ...]` | missing | No answer was given. The draft has a gap |
| `[CONFIRM: ...]` | uncertain | You answered but marked it unsure, or the answer is not a value the generator knows (for example an unrecognised lawful basis) |
| `[CHECK: ...]` | check | The draft made a default choice or a statement that a person has to own, such as "we do not sell personal data" |

`--strict` only counts missing and uncertain. Checks always remain, because the generator cannot know whether the default is true for you.

## Example output

Input: `examples/acme.json`, which is deliberately incomplete.

```
$ compliance-doc-generator --config examples/acme.json --out ./drafts --date 2026-11-04
wrote privacy-policy.md, terms-of-service.md, cookie-policy.md, REVIEW-FLAGS.md, review-flags.json to ./drafts
flags: 12 missing, 1 uncertain, 11 to check. Not legal advice; have the drafts reviewed.
```

From `drafts/privacy-policy.md`:

```
## Transfers outside the European Economic Area

[REVIEW NEEDED: whether personal data is sent or made accessible outside the European Economic Area]
```

From `drafts/cookie-policy.md`:

```
Strictly necessary cookies are used to make the site work and do not need your consent. For everything else we ask first. [REVIEW NEEDED: how visitors give and withdraw consent for non-essential cookies (for example a banner and a settings link in the footer)]
```

From `drafts/REVIEW-FLAGS.md`:

```
- Missing answers: 12 (the draft has a placeholder where the answer should be)
- Uncertain answers: 1 (you marked the answer as unsure)
- Judgement checks: 11 (the draft made a default choice that a person must own)
```

Gating a pipeline on it:

```
$ compliance-doc-generator --config examples/acme.json --docs terms --strict > /dev/null
flags: 4 missing, 0 uncertain, 3 to check. Not legal advice; have the drafts reviewed.
$ echo $?
2
```

## Use as a library

```js
import { generate, openFlagCount } from "./src/index.mjs";

const result = generate(config, { docs: ["privacy"], date: "2026-11-04" });
result.documents.privacy.markdown;  // the draft
result.flags;                       // [{ doc, kind, field, message, marker }]
openFlagCount(result.flags);        // missing + uncertain
```

## What the generator does not do

- It does not decide your lawful basis, your retention periods, your liability cap, your governing law or your refund terms. If you leave them out, it says so.
- It does not scan your site for cookies. You list them. The generator asks you to verify a "no cookies" claim with a real scan.
- It does not name or interpret any specific national law. Text about rights and transfers is the widely known general shape and may not match your country.
- It does not produce HTML or other languages. Output is Markdown in English.

## When NOT to use this

- When you need a document you can publish without a lawyer. This tool cannot give you that, by design.
- When your situation is unusual or high risk: health data, children as the main audience, large-scale tracking, financial services, regulated sectors. Start from professional advice instead.
- When you would use the output to feel finished. The value of the tool is the list of open questions. If you strip the markers and publish, you have lost the point and taken on the risk.
- When you have no one who can answer the questions. A draft full of placeholders is a to-do list, not a policy.
