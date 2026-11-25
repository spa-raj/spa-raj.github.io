#!/usr/bin/env node
// Build-time data layer: fetch public, non-fork repos for the GitHub user and
// write src/data/github.json. This script must NEVER fail the build. On any
// error it keeps the existing file (or writes an empty fallback) and exits 0.
//
// Shape: { generatedAt: string|null, repos: { [name]: { stars, url, homepage, language, pushedAt } } }

import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USER = "spa-raj";
const TIMEOUT_MS = 8000;
const MAX_PAGES = 5; // 100 repos per page, so up to 500 repos.
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../src/data/github.json");
const FALLBACK = { generatedAt: null, repos: {} };

function warn(msg) {
  console.warn(`[fetch-github] warning: ${msg}`);
}

/** Returns the URL string only if it parses as https:// (optionally on `host`), else null. */
function httpsUrl(value, host) {
  if (typeof value !== "string" || !value) return null;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "https:") return null;
    if (host && u.hostname !== host) return null;
    return u.href;
  } catch {
    return null;
  }
}

async function writeJson(data) {
  await mkdir(dirname(OUT), { recursive: true });
  const tmp = `${OUT}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await rename(tmp, OUT); // atomic replace, so a crash never leaves half a file
}

async function fetchPage(page, signal) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-build",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/users/${USER}/repos?type=owner&sort=pushed&per_page=100&page=${page}`;
  const res = await fetch(url, { headers, signal });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for page ${page}`);
  const body = await res.json();
  if (!Array.isArray(body)) throw new Error("unexpected response (not an array)");
  return body;
}

async function main() {
  const signal = AbortSignal.timeout(TIMEOUT_MS); // one budget for the whole fetch
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await fetchPage(page, signal);
    all.push(...batch);
    if (batch.length < 100) break;
  }

  const repos = {};
  for (const r of all) {
    if (!r || r.private || r.fork || r.visibility === "private") continue;
    if (typeof r.name !== "string" || !/^[\w.-]{1,100}$/.test(r.name)) continue;
    repos[r.name] = {
      stars: Math.max(0, Math.floor(Number(r.stargazers_count))) || 0,
      // Only keep URLs we would be willing to render: https and, for url, github.com.
      url: httpsUrl(r.html_url, "github.com") ?? `https://github.com/${USER}/${r.name}`,
      homepage: httpsUrl(r.homepage),
      language: r.language ? String(r.language) : null,
      pushedAt: String(r.pushed_at),
    };
  }

  await writeJson({ generatedAt: new Date().toISOString(), repos });
  console.log(`[fetch-github] wrote ${Object.keys(repos).length} public repos to ${OUT}`);
}

if (process.env.SKIP_GITHUB_FETCH === "1") {
  console.log("[fetch-github] SKIP_GITHUB_FETCH=1, using existing src/data/github.json");
} else try {
  await main();
} catch (err) {
  warn(`${err?.name ?? "Error"}: ${err?.message ?? err}`);
  try {
    if (existsSync(OUT)) {
      JSON.parse(await readFile(OUT, "utf8")); // only keep it if it is valid JSON
      warn("keeping existing src/data/github.json");
    } else {
      await writeJson(FALLBACK);
      warn("wrote empty fallback src/data/github.json");
    }
  } catch (inner) {
    try {
      await writeJson(FALLBACK);
      warn(`existing file unusable (${inner?.message ?? inner}); wrote empty fallback`);
    } catch (fatal) {
      warn(`could not write fallback: ${fatal?.message ?? fatal}`);
    }
  }
}
process.exitCode = 0;
