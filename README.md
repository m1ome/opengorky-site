# Open Gorky — website

Static two-page site (`index.html`, `faq.html`) for Open Gorky, an independent open-source reimplementation of Gorky 17 in Zig. Styled with Tailwind CSS v4; no backend, no analytics.

## Run locally

```sh
npm install
npm run build          # src/input.css -> styles.css (minified)
python3 -m http.server 8000   # then open http://localhost:8000
```

`npm run dev` rebuilds `styles.css` on change. The compiled `styles.css` is committed, so any static host can serve the folder as-is (`/faq` is `faq.html`).

## Configuration

Everything external lives in `site-config.js`. `null` means "intentionally not set" and renders as a visibly unavailable control.

- **`version`** is the single release switch. Every download link is `github.com/<githubRepo>/releases/download/<version>/<asset>`, and the "Version …" label shows the same value. No GitHub API calls from the browser.
- `downloads[]`: `asset` is the exact file name in the release; `hero: false` keeps an entry out of the hero row.
- `repositoryUrl`, `issuesUrl`, `releasesUrl` drive the Source code / Repository / Issue tracker / All releases links.
- `faq[]`: `answer: null` shows "This information has not been published yet."; `categories` are `start`, `project`, `contribute`. Answers come from the game repository README; update them if it changes.

External links open in a new tab with `rel="noopener noreferrer"`.

## Releasing

Manual GitHub Pages deploy: **Actions → Release site → Run workflow**, optionally with a tag (empty = latest release). The workflow (`.github/workflows/release.yml`):

1. runs `scripts/release.mjs`: checks that the release exists, is not a draft, and contains every `downloads[].asset`; otherwise it fails and nothing is deployed;
2. writes the tag into `version` in `site-config.js`, rebuilds CSS and commits the change;
3. deploys the site to GitHub Pages.

Locally: `npm run release` (latest) or `npm run release -- v0.2.0`, then commit.

One-time setup in the site repository: *Settings → Pages → Source: GitHub Actions*.

## Files

- `src/input.css` — Tailwind entry: theme tokens (colors, fonts), `wrap`, `btn`, `distress` (title texture mask), `crosshair`.
- `site.js` — applies config, mobile menu, FAQ filters/accordion.
- `scripts/release.mjs` — pins `version` to a checked GitHub release.
- `assets/` — hero art (`hero-city.webp`), emblem (`radiation-17.svg`, an approximate redraw, not an original logo), self-hosted fonts Barlow Condensed and IBM Plex Mono (SIL OFL 1.1, licenses in `assets/fonts/`).

Independent fan project. Not affiliated with the original rights holders.
