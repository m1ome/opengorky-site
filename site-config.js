// Single source of truth for external URLs, builds and FAQ answers.
// null = intentionally unset. Unset links render as visibly unavailable controls.
window.SITE_CONFIG = {
  // The one place to bump on release. Downloads and the version label use it; .github/workflows/release.yml rewrites this line.
  version: "v0.1.0",
  githubRepo: "m1ome/opengorky",
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
  // categories: start = Getting started, project = The project, contribute = Contributing
  faq: [
    { id: "project", question: "What is Open Gorky?", answer: "An independent, open-source reimplementation of Gorky 17 in Zig.", categories: ["start", "project"] },
    { id: "data", question: "Are the original game files included?", answer: "No. You need the original game files, for example the GOG version. None are included in the repository or in the release packages. Open Gorky only reads the dat/ and avi/ folders and adjust.kdt from your installation.", categories: ["start"] },
    { id: "install", question: "How do I install a build?", answer: "Download the package for your platform and unpack it. Windows: run OpenGorky.exe. macOS: right-click OpenGorky.app and choose Open the first time (the app is not notarized). Linux: run ./opengorky <game dir>. On first launch it asks for your Gorky 17 folder.", categories: ["start"] },
    { id: "platforms", question: "Which platforms are supported?", answer: "Prebuilt packages are published for macOS 13+ (Apple Silicon and Intel), Windows 10+ (x86_64) and Linux x86_64 / aarch64 (glibc 2.41+).", categories: ["start"] },
    { id: "bugs", question: "Where can I report a bug?", answer: "Open an issue in the GitHub issue tracker: github.com/m1ome/opengorky/issues.", categories: ["contribute"] },
    { id: "contribute", question: "How can I contribute?", answer: "The source code is on GitHub: github.com/m1ome/opengorky. Build instructions (Zig 0.17 + SDL3) are in the repository README; use issues and pull requests there.", categories: ["contribute"] },
    { id: "official", question: "Is this an official project?", answer: "This is an independent fan project. Not affiliated with the original rights holders.", categories: ["project"] }
  ]
};
