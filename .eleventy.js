require('dotenv').config();

module.exports = function(eleventyConfig) {
  
  // eleventyConfig.addPassthroughCopy({ 
  //   "src/**/*.{png,jpg,jpeg,gif,svg}": "/" 
  // });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/theo/assets": "theo/assets" });
  eleventyConfig.addPassthroughCopy({ "src/arnost/assets": "arnost/assets" });

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
