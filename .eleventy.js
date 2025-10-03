require('dotenv').config();

const fs = require("fs");
const path = require("path");


// const sortByDisplayOrder = require('./src/utils/sort-by-display-order.js');
//const matter = require('gray-matter');
const markdownIt = require('markdown-it');

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


  // Filters
  eleventyConfig.addFilter("year", () => {
    return new Date().getFullYear();
  });

  md = new markdownIt();
  eleventyConfig.addFilter("md", content => md.render(content));

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

