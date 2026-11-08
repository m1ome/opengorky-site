// Usage: node scripts/docs.mjs [path/to/og-script.md]
// Builds the editor docs: guides from docs-src/guides/<lang>/NN-slug.html (EN + RU) and the
// built-in function reference (EN only) from §16 of the engine's docs/og-script.md, whose
// descriptions mirror src/editor/api.zig. Output is committed: CI has no engine checkout.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import assert from "node:assert/strict";

const ROOT = new URL("../", import.meta.url);
const SITE = "https://opengorky.app/";
const SPEC_URL = "https://github.com/m1ome/opengorky/blob/main/docs/og-script.md";
const mdPath = process.argv[2] || new URL("../opengorky-engine/docs/og-script.md", ROOT).pathname;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const write = (rel, html) => { const f = new URL(rel, ROOT); mkdirSync(dirname(f.pathname), { recursive: true }); writeFileSync(f, html); };

// ---------- §16 of og-script.md -> packages ----------

const md = readFileSync(mdPath, "utf8");
const s16 = md.slice(md.indexOf("\n## 16. "), md.indexOf("\n## 17. "));
assert(s16.length > 100, `no §16 in ${mdPath}`);

// Block-level markdown of the subset §16 uses: paragraphs, "- " lists, ``` fences, tables.
function blocks(text) {
  const out = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    if (l.startsWith("```")) {
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      out.push({ type: "code", text: code.join("\n") });
    } else if (l.startsWith("|")) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith("|"); i++) {
        if (/^\|[-| :]+\|$/.test(lines[i])) continue;
        rows.push(lines[i].slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|")));
      }
      i--;
      out.push({ type: "table", head: rows[0], rows: rows.slice(1) });
    } else if (l.startsWith("- ")) {
      const items = [];
      for (; i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("  ")); i++) {
        if (lines[i].startsWith("- ")) items.push(lines[i].slice(2)); else items[items.length - 1] += " " + lines[i].trim();
      }
      i--;
      out.push({ type: "list", items });
    } else {
      const p = [l];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^(```|\||- |#)/.test(lines[i + 1])) p.push(lines[++i]);
      out.push({ type: "p", text: p.join(" ") });
    }
  }
  return out;
}

const fnIndex = new Map(); // "object::Enable" -> url relative to editor/reference/
// Inline markdown: `code` (linked when it names a known function), **bold**, [text](link), §N -> spec.
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, (_, c) => {
      const m = c.match(/^(\w+::\w+)/);
      const href = m && fnIndex.get(m[1]);
      return href ? `<a href="${href}"><code>${c}</code></a>` : `<code>${c}</code>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${h.startsWith("#") ? SPEC_URL + h : h}">${t}</a>`)
    .replace(/§(\d+(?:\.\d+)*)/g, `<a href="${SPEC_URL}">§$1</a>`);
}
const renderBlock = (b) =>
  b.type === "p" ? `<p>${inline(b.text)}</p>`
  : b.type === "list" ? `<ul>${b.items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`
  : b.type === "code" ? `<pre><code>${esc(b.text)}</code></pre>`
  : `<div class="overflow-x-auto"><table><thead><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

const [intro, ...sections] = s16.split(/\n### 16\.\d+ /);
const packages = sections.map((sec) => {
  const nl = sec.indexOf("\n");
  const heading = sec.slice(0, nl).trim(); // "`object` — Objects" | "Root: the core" | "Classic only"
  const named = heading.match(/^`(\w+)` — (.+)$/);
  const slug = named ? named[1] : heading.startsWith("Root") ? "core" : "classic-only";
  const pkg = { slug, name: named ? named[1] : heading.split(":")[0], title: named ? named[2] : heading, intro: [], groups: [], other: [] };
  let pendingGroup = null;
  for (const b of blocks(sec.slice(nl + 1))) {
    if (b.type === "table" && b.head[0] === "OG Script") {
      const fns = b.rows.map(([ogs, classic, sig, doc]) => {
        const id = ogs.replace(/`/g, "");
        const only = /^OpenGorky only\.\s*/.test(doc);
        const m = sig.replace(/`/g, "").match(/^([^(]*)\((.*)\)$/);
        assert(m, `bad signature for ${id}: ${sig}`);
        return { id, anchor: id.split("::").pop(), classic: classic.replace(/`/g, ""), result: m[1], params: m[2], only, doc: doc.replace(/^OpenGorky only\.\s*/, "") };
      });
      pkg.groups.push({ title: pendingGroup, fns });
      pendingGroup = null;
    } else if (b.type === "p" && b.text.endsWith(":") && pkg.intro.length) {
      pendingGroup = b.text.slice(0, -1); // "Model and animations (…):" names the table below it
    } else if (b.type === "table") pkg.other.push(b);
    else pkg.intro.push(b);
  }
  return pkg;
});
for (const p of packages) for (const g of p.groups) for (const f of g.fns) fnIndex.set(f.id, `${p.slug}.html#${f.anchor}`);
const fnCount = packages.reduce((n, p) => n + p.groups.reduce((m, g) => m + g.fns.length, 0), 0);
assert(packages.length >= 10 && fnCount >= 100, `parsed only ${packages.length} packages / ${fnCount} functions: did §16's format change?`);

// ---------- guides ----------

const LANGS = {
  en: {
    dir: "editor/", other: "ru", skip: "Skip to content", home: "Open Gorky — home", menu: "Menu", mainNav: "Main",
    nav: [["index.html#project", "The project"], ["index.html#development", "Development"], ["editor/", "Editor"], ["faq.html", "FAQ"]],
    source: "Source code", footer: "Independent fan project. Not affiliated with the original rights holders.", cookies: "Cookie settings",
    kicker: "Field manual / Level editor", guides: "Guides", reference: "Reference", search: "Search the docs…", docsNav: "Documentation",
    refNote: "", switchLabel: "RU — Русская версия",
  },
  ru: {
    dir: "ru/editor/", other: "en", skip: "Перейти к содержимому", home: "Open Gorky — главная", menu: "Меню", mainNav: "Основное",
    nav: [["ru/index.html#project", "О проекте"], ["ru/index.html#development", "Разработка"], ["ru/editor/", "Редактор"], ["ru/faq.html", "Вопросы"]],
    source: "Исходный код", footer: "Независимый фанатский проект. Не связан с правообладателями оригинальной игры.", cookies: "Настройки cookies",
    kicker: "Полевой устав / Редактор уровней", guides: "Руководства", reference: "Справочник (EN)", search: "Поиск по документации…", docsNav: "Документация",
    switchLabel: "EN — English version",
  },
};

function readGuides(lang) {
  const dir = new URL(`docs-src/guides/${lang}/`, ROOT);
  return readdirSync(dir).filter((f) => /^\d\d-[\w-]+\.html$/.test(f)).sort().map((f) => {
    const body = readFileSync(new URL(f, dir), "utf8");
    const slug = f.slice(3, -5);
    const title = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, "").trim();
    const description = body.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    assert(title && description, `${lang}/${f}: needs an <h1> and a first <p>`);
    return { slug, file: slug === "overview" ? "index.html" : `${slug}.html`, title, description, body };
  });
}
const guides = { en: readGuides("en"), ru: readGuides("ru") };
assert.deepEqual(guides.en.map((g) => g.slug), guides.ru.map((g) => g.slug), "EN and RU guides must match one to one");

// ---------- layout ----------

const urlOf = (rel) => SITE + rel.replace(/index\.html$/, "");

// rel: output path from the site root; alt: {en, ru} paths of the same page (ru missing for the reference).
function page({ lang, rel, alt, title, description, current, body }) {
  const L = LANGS[lang];
  const up = "../".repeat(rel.split("/").length - 1);
  const link = (p) => up + p;
  const otherLang = L.other;
  const otherHref = link(alt[otherLang] || LANGS[otherLang].dir);
  const flag = (l) => `<img src="${link(`assets/flag-${l}.svg`)}" alt="" width="20" height="14" class="h-3.5 w-5 object-cover">${l.toUpperCase()}`;
  const here = `<span class="flex items-center gap-2 py-3 text-accent">${flag(lang)}</span>`;
  const there = `<a class="flex items-center gap-2 py-3 hover:text-accent" href="${otherHref}" hreflang="${otherLang}" lang="${otherLang}" aria-label="${L.switchLabel}">${flag(otherLang)}</a>`;
  const sep = `<span class="h-4 w-px bg-line-dark" aria-hidden="true"></span>`;
  const navItems = L.nav.map(([href, label]) => href.endsWith("editor/")
    ? `<li><a class="block py-3 hover:text-accent lg:border-b-2 lg:border-accent max-lg:text-accent" href="${link(href)}" aria-current="page">${label}</a></li>`
    : `<li><a class="block py-3 hover:text-accent" href="${link(href)}">${label}</a></li>`).join("\n          ");
  const sideLink = (href, label, on) => `<li><a class="block py-1.5 hover:text-accent lg:border-l-4 lg:pl-3 ${on ? "border-accent text-accent" : "border-transparent"}" href="${href}"${on ? ' aria-current="page"' : ""}>${label}</a></li>`;
  const guideBase = link(L.dir);
  const refBase = link("editor/reference/");
  const hreflang = alt.ru
    ? `<link rel="alternate" hreflang="en" href="${urlOf(alt.en)}">\n  <link rel="alternate" hreflang="ru" href="${urlOf(alt.ru)}">\n  <link rel="alternate" hreflang="x-default" href="${urlOf(alt.en)}">`
    : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — Open Gorky Editor</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${urlOf(rel)}">
  ${hreflang}
  <meta name="theme-color" content="#101310">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Open Gorky">
  <meta property="og:url" content="${urlOf(rel)}">
  <meta property="og:title" content="${esc(title)} — Open Gorky Editor">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${SITE}assets/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${link("assets/radiation-17.svg")}" type="image/svg+xml">
  <link rel="stylesheet" href="${link("styles.css")}">
</head>
<body class="bg-char text-ivory antialiased">
  <a class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-ink" href="#main">${L.skip}</a>

  <header class="relative z-30 border-b border-line-dark">
    <div class="wrap flex h-20 items-center justify-between gap-3 lg:h-24">
      <a class="flex items-center gap-3 sm:gap-5" href="${link(lang === "ru" ? "ru/index.html" : "index.html")}" aria-label="${L.home}">
        <img src="${link("assets/radiation-17.svg")}" alt="" width="50" height="50" class="size-10 lg:size-[50px]">
        <span class="border-l border-line-dark py-2 pl-3 font-mono text-sm tracking-[.3em] sm:pl-5 sm:text-base sm:tracking-[.45em] whitespace-nowrap uppercase lg:text-lg" aria-hidden="true">Open Gorky</span>
      </a>
      <button class="flex min-h-11 items-center gap-2 border border-line-dark px-4 font-mono text-sm lg:hidden" type="button" aria-expanded="false" aria-controls="site-nav">
        <span aria-hidden="true">☰</span>${L.menu}
      </button>
      <nav id="site-nav" class="max-lg:absolute max-lg:inset-x-0 max-lg:top-20 max-lg:hidden max-lg:border-y max-lg:border-line-dark max-lg:bg-char max-lg:[&.is-open]:block" aria-label="${L.mainNav}">
        <ul class="flex font-mono text-sm max-lg:wrap max-lg:flex-col max-lg:py-4 lg:items-center lg:gap-11">
          ${navItems}
          <li class="flex items-center gap-3">${lang === "en" ? here + sep + there : there + sep + here}</li>
          <li class="max-lg:pt-3"><a class="btn border-ivory hover:not-aria-disabled:bg-ivory hover:not-aria-disabled:text-ink" data-config-link="repositoryUrl">${L.source} <span aria-hidden="true">↗</span></a></li>
        </ul>
      </nav>
    </div>
  </header>

  <div class="bg-ivory text-ink">
    <div class="wrap grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:py-10">
      <aside class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:border-r lg:border-line-light lg:pr-6">
        <div class="relative" data-docs-search data-base="${refBase}" data-guides="${guideBase}">
          <label class="sr-only" for="docs-q">${L.search}</label>
          <input id="docs-q" type="search" autocomplete="off" placeholder="${L.search}" class="w-full border border-line-light bg-transparent px-3 py-2 font-mono text-sm placeholder:text-ink/55" aria-controls="docs-results">
          <ul id="docs-results" class="absolute inset-x-0 top-full z-20 max-h-80 overflow-y-auto border border-t-0 border-line-light bg-ivory font-mono text-sm shadow-lg" hidden></ul>
        </div>
        <nav class="mt-6 font-mono text-sm" aria-label="${L.docsNav}">
          <p class="text-xs tracking-[.2em] text-accent uppercase">${L.guides}</p>
          <ul class="mt-2 max-lg:flex max-lg:flex-wrap max-lg:gap-x-4">${guides[lang].map((g) => sideLink(guideBase + g.file, esc(g.title), current === "guide:" + g.slug)).join("")}</ul>
          <p class="mt-6 text-xs tracking-[.2em] text-accent uppercase">${L.reference}</p>
          <ul class="mt-2 max-lg:flex max-lg:flex-wrap max-lg:gap-x-4">${sideLink(refBase, "Overview", current === "ref:index")}${packages.map((p) => sideLink(refBase + p.slug + ".html", p.slug === "core" || p.slug === "classic-only" ? esc(p.title) : `${p.name}::`, current === "ref:" + p.slug)).join("")}</ul>
        </nav>
      </aside>
      <main id="main" class="doc min-w-0">
        <p class="font-mono text-xs tracking-[.12em] text-accent uppercase">${L.kicker}</p>
${body}
      </main>
    </div>
  </div>

  <footer class="py-8">
    <div class="wrap flex flex-wrap items-center gap-4 font-mono text-xs text-muted">
      <img src="${link("assets/radiation-17.svg")}" alt="" width="28" height="28" loading="lazy">
      <p>${L.footer}</p>
      <button type="button" class="ml-auto shrink-0 underline underline-offset-4 hover:text-accent" data-consent-open hidden>${L.cookies}</button>
    </div>
  </footer>

  <script src="${link("site-config.js")}"></script>
  <script src="${link("editor/search-index.js")}"></script>
  <script src="${link("site.js")}"></script>
</body>
</html>
`;
}

// ---------- reference pages ----------

const sigText = (f) => `${f.id}(${f.params})${f.result ? " → " + f.result : ""}`;
const firstSentence = (s) => (s.match(/^.*?[.!?](?=\s|$)/) || [s])[0];
const badge = (t) => `<span class="badge">${t}</span>`;

function packagePage(p) {
  const all = p.groups.flatMap((g) => g.fns);
  const summary = p.groups.map((g) => `${g.title ? `<h3>${inline(g.title)}</h3>` : ""}
<div class="overflow-x-auto"><table><tbody>${g.fns.map((f) => `<tr><td class="whitespace-nowrap"><a href="#${f.anchor}"><code>${esc(f.id)}</code></a></td><td>${inline(firstSentence(f.doc))}</td></tr>`).join("")}</tbody></table></div>`).join("\n");
  const details = all.map((f) => `<section class="fn" id="${f.anchor}">
  <h3><a class="no-underline" href="#${f.anchor}"><code>${esc(sigText(f))}</code></a></h3>
  <p class="fn-meta">${f.only ? badge("OpenGorky only") : ""}${f.classic && f.classic !== "—" ? badge(`Classic: <code>${esc(f.classic)}</code>`) : ""}</p>
  <p>${inline(f.doc)}</p>
</section>`).join("\n");
  const body = `<h1>${p.slug === "core" || p.slug === "classic-only" ? esc(p.title) : `<code>${p.name}</code> — ${esc(p.title)}`}</h1>
${p.intro.map(renderBlock).join("\n")}
${p.other.map(renderBlock).join("\n")}
${all.length ? `<h2 id="summary">Summary</h2>\n${summary}\n<h2 id="functions">Functions</h2>\n${details}` : ""}`;
  const desc = p.intro.find((b) => b.type === "p")?.text.replace(/`/g, "") || p.title;
  const rel = `editor/reference/${p.slug}.html`;
  return page({ lang: "en", rel, alt: { en: rel }, title: p.slug === "core" ? "Core functions" : p.slug === "classic-only" ? "Classic-only functions" : `${p.name}:: ${p.title}`, description: firstSentence(desc), current: "ref:" + p.slug, body });
}

function referenceIndex() {
  const rows = packages.map((p) => `<tr><td class="whitespace-nowrap"><a href="${p.slug}.html">${p.slug === "core" || p.slug === "classic-only" ? esc(p.title) : `<code>${p.name}::</code>`}</a></td><td>${p.slug === "core" || p.slug === "classic-only" ? "" : esc(p.title) + ". "}${inline(firstSentence(p.intro.find((b) => b.type === "p")?.text || ""))}</td></tr>`).join("");
  const body = `<h1>Built-in functions</h1>
<p>Every function the engine gives to OG Script and Classic scripts, by package. The same descriptions appear in the editor's Reference (F1) and in its code completion. The full language is described in the <a href="${SPEC_URL}">OG Script language reference</a>.</p>
${blocks(intro.split("\n").slice(3).join("\n")).map(renderBlock).join("\n")}
<h2 id="packages">Packages</h2>
<div class="overflow-x-auto"><table><tbody>${rows}</tbody></table></div>`;
  return page({ lang: "en", rel: "editor/reference/index.html", alt: { en: "editor/reference/index.html" }, title: "Built-in functions", description: `Reference of the ${fnCount} built-in OG Script functions of the Open Gorky engine, by package.`, current: "ref:index", body });
}

// ---------- write ----------

rmSync(new URL("editor/", ROOT), { recursive: true, force: true });
rmSync(new URL("ru/editor/", ROOT), { recursive: true, force: true });

for (const lang of ["en", "ru"]) {
  guides[lang].forEach((g, i) => {
    const alt = { en: LANGS.en.dir + guides.en[i].file, ru: LANGS.ru.dir + guides.ru[i].file };
    const prev = guides[lang][i - 1], next = guides[lang][i + 1];
    const pager = `<nav class="pager" aria-label="${lang === "ru" ? "Страницы" : "Pages"}">${prev ? `<a href="${prev.file}">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${next.file}">${esc(next.title)} →</a>` : ""}</nav>`;
    write(alt[lang], page({ lang, rel: alt[lang], alt, title: g.title, description: g.description, current: "guide:" + g.slug, body: g.body + pager }));
  });
}
write("editor/reference/index.html", referenceIndex());
for (const p of packages) write(`editor/reference/${p.slug}.html`, packagePage(p));

// Search index: functions (EN) and guides (both languages); site.js filters it.
const index = {
  fns: packages.flatMap((p) => p.groups.flatMap((g) => g.fns.map((f) => [f.id, f.classic, `${p.slug}.html#${f.anchor}`, firstSentence(f.doc)]))),
  guides: { en: guides.en.map((g) => [g.title, g.file]), ru: guides.ru.map((g) => [g.title, g.file]) },
};
write("editor/search-index.js", `// Generated by scripts/docs.mjs.\nwindow.EDITOR_INDEX = ${JSON.stringify(index)};\n`);

// Sitemap: the hand-written pages first, then every generated one.
const sm = readFileSync(new URL("sitemap.xml", ROOT), "utf8").replace(/\s*<!-- docs -->[\s\S]*<!-- \/docs -->/, "");
const pair = (en, ru) => `<xhtml:link rel="alternate" hreflang="en" href="${urlOf(en)}"/><xhtml:link rel="alternate" hreflang="ru" href="${urlOf(ru)}"/>`;
const docUrls = [
  ...guides.en.flatMap((g, i) => { const en = LANGS.en.dir + g.file, ru = LANGS.ru.dir + guides.ru[i].file; return [`<url><loc>${urlOf(en)}</loc>${pair(en, ru)}</url>`, `<url><loc>${urlOf(ru)}</loc>${pair(en, ru)}</url>`]; }),
  `<url><loc>${urlOf("editor/reference/index.html")}</loc></url>`,
  ...packages.map((p) => `<url><loc>${urlOf(`editor/reference/${p.slug}.html`)}</loc></url>`),
];
writeFileSync(new URL("sitemap.xml", ROOT), sm.replace("</urlset>", `  <!-- docs -->\n  ${docUrls.join("\n  ")}\n  <!-- /docs -->\n</urlset>`));

console.log(`docs: ${guides.en.length} guides × 2 languages, ${packages.length} packages, ${fnCount} functions`);
