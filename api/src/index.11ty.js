/**
 * API Index
 * Returns metadata about available endpoints
 */
export default {
  data: {
    permalink: "/index.json"
  },
  render(data) {
    return JSON.stringify({
      name: "SwordFight Static API",
      version: "1.0.0",
      description: "Static JSON API for SwordFight game engine",
      endpoints: {
        characters: "/characters/index.json",
        characterDetail: "/characters/{slug}.json",
        rounds: "/rounds/{char1}/{char2}/{move1}/{move2}.json",
        outcomes: "/outcomes/{char1}/{move1}/{char2}/{move2}.json"
      },
      characters: data.characters.list
    }, null, 2);
  }
};
