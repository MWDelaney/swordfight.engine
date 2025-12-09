/**
 * Global Data: Characters
 * Loads all characters from JSON files in the parent project
 * Strips out tables and results since outcomes are pre-computed in the API
 */
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Strip tables and results from character data
 * These are only needed for local calculation, not in the API
 */
function stripGameMechanics(character) {
  const { tables: _tables, results: _results, ...characterData } = character;
  return characterData;
}

export default function() {
  const charactersDir = join(__dirname, '../../../src/characters');
  const characters = {};
  const slugs = [];

  // Dynamically load all JSON files from the characters directory (exclude index.json)
  const characterFiles = readdirSync(charactersDir).filter(file => file.endsWith('.json') && file !== 'index.json');

  characterFiles.forEach(filename => {
    const filePath = join(charactersDir, filename);
    const rawCharacter = JSON.parse(readFileSync(filePath, 'utf-8'));
    const character = stripGameMechanics(rawCharacter);

    characters[character.slug] = character;
    slugs.push(character.slug);
  });

  // Sort slugs by difficulty (easiest to hardest)
  const sortedSlugs = slugs.sort((a, b) => {
    const diffA = characters[a].difficulty || 0;
    const diffB = characters[b].difficulty || 0;
    return diffA - diffB;
  });

  return {
    all: characters,
    slugs: sortedSlugs,
    list: sortedSlugs.map(slug => ({
      slug: slug,
      name: characters[slug].name,
      description: characters[slug].description,
      difficulty: characters[slug].difficulty,
      health: characters[slug].health,
      weapon: characters[slug].weapon,
      shield: characters[slug].shield
    }))
  };
}
