require('dotenv').config();

module.exports = function(eleventyConfig) {
  
  eleventyConfig.addPassthroughCopy({
    //"src/assets": "assets",
    //"src/assets": "theo/assets",
    "src/assets": "arnost/assets"
  });
  // eleventyConfig.addPassthroughCopy({ "src/assets": "theo/assets" });
  // eleventyConfig.addPassthroughCopy({ "src/assets": "arnost/assets" });

  return {
    dir: {
      input: "src",
      output: process.env.ELEVENTY_OUTPUT || "/var/www/html"
    }
  };
};
