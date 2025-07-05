
export interface Aspect {
  name: string;
  description: string;
  hasFreeInvoke?: boolean;
}

export interface Skill {
  name:string;
  level: number;
  levelName: string;
}

export interface Stunt {
  name: string;
  description: string;
}

export interface StressTrack {
  boxes: number[];
  marked: boolean[];
}

export interface Consequence {
  severity: 'mild' | 'moderate' | 'severe';
  aspect: Aspect;
}

export interface Character {
  name: string;
  aspects: {
    highConcept: Aspect;
    trouble: Aspect;
    others: Aspect[];
  };
  skills: Skill[];
  stunts: Stunt[];
  fatePoints: number;
  physicalStress: StressTrack;
  mentalStress: StressTrack;
  consequences: Consequence[];
}

export interface Opponent {
  id: string;
  name: string;
  aspects: Aspect[];
  physicalStress: StressTrack;
  mentalStress: StressTrack;
  consequences: Consequence[];
  isTakenOut: boolean;
}

export interface Scene {
  description: string;
  aspects: Aspect[];
  imageUrl?: string;
  opponents?: Opponent[];
  hasOfferedCompel?: boolean;
}

export interface StoryLogEntry {
  id: number;
  type: 'narration' | 'action' | 'roll' | 'error' | 'system';
  content: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
}

export interface GameState {
  character: Character;
  scene: Scene;
  storyLog: StoryLogEntry[];
}

export enum GameStatus {
  Setup,
  LoadingCharacterOptions,
  CharacterCreation,
  LoadingScene,
  Playing,
  Error,
}

export interface CharacterCreationOptions {
  aspects: {
    highConcepts: Aspect[];
    troubles: Aspect[];
    others: Aspect[];
  };
  stunts: Stunt[];
}

export interface Compel {
  aspect: string;
  reason: string;
  acceptNarration: string;
  rejectNarration: string;
}

export interface PlayerActionPayload {
  description: string;
  skill: Skill;
  roll: number;
  total: number;
  gameState: GameState;
  invokedAspects?: string[];
  targetOpponentId?: string;
}

export interface GeminiNarrativeResponse {
  narration: string;
  imagePrompt?: string;
  newSceneAspect?: Aspect;
  removedSceneAspects?: string[];
  hit?: {
    shifts: number;
    attackDescription: string;
    type: 'physical' | 'mental';
  };
  updatedCharacter?: {
    fatePoints?: number;
  };
  compel?: Compel;
  newScene?: Scene;
  usedFreeInvokes?: string[];
  updatedOpponents?: Opponent[];
}


export interface GeneratedCharacter {
  name: string;
  aspects: {
    highConcept: Aspect;
    trouble: Aspect;
    others: Aspect[];
  };
  stunts: Stunt[];
  skills: Array<{ name: string; level: number; }>;
}

export type HitAbsorption = {
  stressType: 'physical' | 'mental';
  markedStressIndices: number[];
  newConsequence: Consequence | null;
};

export type TakenOutResolution = {
  takenOut: true;
};

export type ConcedeResolution = {
  concede: true;
};

export interface AppSettings {
  imageGenerationFrequency: 'none' | 'rarely' | 'sometimes' | 'always';
  language: 'en' | 'es';
  difficulty: 'easy' | 'medium' | 'hard';
}
