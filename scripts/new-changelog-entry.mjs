#!/usr/bin/env node
// Scaffold a new session entry at the top of CHANGELOG.md.
// Usage: npm run changelog:new -- "short headline"
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const changelogPath = join(dirname(fileURLToPath(import.meta.url)), "..", "CHANGELOG.md");
const headline = process.argv.slice(2).join(" ").trim() || "<short headline>";
const date = new Date().toISOString().slice(0, 10);

const changelog = readFileSync(changelogPath, "utf8");

if (changelog.includes(`## ${date} —`)) {
  console.log(`CHANGELOG.md already has an entry for ${date} — edit it instead.`);
  process.exit(0);
}

const entry = `## ${date} — ${headline}

### Summary
<!-- 1–3 sentences on what the session accomplished. -->

### PRs
<!-- - [#N](url) — title — status (open / merged / closed) -->

### Migrations added
<!-- - \`0NN_name.sql\` — one-line purpose -->

### Decisions / trade-offs
<!-- Why we did it this way — highest-value section for future sessions. -->

### Deferred for follow-up
<!-- Noticed but intentionally not done. -->

`;

// Insert after the first "---" separator (preamble stays on top).
const marker = "\n---\n";
const idx = changelog.indexOf(marker);
if (idx === -1) {
  console.error("Could not find the '---' separator in CHANGELOG.md — aborting, nothing written.");
  process.exit(1);
}
const insertAt = idx + marker.length;
writeFileSync(
  changelogPath,
  changelog.slice(0, insertAt) + "\n" + entry + changelog.slice(insertAt),
  "utf8"
);
console.log(`Added ${date} entry template to CHANGELOG.md (headline: "${headline}"). Remove unused sections before committing.`);
