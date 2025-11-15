/**
 * Global Data: Characters
 * Loads all characters from JSON files in the parent project
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
  'skeletonWarrior.json',
  'troll.json'
];

export default function() {
  const charactersDir = join(__dirname, '../../../src/characters');
  const characters = {};
  const slugs = [];

  characterFiles.forEach(filename => {
    const filePath = join(charactersDir, filename);
    const character = JSON.parse(readFileSync(filePath, 'utf-8'));
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
