/**
 * Character Data Index
 * @description Exports all character data for easy importing
 */

export { humanFighter } from './humanFighter.js';
export { evilHumanFighter } from './evilHumanFighter.js';
export { goblinFighter } from './goblinFighter.js';

// Default export for convenience
export default {
  humanFighter: () => import('./humanFighter.js').then(m => m.humanFighter),
  evilHumanFighter: () => import('./evilHumanFighter.js').then(m => m.evilHumanFighter),
  goblinFighter: () => import('./goblinFighter.js').then(m => m.goblinFighter)
};
