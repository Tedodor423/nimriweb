require('dotenv').config();

const fs = require("fs");
const path = require("path");


// const sortByDisplayOrder = require('./src/utils/sort-by-display-order.js');
//const matter = require('gray-matter');
const markdownIt = require('markdown-it');
const HEAD_MARK = "__HEAD_INJECT_MARKER__";

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function encodePath(filePath) {
  return filePath
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
}

function relativeOutputPath(fromUrl, toUrl) {
  if (!fromUrl || !toUrl.startsWith("/")) {
    return toUrl;
  }

  const fromDir = fromUrl.endsWith("/")
    ? fromUrl
    : `${path.posix.dirname(fromUrl)}/`;
  const relativePath = path.posix.relative(fromDir, toUrl);

  return relativePath || path.posix.basename(toUrl);
}

function getPublicPathForSource(sourcePath) {
  const srcRoot = path.resolve("src");
  const absolutePath = path.resolve(sourcePath);

  if (!absolutePath.startsWith(srcRoot)) {
    return null;
  }

  return `/${toPosixPath(path.relative(srcRoot, absolutePath))}`;
}

function resolveObsidianImagePath(target, env = {}) {
  if (/^(?:[a-z]+:)?\/\//i.test(target) || target.startsWith("/") || target.startsWith("#")) {
    return encodeURI(target);
  }

  const normalizedTarget = target.replace(/\\/g, "/");
  const page = env.page || {};
  const inputPath = page.inputPath ? path.resolve(page.inputPath) : null;
  const pageName = env.name;
  const pageSlug = page.fileSlug || (inputPath ? path.basename(inputPath, path.extname(inputPath)) : "");
  const trimmedTarget = normalizedTarget.replace(/^(\.\.\/|\.\/)+/, "");
  const candidates = [];

  if (inputPath) {
    candidates.push(path.resolve(path.dirname(inputPath), normalizedTarget));
  }

  if (pageName && pageSlug) {
    candidates.push(path.resolve("src", pageName, "assets", pageSlug, trimmedTarget));
  }

  if (pageName) {
    candidates.push(path.resolve("src", pageName, "assets", trimmedTarget));
  }

  candidates.push(path.resolve("src", "assets", trimmedTarget));

  const foundPath = candidates.find(candidate => fs.existsSync(candidate));
  const publicPath = foundPath ? getPublicPathForSource(foundPath) : normalizedTarget;
  const encodedPath = publicPath.startsWith("/")
    ? `/${encodePath(publicPath.slice(1))}`
    : encodePath(publicPath);

  return relativeOutputPath(page.url, encodedPath);
}

function obsidianImagePlugin(md) {
  const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

  md.inline.ruler.before("emphasis", "obsidian_image", function obsidianImage(state, silent) {
    if (state.src.slice(state.pos, state.pos + 3) !== "![[") {
      return false;
    }

    const endPos = state.src.indexOf("]]", state.pos + 3);
    if (endPos === -1) {
      return false;
    }

    const rawTarget = state.src.slice(state.pos + 3, endPos).trim();
    if (!rawTarget) {
      return false;
    }

    const parts = rawTarget.split("|").map(part => part.trim()).filter(Boolean);
    const target = parts.shift();

    if (!imageExtension.test(target)) {
      return false;
    }

    if (!silent) {
      const token = state.push("obsidian_image", "img", 0);
      const dimensions = parts.find(part => /^\d+(?:x\d+)?$/i.test(part));
      const alt = parts.find(part => part !== dimensions) || path.basename(target);

      token.attrSet("src", resolveObsidianImagePath(target, state.env));
      token.attrSet("alt", alt);
      token.attrSet("loading", "lazy");
      token.attrSet("decoding", "async");

      if (dimensions) {
        const [width, height] = dimensions.toLowerCase().split("x");
        token.attrSet("width", width);

        if (height) {
          token.attrSet("height", height);
        }
      }
    }

    state.pos = endPos + 2;
    return true;
  });
}

function markdownImageSizePlugin(md) {
  const defaultImageRender = md.renderer.rules.image || function defaultImageRender(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.image = function imageRender(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const src = token.attrGet("src");

    if (src) {
      const srcParts = src.match(/^(.+?)(?:\||%7C|%7c)(\d+(?:x\d+)?)([?#].*)?$/);

      if (srcParts) {
        const [, imageSrc, dimensions, suffix = ""] = srcParts;
        const [width, height] = dimensions.toLowerCase().split("x");

        token.attrSet("src", imageSrc + suffix);
        token.attrSet("width", width);

        if (height) {
          token.attrSet("height", height);
        }
      }
    }

    return defaultImageRender(tokens, idx, options, env, self);
  };
}

function markdownFileLinkPlugin(md) {
  const defaultLinkOpenRender = md.renderer.rules.link_open || function defaultLinkOpenRender(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  const fileExtension = /\.(?:pdf|docx?|pptx?|xlsx?|csv|zip|txt)(?:[?#].*)?$/i;
  const externalUrl = /^https?:\/\//i;

  md.renderer.rules.link_open = function linkOpenRender(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const href = token.attrGet("href");

    if (href && (fileExtension.test(href) || externalUrl.test(href))) {
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener");
    }

    return defaultLinkOpenRender(tokens, idx, options, env, self);
  };
}

function renderCollapsibleNodes(nodes, idCounter) {
  return nodes.map(node => {
    if (typeof node === "string") {
      return node;
    }

    const contentId = `collapsible-section-${idCounter.next++}`;
    const children = renderCollapsibleNodes(node.children, idCounter);

    return [
      `<section class="collapsible-section collapsible-heading-${node.level}" data-heading-level="${node.level}">`,
      `<h${node.level}${node.attrs}>`,
      `<button class="heading-collapse-toggle" type="button" aria-expanded="true" aria-controls="${contentId}">`,
      `<span class="heading-collapse-arrow" aria-hidden="true"></span>`,
      `<span class="visually-hidden">Toggle section</span>`,
      `</button>`,
      `<span class="heading-title">${node.heading}</span>`,
      `</h${node.level}>`,
      `<div class="collapsible-content" id="${contentId}">`,
      children,
      `</div>`,
      `</section>`,
    ].join("");
  }).join("");
}

function makeHeadingsCollapsible(html) {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);

  if (!mainMatch) {
    return html;
  }

  const mainInner = mainMatch[1];
  const headingRegex = /<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const root = { level: 1, children: [] };
  const stack = [root];
  let lastIndex = 0;
  let matchedHeading = false;

  for (const match of mainInner.matchAll(headingRegex)) {
    matchedHeading = true;

    const beforeHeading = mainInner.slice(lastIndex, match.index);
    if (beforeHeading) {
      stack[stack.length - 1].children.push(beforeHeading);
    }

    const level = Number(match[1]);
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const section = {
      level,
      attrs: match[2],
      heading: match[3],
      children: [],
    };

    stack[stack.length - 1].children.push(section);
    stack.push(section);
    lastIndex = match.index + match[0].length;
  }

  if (!matchedHeading) {
    return html;
  }

  const afterLastHeading = mainInner.slice(lastIndex);
  if (afterLastHeading) {
    stack[stack.length - 1].children.push(afterLastHeading);
  }

  const collapsedMain = renderCollapsibleNodes(root.children, { next: 1 });

  return html.replace(mainInner, collapsedMain);
}

module.exports = function(eleventyConfig) {
  
  // Passthrough copy
  eleventyConfig.addPassthroughCopy({ "src/assets":          "assets" });
  eleventyConfig.addPassthroughCopy({ "src/theo/assets":     "theo/assets" });
  eleventyConfig.addPassthroughCopy({ "src/arnost/assets":   "arnost/assets" });

  eleventyConfig.addPassthroughCopy({ "src/_includes/fonts": "fonts"});
  eleventyConfig.addPassthroughCopy({ "src/google7c93c9bfb4d70535.html": "google7c93c9bfb4d70535.html"});

  // CSS management
  eleventyConfig.addShortcode("addCSS", function(file) {
    console.log("Adding CSS file:", file, this.page.pageCSS);
    // initialize per-page CSS array if it doesn’t exist yet
    this.page.pageCSS = this.page.pageCSS || new Set();
    this.page.pageCSS.add(file);
    return "";
  });

  eleventyConfig.addShortcode("renderCSS", function() {
    if (!this.page.pageCSS) return "";

    return Array.from(this.page.pageCSS)
      .map(file => {
        const filePath = path.join("src/_includes/css/", file); // adjust to your includes dir
        const css = fs.readFileSync(filePath, "utf8");
        return `<style>${css}</style>`;
      })
      .join("\n");
  });

  // JS management
  eleventyConfig.addShortcode("addJS", function(file) {
    console.log("Adding JS file:", file, this.page.pageJS);
    // initialize per-page JS array if it doesn’t exist yet
    this.page.pageJS = this.page.pageJS || new Set();
    this.page.pageJS.add(file);
    return "";
  });

  eleventyConfig.addShortcode("renderJS", function() {
    if (!this.page.pageJS) return "";

    return Array.from(this.page.pageJS)
      .map(file => {
        const filePath = path.join("src/_includes/js/", file); // adjust to your includes dir
        const js = fs.readFileSync(filePath, "utf8");
        console.log("Rendering JS file:", js);
        return `<script>${js}</script>`;
      })
      .join("\n");
  });


  // Filters
  eleventyConfig.addFilter("year", () => {
    return new Date().getFullYear();
  });

  const md = new markdownIt()
    .use(obsidianImagePlugin)
    .use(markdownImageSizePlugin)
    .use(markdownFileLinkPlugin);
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("md", content => md.render(content));

  eleventyConfig.addTransform("collapsibleHeadings", function(content, outputPath) {
    if (
      outputPath &&
      outputPath.endsWith(".html") &&
      content.includes("heading-collapse-toggle")
    ) {
      return makeHeadingsCollapsible(content);
    }

    return content;
  });

  // Minify HTML output
  eleventyConfig.addTransform("htmlmin", async function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return await htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      });
    }
    return content;
  });

  return {
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: "src",
      output: process.env.ELEVENTY_OUTPUT || "/var/www/html"
    }
  };
};

const htmlmin = require("html-minifier-terser");

