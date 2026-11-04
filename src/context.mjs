// Answer lookup with review flags. Every question the documents ask goes through here,
// so a missing or uncertain answer can never silently turn into confident text.

const BLANK_WORDS = new Set(["", "tbd", "todo", "unknown", "?", "n/a?"]);

export function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return BLANK_WORDS.has(value.trim().toLowerCase());
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function getPath(obj, path) {
  let cur = obj;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
}

// An answer may be wrapped as {"value": X, "unsure": true} to say "I filled this in but I am not sure".
function unwrap(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "unsure" in raw && "value" in raw) {
    return { value: raw.value, unsure: raw.unsure === true };
  }
  return { value: raw, unsure: false };
}

export const FLAG_KINDS = ["missing", "uncertain", "check"];

export function createContext(config, docId) {
  const flags = [];
  const add = (kind, field, message, marker) => {
    flags.push({ doc: docId, kind, field, message, marker });
    return marker;
  };

  const ctx = {
    docId,
    flags,
    config,
    raw(path) {
      return unwrap(getPath(config, path));
    },
    // Text answer. Blank -> a loud placeholder. Unsure -> value plus a confirm marker.
    text(path, label) {
      const { value, unsure } = unwrap(getPath(config, path));
      if (isBlank(value)) {
        return add("missing", path, label, `[REVIEW NEEDED: ${label}]`);
      }
      const s = String(value).trim();
      if (unsure) {
        const marker = `[CONFIRM: ${label}]`;
        add("uncertain", path, label, marker);
        return `${s} ${marker}`;
      }
      return s;
    },
    // Yes/no answer. Returns true, false, or null (null means a flag was recorded; caller prints the placeholder).
    bool(path, label) {
      const { value, unsure } = unwrap(getPath(config, path));
      if (typeof value !== "boolean") {
        add("missing", path, label, `[REVIEW NEEDED: ${label}]`);
        return null;
      }
      if (unsure) add("uncertain", path, label, `[CONFIRM: ${label}]`);
      return value;
    },
    // List answer. Empty -> flag and [] returned.
    list(path, label) {
      const { value, unsure } = unwrap(getPath(config, path));
      if (isBlank(value) || !Array.isArray(value)) {
        add("missing", path, label, `[REVIEW NEEDED: ${label}]`);
        return [];
      }
      if (unsure) add("uncertain", path, label, `[CONFIRM: ${label}]`);
      return value;
    },
    placeholder(path, label) {
      return add("missing", path, label, `[REVIEW NEEDED: ${label}]`);
    },
    confirm(path, label) {
      return add("uncertain", path, label, `[CONFIRM: ${label}]`);
    },
    // A point where the draft makes a judgement call that a person has to own.
    check(path, message) {
      return add("check", path, message, `[CHECK: ${message}]`);
    },
  };
  return ctx;
}
