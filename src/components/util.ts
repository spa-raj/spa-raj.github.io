import { existsSync } from "node:fs";
import { join } from "node:path";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sep 2025" -> "2025-09" (for <time datetime>). Returns undefined if unparseable. */
export function toISOMonth(label: string): string | undefined {
  const m = /^([A-Z][a-z]{2})\s+(\d{4})$/.exec(label.trim());
  if (!m) return undefined;
  const i = MONTHS.indexOf(m[1]);
  return i < 0 ? undefined : `${m[2]}-${String(i + 1).padStart(2, "0")}`;
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Resume link: explicit site.links.resume wins; else /resume.pdf only if it exists at build time. */
export function resumeHref(explicit: string | null): string | null {
  if (explicit) return explicit;
  return existsSync(join(process.cwd(), "public", "resume.pdf")) ? "/resume.pdf" : null;
}

type RepoInfo = { stars: number; url: string; homepage: string | null; language: string | null; pushedAt: string };
type GithubData = { generatedAt: string; repos: Record<string, RepoInfo> };

// Optional build-time data from the Backend fetch script. Missing file => empty object.
const ghModules = import.meta.glob<{ default: GithubData }>("../data/github.json", { eager: true });
const gh: GithubData | undefined = Object.values(ghModules)[0]?.default;

/** Star count for "owner/name" or "name"; null when unknown or 0. */
export function starsFor(repo?: string): number | null {
  if (!repo || !gh?.repos) return null;
  const info = gh.repos[repo] ?? gh.repos[repo.split("/").pop() ?? ""];
  return info && typeof info.stars === "number" && info.stars > 0 ? info.stars : null;
}
