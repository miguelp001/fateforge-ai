
import { GameState, AppSettings } from '../types';

/**
 * Validates the structure of the loaded game state, particularly the character aspects.
 * This prevents crashes from loading save files from older, incompatible versions.
 * @param data The parsed data from localStorage.
 * @returns True if the game state is valid, false otherwise.
 */
function validateGameState(data: any): data is GameState {
  // Basic object checks
  if (!data || typeof data !== 'object') return false;
  if (!data.scene || typeof data.scene !== 'object') return false;
  if (!Array.isArray(data.scene.aspects)) return false;
  if (!Array.isArray(data.storyLog)) return false;

  // Character checks
  const char = data.character;
  if (!char || typeof char !== 'object') return false;
  
  // Aspect structure check
  const aspects = char.aspects;
  if (!aspects || typeof aspects !== 'object' || Array.isArray(aspects)) return false;
  if (typeof aspects.highConcept !== 'object' || aspects.highConcept === null) return false;
  if (typeof aspects.trouble !== 'object' || aspects.trouble === null) return false;
  if (!Array.isArray(aspects.others)) return false;

  // Stress and Consequence checks for new structure
  if (!char.physicalStress || !Array.isArray(char.physicalStress.boxes) || !Array.isArray(char.physicalStress.marked)) return false;
  if (!char.mentalStress || !Array.isArray(char.mentalStress.boxes) || !Array.isArray(char.mentalStress.marked)) return false;
  if (!Array.isArray(char.consequences)) return false;


  // Ensure other character properties exist and have the correct type.
  if (typeof char.name !== 'string') return false;
  if (typeof char.fatePoints !== 'number') return false;
  if (!Array.isArray(char.skills)) return false;
  if (!Array.isArray(char.stunts)) return false;

  return true;
};

export function saveGameState(gameState: GameState): void {
  const GAME_STATE_KEY = 'fateForgeAiGameState';
  try {
    const stateString = JSON.stringify(gameState);
    localStorage.setItem(GAME_STATE_KEY, stateString);
  } catch (error) {
    console.error("Could not save game state:", error);
  }
};

export function loadGameState(): GameState | null {
  const GAME_STATE_KEY = 'fateForgeAiGameState';
  try {
    const stateString = localStorage.getItem(GAME_STATE_KEY);
    if (stateString === null) {
      return null;
    }
    const parsedState = JSON.parse(stateString);
    
    if (validateGameState(parsedState)) {
      return parsedState;
    } else {
      console.warn("Saved game state has an invalid format from an older version. Discarding.");
      clearSavedGame();
      return null;
    }

  } catch (error)
  {
    console.error("Could not load game state:", error);
    // If parsing fails, the saved data is likely corrupt. Clear it.
    clearSavedGame();
    return null;
  }
};

export function hasSavedGame(): boolean {
  const GAME_STATE_KEY = 'fateForgeAiGameState';
  return localStorage.getItem(GAME_STATE_KEY) !== null;
};

export function clearSavedGame(): void {
  const GAME_STATE_KEY = 'fateForgeAiGameState';
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error("Could not clear saved game:", error);
  }
};

export function saveSettings(settings: AppSettings): void {
  const SETTINGS_KEY = 'fateForgeAiSettings';
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Could not save settings:", error);
  }
};

export function loadSettings(): AppSettings | null {
  const SETTINGS_KEY = 'fateForgeAiSettings';
  try {
    const settingsString = localStorage.getItem(SETTINGS_KEY);
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      
      const validFrequencies: Array<AppSettings['imageGenerationFrequency']> = ['none', 'rarely', 'sometimes', 'always'];
      const validDifficulties: Array<AppSettings['difficulty']> = ['easy', 'medium', 'hard'];

      // Handle old boolean setting `enableImageGeneration` for backward compatibility
      let frequency: AppSettings['imageGenerationFrequency'] = 'sometimes';
      if (typeof settings.enableImageGeneration === 'boolean') {
          frequency = settings.enableImageGeneration ? 'sometimes' : 'none';
      } else if (validFrequencies.includes(settings.imageGenerationFrequency)) {
          frequency = settings.imageGenerationFrequency;
      }

      return {
        imageGenerationFrequency: frequency,
        language: settings.language === 'es' ? 'es' : 'en',
        difficulty: validDifficulties.includes(settings.difficulty) ? settings.difficulty : 'medium',
      };
    }
    return null;
  } catch (error) {
    console.error("Could not load settings:", error);
    return null;
  }
};
