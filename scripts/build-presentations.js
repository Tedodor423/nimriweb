const fs = require("fs");
const path = require("path");

const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src", "p");
const themeSource = path.join(projectRoot, "scripts", "presentation-assets", "theme.css");
const revealSource = path.join(projectRoot, "node_modules", "reveal.js", "dist");
const outputRoot = path.resolve(projectRoot, process.env.ELEVENTY_OUTPUT || "_site");
const presentationRoot = path.join(outputRoot, "p");
const markdown = new MarkdownIt({
  html: true,
  linkify: true
});

const watchMode = process.argv.includes("--watch");

markdown.core.ruler.after("inline", "rewrite_relative_urls", (state) => {
  for (const token of state.tokens) {
    rewriteTokenUrls(token);
    if (!token.children) {
      continue;
    }
    for (const child of token.children) {
      rewriteTokenUrls(child);
    }
  }
});

function rewriteTokenUrls(token) {
  if (!token || !token.attrs) {
    return;
  }
  for (const attributeName of ["href", "src"]) {
    const attributeIndex = token.attrIndex(attributeName);
    if (attributeIndex < 0) {
      continue;
    }
    token.attrs[attributeIndex][1] = rewriteRelativeUrl(token.attrs[attributeIndex][1]);
  }
}

function rewriteRelativeUrl(url) {
  if (!url || isExternalUrl(url) || url.startsWith("/") || url.startsWith("#")) {
    return url;
  }

  const match = url.match(/^([^?#]*)([?#].*)?$/);
  const rawPath = match ? match[1] : url;
  const suffix = match ? match[2] || "" : "";
  const normalizedPath = rawPath.replace(/\\/g, "/");

  if (normalizedPath.endsWith(".md")) {
    return normalizeUrlPath(`../${normalizedPath.replace(/\.md$/i, "/")}${suffix}`);
  }

  return normalizeUrlPath(`../${normalizedPath}${suffix}`);
}

function isExternalUrl(url) {
  return /^(?:[a-z]+:)?\/\//i.test(url) || /^(?:mailto|tel|data):/i.test(url);
}

function normalizeUrlPath(value) {
  return path.posix.normalize(value.replace(/\\/g, "/"));
}

function splitSlides(content, separator) {
  const groups = [[]];
  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    if (line.trim() === separator) {
      groups.push([]);
      continue;
    }
    groups[groups.length - 1].push(line);
  }
  return groups.map((group) => group.join("\n").trim()).filter(Boolean);
}

function renderSlides(content) {
  const slides = [];
  let currentSlide = [];

  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const trimmedLine = line.trim();
    if (trimmedLine === "---" || trimmedLine === "--") {
      const slideContent = currentSlide.join("\n").trim();
      if (slideContent) {
        slides.push(slideContent);
      }
      currentSlide = [];
      continue;
    }
    currentSlide.push(line);
  }

  const trailingSlide = currentSlide.join("\n").trim();
  if (trailingSlide) {
    slides.push(trailingSlide);
  }

  const verticalSlides = slides
    .map((slide) => `<section>${markdown.render(slide)}</section>`)
    .join("\n");

  return `<section>\n${verticalSlides}\n</section>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function copyDirectory(sourcePath, destinationPath) {
  ensureDirectory(destinationPath);
  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const sourceEntryPath = path.join(sourcePath, entry.name);
    const destinationEntryPath = path.join(destinationPath, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourceEntryPath, destinationEntryPath);
      continue;
    }
    fs.copyFileSync(sourceEntryPath, destinationEntryPath);
  }
}

function walkFiles(rootPath) {
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
      continue;
    }
    files.push(entryPath);
  }
  return files;
}

function humanizeSlug(slug) {
  return slug
    .split("/")
    .pop()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildLocalLinkRewriteScript() {
  return `<script>
      document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("a").forEach(function(link) {
          var href = link.getAttribute("href");
          if (
            href &&
            href.startsWith("/") &&
            !href.startsWith("/p/") &&
            window.location.hostname.startsWith("localhost")
          ) {
            link.setAttribute("href", "/theo" + href);
          }
        });
      });
    </script>`;
}

function buildDeckHtml(deck, assetPrefix) {
  const description = deck.description || "Presentation on t.nimrichtr.cz";
  const title = escapeHtml(deck.title);
  const pageDescription = escapeHtml(description);
  const canonicalUrl = `https://t.nimrichtr.cz/p/${deck.route}`;
  const revealConfig = {
    controls: true,
    controlsTutorial: false,
    hash: true,
    progress: true,
    slideNumber: "c/t",
    center: false,
    margin: 0.06,
    width: 1400,
    height: 900,
    transition: deck.transition || "slide"
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>${title}</title>
    <meta name="description" content="${pageDescription}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${pageDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="https://nimrichtr.cz/assets/identity/summary.png" />
    <meta name="theme-color" content="#002147" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="icon" href="https://nimrichtr.cz/assets/identity/favicon.ico" />
    <link rel="stylesheet" href="/fonts/fonts.css" />
    <link rel="stylesheet" href="${assetPrefix}assets/reveal/reset.css" />
    <link rel="stylesheet" href="${assetPrefix}assets/reveal/reveal.css" />
    <link rel="stylesheet" href="${assetPrefix}assets/reveal/theme/white.css" />
    <link rel="stylesheet" href="${assetPrefix}assets/theme.css" />
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
${deck.slidesHtml}
      </div>
    </div>

    <script src="${assetPrefix}assets/reveal/reveal.js"></script>
    <script src="${assetPrefix}assets/reveal/plugin/highlight.js"></script>
    <script>
      Reveal.initialize(Object.assign(${JSON.stringify(revealConfig, null, 2)}, {
        plugins: [ RevealHighlight ]
      }));
    </script>
    ${buildLocalLinkRewriteScript()}
  </body>
</html>
`;
}

function buildDirectoryHtml(decks) {
  const cards = decks.length
    ? decks
        .map((deck) => {
          const description = deck.description
            ? `<p>${escapeHtml(deck.description)}</p>`
            : "<p>Open the deck.</p>";
          return `        <a class="presentation-card" href="./${deck.route}">
          <h2>${escapeHtml(deck.title)}</h2>
${description}
          <span class="presentation-path">/p/${escapeHtml(deck.route)}</span>
        </a>`;
        })
        .join("\n")
    : "        <p>No presentations yet.</p>";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presentations</title>
    <meta name="description" content="Presentations on t.nimrichtr.cz" />
    <meta name="theme-color" content="#002147" />
    <link rel="canonical" href="https://t.nimrichtr.cz/p/" />
    <link rel="icon" href="https://nimrichtr.cz/assets/identity/favicon.ico" />
    <link rel="stylesheet" href="/fonts/fonts.css" />
    <link rel="stylesheet" href="./assets/theme.css" />
  </head>
  <body>
    <main class="presentation-directory">
      <h1>Presentations</h1>
      <p>Markdown files in <code>src/p</code> are built here as reveal.js decks.</p>
      <section class="presentation-grid">
${cards}
      </section>
    </main>
    ${buildLocalLinkRewriteScript()}
  </body>
</html>
`;
}

function buildPresentations() {
  ensureDirectory(sourceRoot);
  fs.rmSync(presentationRoot, { recursive: true, force: true });
  ensureDirectory(path.join(presentationRoot, "assets"));

  if (!fs.existsSync(revealSource)) {
    throw new Error("reveal.js is not installed in node_modules.");
  }

  copyDirectory(revealSource, path.join(presentationRoot, "assets", "reveal"));
  fs.copyFileSync(themeSource, path.join(presentationRoot, "assets", "theme.css"));

  const files = walkFiles(sourceRoot);
  const markdownFiles = files.filter((filePath) => filePath.toLowerCase().endsWith(".md"));
  const assetFiles = files.filter((filePath) => !filePath.toLowerCase().endsWith(".md"));

  for (const assetFile of assetFiles) {
    const relativePath = path.relative(sourceRoot, assetFile);
    const outputPath = path.join(presentationRoot, relativePath);
    ensureDirectory(path.dirname(outputPath));
    fs.copyFileSync(assetFile, outputPath);
  }

  const decks = markdownFiles
    .map((filePath) => {
      const relativePath = path.relative(sourceRoot, filePath);
      const routePath = toPosix(relativePath.replace(/\.md$/i, "/"));
      const outputDirectory = path.join(presentationRoot, relativePath.replace(/\.md$/i, ""));
      const outputFile = path.join(outputDirectory, "index.html");
      const deckSource = fs.readFileSync(filePath, "utf8");
      const parsed = matter(deckSource);
      const title = parsed.data.title || humanizeSlug(toPosix(relativePath.replace(/\.md$/i, "")));
      const description = parsed.data.description || "";
      const slidesHtml = indentSlides(renderSlides(parsed.content.trim()));
      const assetPrefix = `${"../".repeat(routePath.split("/").filter(Boolean).length)}`;

      ensureDirectory(outputDirectory);
      fs.writeFileSync(outputFile, buildDeckHtml({
        description,
        route: routePath,
        slidesHtml,
        title,
        transition: parsed.data.transition
      }, assetPrefix));

      return {
        description,
        route: routePath,
        title
      };
    })
    .sort((left, right) => left.route.localeCompare(right.route));

  fs.writeFileSync(path.join(presentationRoot, "index.html"), buildDirectoryHtml(decks));
  console.log(`Built ${decks.length} presentation(s) into ${presentationRoot}`);
}

function indentSlides(slidesHtml) {
  return slidesHtml
    .split("\n")
    .map((line) => `        ${line}`)
    .join("\n");
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function createSnapshot() {
  const trackedFiles = [];
  for (const rootPath of [sourceRoot, themeSource]) {
    if (!fs.existsSync(rootPath)) {
      continue;
    }
    const stats = fs.statSync(rootPath);
    if (stats.isDirectory()) {
      for (const filePath of walkFiles(rootPath)) {
        const fileStats = fs.statSync(filePath);
        trackedFiles.push(`${path.relative(projectRoot, filePath)}:${fileStats.mtimeMs}:${fileStats.size}`);
      }
      continue;
    }
    trackedFiles.push(`${path.relative(projectRoot, rootPath)}:${stats.mtimeMs}:${stats.size}`);
  }
  return trackedFiles.sort().join("|");
}

function watchPresentations() {
  let snapshot = "";
  const rebuild = () => {
    try {
      buildPresentations();
      snapshot = createSnapshot();
    } catch (error) {
      console.error(error.stack || error.message);
    }
  };

  rebuild();
  console.log("Watching src/p for presentation changes...");

  setInterval(() => {
    const nextSnapshot = createSnapshot();
    if (nextSnapshot === snapshot) {
      return;
    }
    rebuild();
  }, 1000);
}

if (watchMode) {
  watchPresentations();
} else {
  buildPresentations();
}
