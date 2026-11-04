# Compliance Doc Generator

Small sites often have the same last-week scramble before launch. Someone pastes a privacy policy from another company, changes the name, and ships it. Nobody notices that it names a mail provider the site does not use, or says nothing about the analytics script that is actually running. The text looks finished, so nobody asks the questions behind it.

I wrote this tool to flip that. You describe the business in one JSON file: who is behind the site, what personal data you collect and why, which providers touch it, which cookies you set, how you charge and refund. It writes a draft privacy policy, terms of service and cookie policy from those answers. Where an answer is missing, the draft does not guess. It prints `[REVIEW NEEDED: ...]` in the text and lists the gap in a separate review report. Answers you are unsure about get `[CONFIRM: ...]`. Defaults that someone has to own, like "we do not sell personal data", get `[CHECK: ...]`. With `--strict` the command exits non-zero while any answer is missing or uncertain, so you can stop a launch on it.

This is not legal advice and the drafts say so at the top. The text is generic and written for a GDPR-style, EU-generic setting. It does not know your country, your sector or your risks, and it will not tell you your lawful basis or your liability cap. What it gives you is a list of open questions, in the places they matter, before the site goes live. A lawyer should still read the result.

Quick start:

```bash
git clone https://github.com/Kim-Like/compliance-doc-generator.git && cd compliance-doc-generator
node src/cli.mjs --init > business.json
node src/cli.mjs --config business.json --out ./drafts
```

Then open `drafts/REVIEW-FLAGS.md` first. Node 20 or newer, no dependencies, and the tests run offline with `npm test`.

Full options, the config format and a worked example are in [docs/USAGE.md](./docs/USAGE.md), including a section on when not to use it. I write about building and running autonomous systems safely at [aienterprise.dk](https://aienterprise.dk).

## What it does

Builds privacy, terms, and cookie-policy drafts from structured business inputs with explicit review flags.

## Install and use

See the files in this repository for the current runnable shape. This tool was rebuilt from scratch as a generic public utility, not copied from a production system.

## License

MIT. See [LICENSE](./LICENSE).

## Author

Kim Like, https://aienterprise.dk
