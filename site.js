(function () {
  var cfg = window.SITE_CONFIG || {};

  // Links whose target lives in config: <a data-config-link="repositoryUrl">.
  // Unset -> stays an <a> without href (not focusable) with a visible "not linked yet" note.
  document.querySelectorAll("[data-config-link]").forEach(function (el) {
    var url = cfg[el.getAttribute("data-config-link")];
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
      return;
    }
    el.setAttribute("aria-disabled", "true");
    el.insertAdjacentHTML("beforeend", '<span class="basis-full text-[10px] tracking-wider uppercase opacity-80">not linked yet</span>');
  });

  // Platform downloads (hero row + downloads section), all pinned to cfg.version
  var downloads = cfg.downloads || [];
  function assetUrl(d) {
    return cfg.githubRepo && cfg.version && d.asset
      ? "https://github.com/" + cfg.githubRepo + "/releases/download/" + encodeURIComponent(cfg.version) + "/" + encodeURIComponent(d.asset)
      : null;
  }
  document.querySelectorAll("[data-downloads]").forEach(function (list) {
    var isHero = list.getAttribute("data-downloads") === "hero";
    downloads.forEach(function (d) {
      if (isHero && d.hero === false) return;
      var url = assetUrl(d);
      var li = document.createElement("li");
      li.className = isHero ? "border-l border-line-dark px-6 first:border-0 first:pl-0 sm:px-10" : "border-b border-line-dark";
      var el = document.createElement(url ? "a" : "span");
      el.className = url
        ? "inline-flex min-h-11 items-center gap-2 underline underline-offset-4 hover:text-accent"
        : "inline-flex min-h-11 cursor-not-allowed items-center gap-2 text-muted line-through decoration-1";
      el.textContent = d.platform + (!isHero && d.arch ? " " + d.arch : "") + " ";
      el.insertAdjacentHTML("beforeend", '<span aria-hidden="true">↓</span>');
      if (url) {
        el.href = url;
        el.setAttribute("data-download", JSON.stringify({ platform: d.platform, arch: d.arch || "", version: cfg.version }));
      } else {
        el.setAttribute("aria-disabled", "true");
        el.insertAdjacentHTML("beforeend", '<span class="sr-only"> (not available)</span>');
      }
      li.appendChild(el);
      list.appendChild(li);
    });
  });
  var anyAvailable = downloads.some(assetUrl);
  document.querySelectorAll("[data-downloads-note]").forEach(function (n) { n.hidden = anyAvailable; });
  document.querySelectorAll("[data-release-version]").forEach(function (el) {
    el.textContent = "Version " + cfg.version;
    el.hidden = !anyAvailable;
  });

  // Analytics: GA4 is loaded only after explicit consent; the choice lives in localStorage.
  var gaId = /^G-[A-Z0-9]+$/.test(cfg.gaMeasurementId || "") ? cfg.gaMeasurementId : null;
  var CONSENT_KEY = "og-analytics-consent";
  var gaLoaded = false;
  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function saveConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* private mode: ask again next visit */ }
  }
  function loadGa() {
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.gtag("js", new Date());
    window.gtag("config", gaId);
    var sc = document.createElement("script");
    sc.async = true;
    sc.src = "https://www.googletagmanager.com/gtag/js?id=" + gaId;
    document.head.appendChild(sc);
  }
  function revokeGa() {
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name.indexOf("_ga") === 0) {
        document.cookie = name + "=; Max-Age=0; path=/";
        document.cookie = name + "=; Max-Age=0; path=/; domain=." + location.hostname.replace(/^www\./, "");
      }
    });
  }

  var banner = null;
  function showBanner() {
    if (banner) { banner.hidden = false; return; }
    banner = document.createElement("section");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.className = "fixed inset-x-0 bottom-0 z-40 border-t border-line-dark bg-char/95 text-ivory backdrop-blur-sm";
    banner.innerHTML =
      '<div class="wrap flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">' +
        '<p class="max-w-2xl font-mono text-xs leading-relaxed text-muted sm:text-sm"><span class="text-accent">Field note /</span> ' +
        'With your permission we use Google Analytics cookies to count visits and downloads. Nothing is loaded until you accept.</p>' +
        '<div class="flex shrink-0 gap-3">' +
          '<button type="button" data-consent="granted" class="btn border-accent bg-accent text-ink hover:border-ivory hover:bg-ivory">Accept</button>' +
          '<button type="button" data-consent="denied" class="btn border-ivory hover:bg-ivory hover:text-ink">Decline</button>' +
        "</div>" +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var v = b.getAttribute("data-consent");
      saveConsent(v);
      if (v === "granted") loadGa(); else revokeGa();
      banner.hidden = true;
    });
    document.body.appendChild(banner);
  }

  if (gaId) {
    var consent = readConsent();
    if (consent === "granted") loadGa();
    else if (consent !== "denied") showBanner();
    document.querySelectorAll("[data-consent-open]").forEach(function (b) {
      b.hidden = false;
      b.addEventListener("click", showBanner);
    });
    // GA4's built-in file_download misses .tar.xz, so downloads get their own event.
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-download]");
      if (a && window.gtag && readConsent() === "granted") window.gtag("event", "download", JSON.parse(a.getAttribute("data-download")));
    });
  }

  // Mobile navigation
  var toggle = document.querySelector('[aria-controls="site-nav"]');
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a[href]")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // FAQ: category filters + accordion built from config
  var faqList = document.getElementById("faq-list");
  if (!faqList) return;
  var heading = document.getElementById("faq-heading");
  var buttons = document.querySelectorAll("[data-category]");
  var INITIAL_OPEN = ["project", "data"];

  (cfg.faq || []).forEach(function (item) {
    var d = document.createElement("details");
    d.className = "group border-b border-line-light";
    d.dataset.categories = item.categories.join(" ");
    d.open = INITIAL_OPEN.indexOf(item.id) !== -1;
    var s = document.createElement("summary");
    s.className = "flex cursor-pointer list-none items-start gap-6 py-5 hover:text-accent lg:gap-12 [&::-webkit-details-marker]:hidden";
    s.innerHTML =
      '<span aria-hidden="true" class="relative mt-3 size-5 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-current group-open:text-accent group-open:after:hidden"></span>' +
      '<span class="min-w-0 text-2xl leading-tight font-medium tracking-wide sm:text-[28px]"></span>';
    s.lastChild.textContent = item.question;
    var p = document.createElement("p");
    p.className = "-mt-2 pb-6 pl-11 font-mono text-sm leading-relaxed sm:text-[15px] lg:pl-[68px]" + (item.answer ? "" : " text-ink/65 italic");
    p.textContent = item.answer || "This information has not been published yet.";
    d.append(s, p);
    faqList.appendChild(d);
  });

  // Focus stays on the pressed filter button; the live region announces the new heading.
  function select(btn) {
    var cat = btn.getAttribute("data-category");
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    faqList.querySelectorAll("details").forEach(function (d) {
      d.hidden = d.dataset.categories.split(" ").indexOf(cat) === -1;
    });
    heading.textContent = btn.getAttribute("data-label");
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () { select(b); });
  });
  select(buttons[0]);
})();
