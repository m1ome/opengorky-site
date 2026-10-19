// Usage: node scripts/release.mjs [tag]
// Pins site-config.js to a GitHub release (latest if no tag), after checking that every configured asset exists.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const CONFIG = new URL("../site-config.js", import.meta.url);
const src = readFileSync(CONFIG, "utf8");
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox);
const cfg = sandbox.window.SITE_CONFIG;

const wanted = (process.argv[2] || "").trim();
if (wanted && !/^[\w.+-]+$/.test(wanted)) fail(`bad tag: ${wanted}`);

const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const path = wanted ? `tags/${encodeURIComponent(wanted)}` : "latest";
const res = await fetch(`https://api.github.com/repos/${cfg.githubRepo}/releases/${path}`, { headers });
if (!res.ok) fail(`release ${wanted || "latest"} not found in ${cfg.githubRepo} (HTTP ${res.status})`);
const rel = await res.json();
if (rel.draft) fail(`${rel.tag_name} is a draft`);

const have = new Set(rel.assets.map((a) => a.name));
const missing = cfg.downloads.map((d) => d.asset).filter((a) => a && !have.has(a));
if (missing.length) fail(`${rel.tag_name} is missing assets: ${missing.join(", ")}`);

const out = src.replace(/^(\s*version:\s*)("[^"]*"|null)/m, `$1${JSON.stringify(rel.tag_name)}`);
if (out === src && cfg.version !== rel.tag_name) fail("could not find the version line in site-config.js");
writeFileSync(CONFIG, out);
console.log(cfg.version === rel.tag_name ? `already on ${rel.tag_name}` : `version: ${cfg.version} -> ${rel.tag_name}`);

function fail(msg) {
  console.error(`release: ${msg}`);
  process.exit(1);
}
