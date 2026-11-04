import { banner, table } from "../markdown.mjs";
import { isBlank } from "../context.mjs";

export const CATEGORIES = {
  necessary: "Strictly necessary",
  preferences: "Preferences",
  analytics: "Analytics",
  marketing: "Marketing",
  other: "Other",
};

export const title = "Cookie Policy";
export const fileName = "cookie-policy.md";

export function render(ctx, date) {
  const owner = ctx.text("business.legalName", "legal name of the organisation");
  const contact = ctx.text("business.contactEmail", "email address for privacy questions");
  const lines = [
    banner(title, date),
    "## What this policy covers",
    "",
    `${owner} uses cookies and similar technologies (small files or entries stored on your device, such as local storage) on our website. This policy lists what we use and why.`,
  ];

  const none = ctx.raw("cookiesDeclaredNone");
  const cookies = Array.isArray(ctx.config.cookies) ? ctx.config.cookies : [];
  lines.push("", "## What we store");

  if (cookies.length === 0 && none.value === true) {
    lines.push("", `We do not set cookies or similar technologies on your device. ${ctx.check("cookiesDeclaredNone", "verify this with a real browser scan; embedded videos, maps, fonts, chat widgets and analytics often set cookies without anyone noticing")}`);
  } else if (cookies.length === 0) {
    lines.push("", ctx.placeholder("cookies", "list of cookies and similar technologies the site sets, or set cookiesDeclaredNone to true after checking"));
  } else {
    const byCategory = new Map();
    cookies.forEach((c, i) => {
      let cat = c.category;
      if (isBlank(cat)) {
        ctx.placeholder(`cookies.${i}.category`, `category of cookie "${c.name || i + 1}" (${Object.keys(CATEGORIES).join(", ")})`);
        cat = "other";
      } else if (!(cat in CATEGORIES)) {
        ctx.confirm(`cookies.${i}.category`, `"${cat}" is not one of: ${Object.keys(CATEGORIES).join(", ")}`);
        cat = "other";
      }
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push({ c, i });
    });
    for (const cat of Object.keys(CATEGORIES)) {
      const group = byCategory.get(cat);
      if (!group) continue;
      lines.push("", `### ${CATEGORIES[cat]}`, "");
      lines.push(table(["Name", "Set by", "What it does", "How long it lasts"], group.map(({ c, i }) => [
        isBlank(c.name) ? ctx.placeholder(`cookies.${i}.name`, `name of cookie ${i + 1}`) : c.name,
        isBlank(c.provider) ? ctx.placeholder(`cookies.${i}.provider`, `who sets cookie "${c.name || i + 1}" (us or a named third party)`) : c.provider,
        isBlank(c.purpose) ? ctx.placeholder(`cookies.${i}.purpose`, `what cookie "${c.name || i + 1}" does`) : c.purpose,
        isBlank(c.duration) ? ctx.placeholder(`cookies.${i}.duration`, `how long cookie "${c.name || i + 1}" lasts`) : c.duration,
      ])));
    }

    const needsConsent = [...byCategory.keys()].some((k) => k !== "necessary");
    lines.push("", "## Your choices", "");
    if (needsConsent) {
      const mech = ctx.text("consent.mechanism", "how visitors give and withdraw consent for non-essential cookies (for example a banner and a settings link in the footer)");
      lines.push(`Strictly necessary cookies are used to make the site work and do not need your consent. For everything else we ask first. ${mech}`);
      lines.push("", ctx.check("consent", "confirm that the non-essential cookies are really not set before the visitor agrees, and that refusing is as easy as accepting"));
    } else {
      lines.push("All cookies listed above are strictly necessary for the site to work, so there is nothing to opt in to.", ctx.check("consent", "confirm each cookie above is really needed for something the visitor asked for; analytics rarely counts"));
    }
    lines.push("", "You can also delete cookies or block them in your browser settings. Blocking necessary cookies may break parts of the site.");
  }

  lines.push("", "## Questions", "", `Write to ${contact}.`);
  return lines.join("\n") + "\n";
}
