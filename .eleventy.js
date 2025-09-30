require('dotenv').config();
// const sortByDisplayOrder = require('./src/utils/sort-by-display-order.js');
//const matter = require('gray-matter');
const markdownIt = require('markdown-it');

module.exports = function(eleventyConfig) {
  
  // eleventyConfig.addPassthroughCopy({ 
  //   "src/**/*.{png,jpg,jpeg,gif,svg}": "/" 
  // });
  eleventyConfig.addPassthroughCopy({ "src/assets":          "assets" });
  eleventyConfig.addPassthroughCopy({ "src/theo/assets":     "theo/assets" });
  eleventyConfig.addPassthroughCopy({ "src/arnost/assets":   "arnost/assets" });

  eleventyConfig.addPassthroughCopy({ "src/_includes/fonts": "fonts"});
  eleventyConfig.addPassthroughCopy({ "src/google7c93c9bfb4d70535.html": "google7c93c9bfb4d70535.html"});


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

