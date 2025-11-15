/**
 * Character Detail Endpoints
 * GET /characters/{slug}.json
 * Returns complete character data including moves, tables, and results
 */
export default class {
  data() {
    return {
      pagination: {
        data: "characters.slugs",
        size: 1,
        alias: "slug"
      },
      permalink: (data) => `/characters/${data.slug}.json`
    };
  }

  render(data) {
    const character = data.characters.all[data.slug];
    return JSON.stringify(character, null, 2);
  }
}
