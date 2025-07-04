import { Skill } from './types';

export let SKILL_LADDER: { [key: number]: string } = {
  8: 'Legendary',
  7: 'Epic',
  6: 'Fantastic',
  5: 'Superb',
  4: 'Great',
  3: 'Good',
  2: 'Fair',
  1: 'Average',
  0: 'Mediocre',
};

export let DEFAULT_SKILLS: Skill[] = [
    { name: 'Athletics', level: 0, levelName: 'Mediocre' },
    { name: 'Burglary', level: 0, levelName: 'Mediocre' },
    { name: 'Contacts', level: 0, levelName: 'Mediocre' },
    { name: 'Crafts', level: 0, levelName: 'Mediocre' },
    { name: 'Deceive', level: 0, levelName: 'Mediocre' },
    { name: 'Drive', level: 0, levelName: 'Mediocre' },
    { name: 'Empathy', level: 0, levelName: 'Mediocre' },
    { name: 'Fight', level: 0, levelName: 'Mediocre' },
    { name: 'Investigate', level: 0, levelName: 'Mediocre' },
    { name: 'Lore', level: 0, levelName: 'Mediocre' },
    { name: 'Notice', level: 0, levelName: 'Mediocre' },
    { name: 'Physique', level: 0, levelName: 'Mediocre' },
    { name: 'Provoke', level: 0, levelName: 'Mediocre' },
    { name: 'Rapport', level: 0, levelName: 'Mediocre' },
    { name: 'Resources', level: 0, levelName: 'Mediocre' },
    { name: 'Shoot', level: 0, levelName: 'Mediocre' },
    { name: 'Stealth', level: 0, levelName: 'Mediocre' },
    { name: 'Will', level: 0, levelName: 'Mediocre' },
];

export let PYRAMID_SLOTS: { [key: number]: number } = { 4: 1, 3: 2, 2: 3, 1: 4, 0: Infinity };
export let SKILL_LEVELS = [4, 3, 2, 1, 0];