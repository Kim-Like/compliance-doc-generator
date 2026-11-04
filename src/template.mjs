// The starting config printed by --init. Every value is a placeholder; replace or delete each one.
export const TEMPLATE = {
  business: {
    legalName: "Acme Example Ltd",
    tradingName: "Acme",
    registrationNumber: "",
    address: "1 Example Street, Exampleville",
    contactEmail: "privacy@example.com",
    supervisoryAuthority: "",
  },
  dpo: { appointed: false },
  audience: { minimumAge: 16 },
  dataCollected: [
    {
      category: "Contact form messages",
      examples: ["name", "email address", "message text"],
      purpose: "Reply to the enquiry",
      lawfulBasis: "legitimate-interests",
      retention: "12 months after the last message",
    },
  ],
  otherSources: "",
  processors: [
    { name: "Example Mail Co", purpose: "Sends and stores our email", location: "EU" },
  ],
  transfers: { outsideEea: false },
  automatedDecisions: false,
  cookies: [
    { name: "session", provider: "Acme (first party)", category: "necessary", purpose: "Keeps you signed in", duration: "Until you close the browser" },
  ],
  consent: { mechanism: "" },
  terms: {
    serviceDescription: "",
    hasAccounts: true,
    minimumAge: 16,
    billing: "",
    currency: "",
    paymentMethods: "",
    refundPolicy: "",
    ownsContent: true,
    userContent: false,
    liabilityLimit: "",
    governingLaw: "",
    disputeForum: "",
  },
};
