require('dotenv').config();

module.exports = function(eleventyConfig) {
  // Copy assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "/assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/arnost": "/assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/theo": "/assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/arnost": "/arnost/assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/theo": "/theo/assets" });

  return {
    dir: {
      input: "src",
      output: process.env.ELEVENTY_OUTPUT || "/var/www/html"
    }
  };
};
