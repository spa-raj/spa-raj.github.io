#!/usr/bin/env node
// Postbuild leak and link gate. Fails the build (exit 1) when dist/ contains:
//   - personal data that must never be published: phone numbers ("+91", "tel:")
//     plus any private patterns listed one per line in the git-ignored file
//     `.pii-patterns` (or the PII_PATTERNS env var, newline-separated),
//   - an external <a> without rel="noopener noreferrer",
//   - a link scheme other than https:, mailto:, or a same-site path/anchor.
// PDFs are checked with `pdftotext` (poppler-utils) when it is installed, and
// always by scanning their raw bytes as a fallback.
//
// Dependency-free on purpose (node: built-ins only).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const privatePatterns = [
  ...(existsSync(join(ROOT, ".pii-patterns")) ? readFileSync(join(ROOT, ".pii-patterns"), "utf8").split("\n") : []),
  ...(process.env.PII_PATTERNS ?? "").split("\n"),
].map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
const PII = [
  { name: "+91 country code", re: /\+91/ },
  { name: "tel: link", re: /tel:/i },
  ...privatePatterns.map((p, i) => ({ name: `private pattern #${i + 1}`, re: new RegExp(escapeRe(p), "i") })),
];
const TEXT_EXT = new Set([".html", ".htm", ".xml", ".txt", ".svg", ".json", ".js", ".css", ".webmanifest", ""]);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}

function pdfText(file) {
  try {
    return execFileSync("pdftotext", [file, "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null; // pdftotext not installed, so fall back to the raw-byte scan only
  }
}

const errors = [];
const warnings = [];
let files = 0;

for await (const file of walk(DIST)) {
  const rel = relative(DIST, file);
  const ext = extname(file).toLowerCase();
  files++;

  const haystacks = [];
  if (TEXT_EXT.has(ext)) haystacks.push(["text", await readFile(file, "utf8")]);
  else haystacks.push(["bytes", (await readFile(file)).toString("latin1")]);
  if (ext === ".pdf") {
    const t = pdfText(file);
    if (t === null) {
      // In CI the workflow installs poppler-utils, so a missing pdftotext is a real failure.
      (process.env.CI ? errors : warnings).push(`${rel}: pdftotext not available, checked raw bytes only`);
    }
    else haystacks.push(["pdftotext", t]);
  }
  for (const [how, text] of haystacks) {
    for (const p of PII) if (p.re.test(text)) errors.push(`${rel}: contains ${p.name} (${how})`);
  }

  if (ext === ".html") {
    const html = haystacks[0][1].replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, "");
    for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
      const href = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
      if (!href) continue;
      const url = (href[1] ?? href[2] ?? href[3]).trim();
      if (/^https:\/\//i.test(url)) {
        const host = new URL(url).hostname;
        if (host === "sparshraj.me" || host === "www.sparshraj.me") continue;
        const rel = /\srel\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
        const tokens = new Set(((rel && (rel[1] ?? rel[2])) || "").toLowerCase().split(/\s+/));
        if (!tokens.has("noopener") || !tokens.has("noreferrer")) {
          errors.push(`${relative(DIST, file)}: external link without rel="noopener noreferrer": ${url}`);
        }
      } else if (/^mailto:/i.test(url) || /^[#/?]/.test(url) || /^[\w.-]+(\.[a-z0-9]+)?([#?].*)?$/i.test(url)) {
        // same-site path, fragment, or mailto: fine
      } else {
        errors.push(`${relative(DIST, file)}: disallowed link scheme: ${url.slice(0, 60)}`);
      }
    }
  }
}

for (const w of warnings) console.warn(`[verify] warning: ${w}`);
if (files === 0) errors.push("dist/ is empty (did the build run?)");
if (errors.length) {
  console.error(`[verify] FAILED with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`[verify] ${files} file(s) clean: no PII patterns, all external links rel="noopener noreferrer", only https/mailto/relative links`);
