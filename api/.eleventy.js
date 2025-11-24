/**
 * Eleventy Configuration for SwordFight Static API
 * Generates all possible game outcomes as static JSON files
 */

export default function(eleventyConfig) {
  // Set output to JSON by default
  eleventyConfig.addGlobalData('permalink', () => {
    return (data) => `${data.page.filePathStem}.json`;
  });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data'
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    templateFormats: ['njk', '11ty.js', 'md']
  };
}
