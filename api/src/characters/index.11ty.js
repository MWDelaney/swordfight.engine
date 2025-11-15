/**
 * Characters Index Endpoint
 * GET /characters/index.json
 * Returns list of all available characters
 */
export default {
  data: {
    permalink: "/characters/index.json"
  },
  render(data) {
    return JSON.stringify({
      characters: data.characters.list
    }, null, 2);
  }
};
