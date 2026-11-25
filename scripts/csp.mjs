#!/usr/bin/env node
// Postbuild: inject a hash-based Content-Security-Policy <meta> into every dist/**/*.html.
//
// GitHub Pages cannot send custom response headers, so the CSP has to be a <meta>.
// Hashes are computed from the BUILT output on every build, so they can never go stale.
//
// For each HTML file this script:
//   1. removes any CSP <meta> left by a previous run (idempotent),
//   2. sha256-hashes the exact text of every inline <script> (except JSON data blocks)
//      and every <style> element,
//   3. inserts <meta http-equiv="Content-Security-Policy"> directly after <meta charset>,
//   4. FAILS the build (exit 1) on anything the policy cannot or should not allow:
//      inline event handlers (on*=), style="" attributes, <script src>, external
//      stylesheets, javascript: URLs.
//
// Dependency-free on purpose (node: built-ins only).

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const DATA_TYPES = new Set(["application/ld+json", "application/json"]);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}

const sha256 = (text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

/** Value of attribute `name` in an opening-tag string, or null. */
function attr(tag, name) {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}
const hasAttr = (tag, name) => new RegExp(`\\s${name}(?=[\\s=>/])`, "i").test(tag);

function buildPolicy(scriptHashes, styleHashes) {
  const list = (h) => (h.length ? [...new Set(h)].join(" ") : "'none'");
  return [
    "default-src 'none'",
    `script-src ${list(scriptHashes)}`,
    `style-src ${list(styleHashes)}`,
    "img-src 'self'",
    "font-src 'none'",
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function processHtml(html, file, errors) {
  // 1. Drop a CSP meta from an earlier run so re-running is safe.
  html = html.replace(/<meta\s+http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, "");

  const scriptHashes = [];
  const styleHashes = [];

  // 2. Hash inline <script> and <style> raw text. Browsers hash the raw element text
  //    exactly as it appears in the document (no entity decoding for raw-text elements).
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const open = m[1];
    const type = (attr(open, "type") || "").trim().toLowerCase();
    if (hasAttr(open, "src")) {
      errors.push(`${file}: <script src="${attr(open, "src")}"> is not allowed (CSP allows only hashed inline scripts)`);
      continue;
    }
    if (DATA_TYPES.has(type)) continue; // data blocks are never executed, CSP does not apply
    scriptHashes.push(sha256(m[2]));
  }
  for (const m of html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi)) {
    styleHashes.push(sha256(m[2]));
  }

  // 3. Lint the markup with raw-text element bodies removed, so script/CSS text
  //    can't produce false positives.
  const markup = html.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, "<$1$2></$1>");
  for (const [tag] of markup.matchAll(/<[a-zA-Z][^>]*>/g)) {
    const handler = /\s(on[a-z]+)\s*=/i.exec(tag);
    if (handler) errors.push(`${file}: inline event handler ${handler[1]}= in ${tag.slice(0, 120)}`);
    if (/\sstyle\s*=/i.test(tag)) errors.push(`${file}: style="" attribute in ${tag.slice(0, 120)}`);
    if (/^<link\b/i.test(tag)) {
      const rel = (attr(tag, "rel") || "").toLowerCase().split(/\s+/);
      if (rel.includes("stylesheet")) errors.push(`${file}: external stylesheet ${attr(tag, "href")} (styles must be inlined)`);
      if (rel.includes("preload") || rel.includes("modulepreload")) {
        const href = attr(tag, "href") || "";
        if (/^(https?:)?\/\//i.test(href)) errors.push(`${file}: cross-origin ${rel.join(" ")} ${href}`);
      }
    }
    for (const a of ["href", "src", "action", "formaction", "xlink:href"]) {
      const v = attr(tag, a);
      if (v && /^\s*(javascript|vbscript|data):/i.test(v.replace(/[\u0000- ]/g, ""))) {
        errors.push(`${file}: ${a}="${v.slice(0, 40)}" uses a forbidden URL scheme`);
      }
    }
  }

  // 4. Inject right after <meta charset>, before anything that could fetch or run.
  const charset = /<meta\s+charset\s*=\s*["']?utf-8["']?\s*\/?>/i.exec(html);
  if (!charset) {
    errors.push(`${file}: no <meta charset="utf-8"> found to anchor the CSP meta`);
    return { html, scriptHashes, styleHashes };
  }
  const policy = buildPolicy(scriptHashes, styleHashes);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  const at = charset.index + charset[0].length;
  return { html: html.slice(0, at) + meta + html.slice(at), scriptHashes, styleHashes };
}

const errors = [];
let count = 0;
for await (const file of walk(DIST)) {
  if (!file.endsWith(".html")) continue;
  const rel = relative(DIST, file);
  const src = await readFile(file, "utf8");
  const { html, scriptHashes, styleHashes } = processHtml(src, rel, errors);
  await writeFile(file, html, "utf8");
  count++;
  console.log(`[csp] ${rel}: ${scriptHashes.length} script hash(es), ${styleHashes.length} style hash(es)`);
}

if (count === 0) errors.push("no HTML files found in dist/ (did the build run?)");
if (errors.length) {
  console.error(`[csp] FAILED with ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`[csp] injected CSP into ${count} HTML file(s)`);
