import { banner, table } from "../markdown.mjs";
import { isBlank } from "../context.mjs";

export const LAWFUL_BASES = {
  consent: "your consent",
  contract: "performing a contract with you, or taking steps you ask for before a contract",
  "legal-obligation": "a legal obligation we have to meet",
  "vital-interests": "protecting someone's vital interests",
  "public-task": "a task carried out in the public interest",
  "legitimate-interests": "our legitimate interests",
};

export const title = "Privacy Policy";
export const fileName = "privacy-policy.md";

function controllerSection(ctx) {
  const name = ctx.text("business.legalName", "legal name of the organisation that decides why and how personal data is used");
  const address = ctx.text("business.address", "postal address of that organisation");
  const email = ctx.text("business.contactEmail", "email address for privacy questions");
  const reg = ctx.text("business.registrationNumber", "company registration number, if you have one");
  const lines = [
    "## Who we are",
    "",
    `This policy explains how ${name} ("we", "us") uses personal data about people who visit our website or deal with us.`,
    "",
    `- Organisation: ${name}`,
    `- Registration number: ${reg}`,
    `- Address: ${address}`,
    `- Contact for privacy questions: ${email}`,
  ];
  const hasDpo = ctx.bool("dpo.appointed", "whether a data protection officer has been appointed");
  if (hasDpo === true) {
    lines.push(`- Data protection officer: ${ctx.text("dpo.email", "contact address of the data protection officer")}`);
  } else if (hasDpo === false) {
    lines.push(`- Data protection officer: we have not appointed one. ${ctx.check("dpo.appointed", "confirm that your activities do not require appointing one; this depends on what you do and how much of it")}`);
  } else {
    lines.push(`- Data protection officer: [REVIEW NEEDED: whether a data protection officer has been appointed]`);
  }
  return lines.join("\n");
}

function dataSection(ctx) {
  const items = ctx.list("dataCollected", "list of the categories of personal data you collect, with purpose, lawful basis and retention");
  const lines = ["## What personal data we use, why, and for how long", ""];
  if (items.length === 0) {
    lines.push("[REVIEW NEEDED: list of the categories of personal data you collect]");
    return lines.join("\n");
  }
  const rows = items.map((item, i) => {
    const at = `dataCollected.${i}`;
    const category = isBlank(item.category) ? ctx.placeholder(`${at}.category`, `category name for data item ${i + 1}`) : item.category;
    const examples = Array.isArray(item.examples) && item.examples.length
      ? item.examples.join(", ")
      : ctx.placeholder(`${at}.examples`, `examples of the data in "${category}"`);
    const purpose = isBlank(item.purpose) ? ctx.placeholder(`${at}.purpose`, `purpose for "${category}"`) : item.purpose;
    let basis;
    if (isBlank(item.lawfulBasis)) {
      basis = ctx.placeholder(`${at}.lawfulBasis`, `lawful basis for "${category}"`);
    } else if (!(item.lawfulBasis in LAWFUL_BASES)) {
      basis = `${item.lawfulBasis} ${ctx.confirm(`${at}.lawfulBasis`, `"${item.lawfulBasis}" is not one of: ${Object.keys(LAWFUL_BASES).join(", ")}`)}`;
    } else if (item.lawfulBasis === "legitimate-interests") {
      basis = `${LAWFUL_BASES[item.lawfulBasis]} ${ctx.check(`${at}.lawfulBasis`, `"${category}" relies on legitimate interests; write down your balancing test and be ready to show it`)}`;
    } else if (item.lawfulBasis === "consent") {
      basis = `${LAWFUL_BASES[item.lawfulBasis]} ${ctx.check(`${at}.lawfulBasis`, `"${category}" relies on consent; make sure consent is freely given, recorded, and as easy to withdraw as to give`)}`;
    } else {
      basis = LAWFUL_BASES[item.lawfulBasis];
    }
    const retention = isBlank(item.retention) ? ctx.placeholder(`${at}.retention`, `how long "${category}" is kept`) : item.retention;
    return [category, examples, purpose, basis, retention];
  });
  lines.push(table(["Category", "Examples", "Why we use it", "Lawful basis", "How long we keep it"], rows));

  const others = ctx.raw("otherSources");
  lines.push("", "### Where the data comes from", "");
  if (isBlank(others.value)) {
    lines.push(`Unless stated above, we get this data directly from you. ${ctx.check("otherSources", "state whether you also receive data about people from anyone else (partners, public sources, data brokers); if you do, name the sources here")}`);
  } else {
    lines.push(`Besides what you give us directly: ${Array.isArray(others.value) ? others.value.join("; ") : others.value}.`);
  }
  return lines.join("\n");
}

function sharingSection(ctx) {
  const processors = ctx.list("processors", "list of the companies that handle personal data for you (hosting, email, payments, analytics)");
  const lines = ["## Who we share data with", ""];
  if (processors.length === 0) {
    lines.push("[REVIEW NEEDED: list of the companies that handle personal data for you]");
  } else {
    lines.push("We use the following service providers, who handle personal data on our behalf:", "");
    lines.push(table(["Provider", "What they do for us", "Where they process data"], processors.map((p, i) => [
      isBlank(p.name) ? ctx.placeholder(`processors.${i}.name`, `name of provider ${i + 1}`) : p.name,
      isBlank(p.purpose) ? ctx.placeholder(`processors.${i}.purpose`, `what provider "${p.name || i + 1}" does`) : p.purpose,
      isBlank(p.location) ? ctx.placeholder(`processors.${i}.location`, `where provider "${p.name || i + 1}" processes data`) : p.location,
    ])));
    lines.push("", ctx.check("processors", "confirm that you have a written agreement with each provider that covers personal data"));
  }
  lines.push("", "We do not sell personal data.", ctx.check("sellsData", "this sentence is a default; remove or change it if you share data with others for money or other value"));
  return lines.join("\n");
}

function transferSection(ctx) {
  const occurs = ctx.bool("transfers.outsideEea", "whether personal data is sent or made accessible outside the European Economic Area");
  const lines = ["## Transfers outside the European Economic Area", ""];
  if (occurs === true) {
    const safeguard = ctx.text("transfers.safeguard", "the legal mechanism you rely on for those transfers");
    lines.push(`Some of our providers process personal data outside the European Economic Area. When that happens we rely on: ${safeguard}.`);
  } else if (occurs === false) {
    lines.push(`We do not intend to transfer personal data outside the European Economic Area. ${ctx.check("transfers.outsideEea", "check each provider's real processing and support locations, because remote support access can count as a transfer")}`);
  } else {
    lines.push("[REVIEW NEEDED: whether personal data is sent or made accessible outside the European Economic Area]");
  }
  return lines.join("\n");
}

function rightsSection(ctx) {
  const authority = ctx.text("business.supervisoryAuthority", "name and website of the data protection authority in your country");
  return [
    "## Your rights",
    "",
    "Depending on where you live, you can usually ask us to:",
    "",
    "- tell you whether we use your personal data and give you a copy (access)",
    "- correct data that is wrong or incomplete (rectification)",
    "- delete your data in certain cases (erasure)",
    "- limit how we use your data in certain cases (restriction)",
    "- give you your data in a common format, or pass it to another provider, in certain cases (portability)",
    "- stop using your data where we rely on legitimate interests (objection)",
    "- stop using your data where we rely on your consent, by withdrawing it at any time",
    "",
    "Withdrawing consent does not affect use of your data before you withdrew it. To use any of these rights, write to us at the address above. We will answer within the time the law gives us.",
    "",
    `If you think we handle your data unlawfully you can complain to the data protection authority: ${authority}. We would like the chance to fix it first, but you do not have to contact us before complaining.`,
  ].join("\n");
}

function otherSection(ctx) {
  const lines = ["## Other matters", ""];
  const age = ctx.raw("audience.minimumAge");
  if (isBlank(age.value)) {
    lines.push(`**Children.** [REVIEW NEEDED: the minimum age of the people your service is meant for, and what you do if a child's data is collected]`);
    ctx.placeholder("audience.minimumAge", "the minimum age of the people your service is meant for, and what you do if a child's data is collected");
  } else {
    lines.push(`**Children.** Our service is not meant for people under ${age.value}. If you believe a child has given us personal data, tell us and we will delete it.${age.unsure ? " " + ctx.confirm("audience.minimumAge", "confirm the minimum age") : ""}`);
  }
  lines.push("");
  const auto = ctx.bool("automatedDecisions", "whether you make decisions about people using only automated processing or profiling");
  if (auto === false) {
    lines.push("**Automated decisions.** We do not make decisions about you based only on automated processing that have legal or similarly significant effects.");
  } else if (auto === true) {
    lines.push(`**Automated decisions.** ${ctx.text("automatedDecisionsDescription", "describe the decisions, the logic involved in plain words, and how a person can ask for human review")}`);
  } else {
    lines.push("**Automated decisions.** [REVIEW NEEDED: whether you make decisions about people using only automated processing or profiling]");
  }
  lines.push("", "**Cookies.** See our cookie policy for what we store on your device and how to control it.");
  lines.push("", "**Security.** We use technical and organisational measures to protect personal data. No system is perfectly secure, and we cannot promise otherwise.", ctx.check("security", "describe your real measures in a few specific sentences, or leave the general statement; do not claim measures you do not have"));
  lines.push("", `**Changes.** We may update this policy. The date at the top of the published version shows when it last changed.`);
  return lines.join("\n");
}

export function render(ctx, date) {
  return [
    banner(title, date),
    controllerSection(ctx),
    dataSection(ctx),
    sharingSection(ctx),
    transferSection(ctx),
    rightsSection(ctx),
    otherSection(ctx),
  ].join("\n\n") + "\n";
}
