import { banner } from "../markdown.mjs";

export const title = "Terms of Service";
export const fileName = "terms-of-service.md";

export function render(ctx, date) {
  const name = ctx.text("business.legalName", "legal name of the organisation");
  const trading = ctx.raw("business.tradingName");
  const address = ctx.text("business.address", "postal address of the organisation");
  const email = ctx.text("business.contactEmail", "contact email address");
  const service = ctx.text("terms.serviceDescription", "plain description of what you provide");
  const L = [
    banner(title, date),
    "## Who we are and what these terms cover",
    "",
    `These terms apply to your use of ${trading.value ? trading.value + ", operated by " : ""}${name}, ${address} ("we", "us"), and to anything you buy from us.`,
    "",
    `**What we provide.** ${service}`,
    "",
    `**Contact.** ${email}`,
  ];

  const accounts = ctx.bool("terms.hasAccounts", "whether people create accounts");
  L.push("", "## Accounts", "");
  if (accounts === true) {
    L.push("You must give accurate information when you create an account and keep your login details private. You are responsible for what happens under your account. Tell us if you think someone else has access to it.");
    L.push("", `Minimum age: ${ctx.text("terms.minimumAge", "minimum age to hold an account")}.`);
  } else if (accounts === false) {
    L.push("You do not need an account to use our service.");
  } else {
    L.push("[REVIEW NEEDED: whether people create accounts]");
  }

  L.push("", "## Prices and payment", "");
  const billing = ctx.text("terms.billing", "how you charge: one-off, subscription, or free");
  const currency = ctx.text("terms.currency", "currency and whether prices include tax");
  const methods = ctx.text("terms.paymentMethods", "accepted payment methods and when payment is taken");
  L.push(`Billing: ${billing}.`, "", `Prices are stated in ${currency}.`, "", `Payment: ${methods}.`);

  L.push("", "## Cancelling and refunds", "");
  L.push(ctx.text("terms.refundPolicy", "your cancellation and refund policy, in plain words"));
  L.push("", `If you are a consumer, the law of your country may give you rights that these terms cannot take away, such as a right to cancel certain distance purchases within a set period. Nothing here limits those rights. ${ctx.check("terms.consumerRights", "state the cancellation period and exceptions that actually apply to what you sell and where you sell it")}`);

  L.push("", "## Acceptable use", "", "You agree not to misuse the service. That includes breaking the law, trying to get into systems or data that are not yours, interfering with the service, uploading malware, or using the service to harm others. We may suspend access if you do.");

  L.push("", "## Ownership and content", "");
  const ours = ctx.bool("terms.ownsContent", "whether the content and software of your service belong to you or are licensed to you");
  if (ours === true) L.push("The service, its content and its software belong to us or our licensors. You get a limited right to use them as part of the service, and nothing more.");
  else if (ours === false) L.push(ctx.placeholder("terms.ownsContent", "who owns the content and software, and under which licence you offer it"));
  else L.push("[REVIEW NEEDED: whether the content and software of your service belong to you or are licensed to you]");
  const ugc = ctx.bool("terms.userContent", "whether people can upload or post content");
  if (ugc === true) {
    L.push("", `You keep ownership of content you upload. You give us the permission we need to store and show it as part of the service. ${ctx.text("terms.userContentLicence", "the exact permission you need from uploaders (scope, duration, whether it ends when they delete content)")}`);
  } else if (ugc === null) {
    L.push("", "[REVIEW NEEDED: whether people can upload or post content]");
  }

  L.push("", "## Our responsibility", "");
  L.push("We aim to provide the service with reasonable care and skill. We do not promise it will always be available or free of errors.");
  L.push("", ctx.text("terms.liabilityLimit", "your liability cap and exclusions, as agreed with a professional"));
  L.push("", ctx.check("terms.liability", "rules on limiting liability differ a lot between places and between consumers and businesses; do not rely on a generic clause"));

  L.push("", "## Ending the agreement", "", "You can stop using the service at any time. We may suspend or end your access if you seriously or repeatedly break these terms, or if we stop offering the service. Where you have paid for something you have not received, we will deal with that as set out under refunds above.");

  L.push("", "## Law and disputes", "");
  const law = ctx.text("terms.governingLaw", "which country's law governs these terms");
  const forum = ctx.text("terms.disputeForum", "where disputes are handled (courts, arbitration, or a consumer complaints body)");
  L.push(`These terms are governed by the law of ${law}. Disputes are handled by ${forum}.`);

  L.push("", "## Changes", "", "We may change these terms. If a change matters, we will tell you before it applies to you. Using the service after the change means you accept it, unless the law says otherwise.");
  L.push("", ctx.check("terms.changes", "decide how you will notify people of changes and make sure you actually do it"));
  return L.join("\n") + "\n";
}
