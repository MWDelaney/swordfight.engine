/**
 * Global Data: Characters
 * Loads all characters from JSON files in the parent project
 * Strips out tables and results since outcomes are pre-computed in the API
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const characterFiles = [
  'humanFighter.json',
  'evilHumanFighter.json',
  'goblinFighter.json',
  'humanWithQuarterstaff.json',
  'lizardMan.json',
  'mummy.json',
  'skeletonWarrior.json'
];

/**
 * Strip tables and results from character data
 * These are only needed for local calculation, not in the API
 */
function stripGameMechanics(character) {
  const { tables, results, ...characterData } = character;
  return characterData;
}

export default function() {
  const charactersDir = join(__dirname, '../../../src/characters');
  const characters = {};
  const slugs = [];

  characterFiles.forEach(filename => {
    const filePath = join(charactersDir, filename);
    const rawCharacter = JSON.parse(readFileSync(filePath, 'utf-8'));
    const character = stripGameMechanics(rawCharacter);

    characters[character.slug] = character;
    slugs.push(character.slug);
  });

  return {
    all: characters,
    slugs: slugs,
    list: slugs.map(slug => ({
      slug: slug,
      name: characters[slug].name,
      description: characters[slug].description,
      health: characters[slug].health,
      weapon: characters[slug].weapon,
      shield: characters[slug].shield
    }))
  };
}
