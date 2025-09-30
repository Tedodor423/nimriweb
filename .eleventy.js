require('dotenv').config();
const sortByDisplayOrder = require('./src/utils/sort-by-display-order.js');
//const matter = require('gray-matter');
//const markdownIt = require('markdown-it');

module.exports = function(eleventyConfig) {
  
  // eleventyConfig.addPassthroughCopy({ 
  //   "src/**/*.{png,jpg,jpeg,gif,svg}": "/" 
  // });
  eleventyConfig.addPassthroughCopy({ "src/assets":          "assets" });
  eleventyConfig.addPassthroughCopy({ "src/theo/assets":     "theo/assets" });
  eleventyConfig.addPassthroughCopy({ "src/arnost/assets":   "arnost/assets" });

  eleventyConfig.addPassthroughCopy({ "src/_includes/fonts": "fonts"});


  // Returns work items, sorted by display order
  eleventyConfig.addCollection('work', (collection) => {
    return sortByDisplayOrder(collection.getFilteredByGlob('./src/work/*.md'));
  });


  // // Slots parser
  // const md = new MarkdownIt({ html: true });
  // eleventyConfig.addPairedShortcode("slot", function(content, name) {
  //   this.page.data.slots = this.page.data.slots || {};
  //   const parsed = matter(content); // gray-matter splits front matter + body
  //   this.page.data.slots[name] = {
  //     data: parsed.data,
  //     body: md.render(parsed.content)
  //   };
  //   return "";
  // });

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

