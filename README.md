# sparshraj.me

Personal portfolio of Sparsh Raj (Backend & Platform Engineer), served at <https://sparshraj.me>.

## Stack

- **Astro** with static output. The page is pre-rendered HTML with inlined CSS, and it ships no client JS apart from a tiny inline theme toggle.
- **System fonts only**, so the page makes no third-party requests.
- **Build-time data layer:** `scripts/fetch-github.mjs` runs as `prebuild` and writes public, non-fork repo metadata (stars, language, homepage, last push) to `src/data/github.json`. If the API is unreachable, it keeps the last good file (or writes an empty one) and the build carries on.
- **Hosting:** GitHub Pages behind the custom domain in `public/CNAME`, with HTTPS from GitHub.

## Local development

Requires Node 22 or later.

```sh
npm ci
npm run dev           # http://localhost:4321
npm run build         # runs prebuild (GitHub fetch), then astro build into dist/
npm run preview       # serve dist/ locally
npm run fetch:github  # refresh src/data/github.json on its own
```

Set `GITHUB_TOKEN` to avoid the unauthenticated API rate limit. It's optional.

## Editing content

All copy lives in **`src/data/site.ts`**, a typed content file covering the profile, experience, open source, projects, skills, certifications, links and SEO. Edit it and the page rebuilds. Components in `src/components` only render that data.

GitHub stats are not edited by hand. They come from `src/data/github.json`, which is regenerated on every build.

Static files are in `public/`: `og.png` (1200×630 social card), `resume.pdf` (public version with no phone number), `robots.txt`, `sitemap.xml`, `.well-known/security.txt` and `CNAME`.

## Deploy

`.github/workflows/deploy.yml` builds and deploys with the official GitHub Pages actions (pinned to commit SHAs) when:

- something is pushed to `main`,
- someone triggers it manually (`workflow_dispatch`),
- the weekly schedule runs, which refreshes the GitHub data.

Permissions are least-privilege: the build job gets `contents: read` and the deploy job gets `pages: write` and `id-token: write`. The repo's Pages source must be set to **GitHub Actions**. Dependabot keeps npm packages and Actions up to date every week.

## Privacy

The site and the repo never contain a phone number or a street address. If you regenerate `public/resume.pdf`, extract its text with `pdftotext public/resume.pdf -` and confirm it has no phone number and no `tel` link before you commit it.
