// Single source of truth for external URLs, builds and FAQ answers.
// null = intentionally unset. Unset links render as visibly unavailable controls.
window.SITE_CONFIG = {
  // The one place to bump on release. Downloads and the version label use it; .github/workflows/release.yml rewrites this line.
  version: "v0.1.0",
  githubRepo: "m1ome/opengorky",
  // Google Analytics 4 Measurement ID, e.g. "G-XXXXXXXXXX". null = no analytics, no consent banner.
  // GA loads only after the visitor clicks Accept in the cookie banner.
  gaMeasurementId: "G-BZEGXREPPF",
  repositoryUrl: "https://github.com/m1ome/opengorky",
  issuesUrl: "https://github.com/m1ome/opengorky/issues",
  releasesUrl: "https://github.com/m1ome/opengorky/releases",
  // Download URL = github.com/<githubRepo>/releases/download/<version>/<asset>.
  // hero: false = only listed in the Downloads section, not under the hero buttons.
  downloads: [
    { platform: "Windows", arch: "x86_64", asset: "opengorky-windows-x86_64.zip" },
    { platform: "macOS", arch: "Apple Silicon & Intel", asset: "OpenGorky-macos-x86_64-arm64.zip" },
    { platform: "Linux", arch: "x86_64", asset: "opengorky-linux-x86_64.tar.xz" },
    { platform: "Linux", arch: "aarch64", asset: "opengorky-linux-aarch64.tar.xz", hero: false }
  ],
  // categories: start = Getting started, project = The project, contribute = Contributing, config = Configuration.
  // Answers may contain \n for line breaks.
  faq: [
    { id: "project", question: "What is Open Gorky?", answer: "An independent, open-source reimplementation of Gorky 17 in Zig.", categories: ["start", "project"] },
    { id: "data", question: "Are the original game files included?", answer: "No. You need the original game files, for example the GOG version. None are included in the repository or in the release packages. Open Gorky only reads the dat/ and avi/ folders and adjust.kdt from your installation.", categories: ["start"] },
    { id: "install", question: "How do I install a build?", answer: "Download the package for your platform and unpack it. Windows: run OpenGorky.exe (if SmartScreen warns, choose More info → Run anyway). macOS: open OpenGorky.app. Linux: run ./opengorky <game dir>. On first launch it asks for your Gorky 17 folder.", categories: ["start"] },
    { id: "platforms", question: "Which platforms are supported?", answer: "Prebuilt packages are published for macOS 13+ (Apple Silicon and Intel), Windows 10+ (x86_64) and Linux x86_64 / aarch64 (glibc 2.41+).", categories: ["start"] },
    { id: "bugs", question: "Where can I report a bug?", answer: "Open an issue in the GitHub issue tracker: github.com/m1ome/opengorky/issues.", categories: ["contribute"] },
    { id: "contribute", question: "How can I contribute?", answer: "The source code is on GitHub: github.com/m1ome/opengorky. Build instructions (Zig 0.17 + SDL3) are in the repository README; use issues and pull requests there.", categories: ["contribute"] },
    { id: "official", question: "Is this an official project?", answer: "This is an independent fan project. Not affiliated with the original rights holders.", categories: ["project"] },
    { id: "config-files", question: "Where are the settings and saves stored?", answer: "Settings (opengorky.cfg) and mods live in the settings folder, saves in its saves/ subfolder:\nmacOS: ~/Library/Application Support/OpenGorky/\nLinux: $XDG_CONFIG_HOME/opengorky/ (default ~/.config/opengorky/); saves in $XDG_DATA_HOME/opengorky/saves/ (default ~/.local/share/opengorky/saves/)\nWindows: %APPDATA%\\OpenGorky\\\nOPENGORKY_SAVES points saves to another folder.", categories: ["config"] },
    { id: "config-edit", question: "How do I change the settings?", answer: "Edit opengorky.cfg: plain text, one key = value per line, # starts a comment. It is created with defaults and explanations on the first launch. When a newer version adds keys, the file is rewritten with them added: your values are kept, your own comments are not. Unknown keys and bad values are ignored. On/off keys accept 1/0, on/off or true/false.", categories: ["config"] },
    { id: "config-keys", question: "Which settings are available?", answer: "scaling (integer): how the 640×480 frame fills the window. integer = crisp pixels, may leave borders; sharp = fill with sharp pixels; smooth = fill, smoothed.\nhires (1): draw models, shadows and effects at window resolution; 0 = 640×480 like the original.\nupscale (xbr): UI, icons and portraits with hires. xbr = smoothed edges; off = original pixels, just larger.\nfullscreen (0): start in fullscreen.\nfps_limit (60): frame cap in the focused window; 0 = display rate (vsync). The world always runs at 30 ticks per second.\nfps_background (15): frame cap when the window is not focused; 0 = same as focused.\npause_background (1): pause game and sound when the window loses focus or is minimized.\nlog (warn): terminal messages: none, warn, info.\ndebug (0): debug overlays.\nconsole (0): developer console (` or F2).\ngame_path (empty): the game folder used when none is given at launch.", categories: ["config"] },
    { id: "config-scaling", question: "How do I switch scaling or fullscreen in the game?", answer: "F10 cycles scaling: integer / sharp / smooth. F11, Alt+Enter or Cmd+Enter toggles fullscreen. Both are saved back to opengorky.cfg.", categories: ["config"] },
    { id: "config-gamepath", question: "How do I change the game folder?", answer: "The folder is stored as game_path in opengorky.cfg. It is set automatically on the first launch with a path or after picking the folder; edit it there to switch. On Linux you can also pass it at launch: ./opengorky <game dir>. For the macOS app, OPENGORKY_GAME overrides game_path.", categories: ["config"] },
    { id: "config-cli", question: "Which command-line options and environment variables are there?", answer: "--mute / --no-sfx: no sound; no sound effects or voices (also OPENGORKY_MUTE, OPENGORKY_NO_SFX).\n--fps N: frame cap instead of fps_limit (0 = display rate).\n--hires N: fixed frame detail 1–4× instead of following the window size.\n--upscale xbr|off: instead of the upscale setting.\n--window W,H: initial window size in points (default 1280,960).\n--dev: enable the developer console even with console = 0.\nOPENGORKY_SAVES, OPENGORKY_MODS, OPENGORKY_GAME: saves folder, mods folder, game folder (macOS app).", categories: ["config"] },
    { id: "config-mods", question: "Can I use mods?", answer: "Yes. Scripts and objects placed in <game>/mods or <settings folder>/mods (or $OPENGORKY_MODS) are looked up before the game archives, so levels, fighters and weapons can be changed or added without touching the original files. Custom fighters use the generic class (classType = 100): attacks, AI and resistances come from their .ftr/.wpn fields.", categories: ["config"] }
  ]
};
