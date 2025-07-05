
import { DEFAULT_SKILLS, SKILL_LADDER } from './constants';

let translations = {
  en: {
    // GameSetup
    chooseYourAdventure: "Choose Your Adventure",
    loadSavedGame: "Load Saved Game",
    startNewGame: "Start New Game",
    createYourCharacter: "Create Your Character",
    confirmNewGame: "Are you sure you want to start a new game? Your previous save will be deleted.",

    // CharacterCreation
    createYourHero: "Create Your Hero",
    forA: "for a",
    adventure: "adventure",
    generateCharacter: "Generate Character...",
    generating: "Generating...",
    letTheAIBuild: "Let the AI build a character for you!",
    name: "Name",
    whatIsYourName: "What is your character's name?",
    aspects: "Aspects",
    chooseAspects: "Choose your High Concept, Trouble, and three other aspects.",
    chooseHighConcept: "Choose a High Concept...",
    chooseTrouble: "Choose a Trouble...",
    skills: "Skills",
    skillPyramid: "Assign skills using the pyramid: one Great (+4), two Good (+3), three Fair (+2), and four Average (+1).",
    stunts: "Stunts",
    chooseStunts: "Choose two stunts that give your character a special edge.",
    back: "Back",
    startAdventure: "Start Adventure",
    completeCharacterPrompt: "Please complete all character sections to continue.",
    
    // GameView
    saveGame: "Save Game",
    saved: "Saved!",
    loadingGame: "Loading Game...",
    sceneChanged: "The scene has changed. Your stress and consequences have been cleared.",
    openCharacterSheet: "Open Character Sheet",
    openActionPanel: "Open Action Panel",

    // CharacterSheet
    fatePoints: "Fate Points",
    highConcept: "High Concept",
    trouble: "Trouble",
    invoke: "Invoke",
    invoked: "Invoked",
    physical: "Physical",
    mental: "Mental",
    stress: "Stress",
    consequences: "Consequences",
    noneForNow: "None... for now.",
    
    // ActionPanel
    actionAndScene: "Action & Scene",
    sceneAspects: "Scene Aspects",
    invocationBonus: "Invocation Bonus",
    whatDoYouDo: "What do you do?",
    usingWhichSkill: "Using which skill?",
    aiIsThinking: "AI is Thinking...",
    rolling: "Rolling...",
    takeAction: "Take Action",
    opponents: "Opponents",
    target: "Target",
    selectTarget: "Select Target",
    takenOut: "Taken Out!",

    // CompelModal
    aCompel: "A Compel!",
    yourAspect: "Your aspect...",
    suggestsComplication: "...suggests a complication:",
    acceptCompel: "Accept Compel",
    gainFatePoint: "Gain 1",
    rejectCompel: "Reject Compel",
    spendFatePoint: "Spend 1",
    cannotReject: "You don't have enough Fate Points to reject this.",
    
    // AbsorbHitModal
    youreHit: "You're Hit!",
    mustAbsorb: "You must absorb",
    shiftsOf: "shifts of",
    damage: "damage.",
    shiftsAbsorbed: "Shifts absorbed:",
    useStressTrack: "1. Use Stress Track",
    shiftsPerBox: "1 shift per box",
    takeAConsequence: "2. Take a Consequence",
    allSlotsFull: "All consequence slots are full.",
    confirmAbsorption: "Confirm Absorption",
    mustAbsorbToContinue: "You must absorb at least {shifts} shifts to continue.",
    nameYourConsequence: "Please give your new consequence a name.",
    orConcede: "Or, you can choose to back out of the conflict:",
    concedeTheConflict: "Concede the Conflict (Gain 1 Fate Point)",
    youAreTakenOut: "You are Taken Out!",
    hitTooMuch: "The hit for {shifts} shifts is too much to handle.",
    maxAbsorption: "You can only absorb a maximum of {max} shifts. The conflict is over.",
    acknowledgeDefeat: "Acknowledge Defeat",
    
    // SettingsModal
    settings: "Settings",
    imageGenerationFrequency: "Image Generation Frequency",
    imageGenerationFrequencyDesc: "How often the AI should generate images for scenes.",
    freqNone: "None",
    freqRarely: "Rarely (Major Events)",
    freqSometimes: "Sometimes (Impactful Moments)",
    freqAlways: "Always (Every Turn)",
    saveSettings: "Save Settings",
    language: "Language",
    difficulty: "Difficulty",
    difficultyDesc: "Adjusts opponent skill and overall challenge.",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",

    // Skill Names
    ...Object.fromEntries(DEFAULT_SKILLS.map(skill => [skill.name, skill.name])),
    // Skill Ladder
    ...Object.fromEntries(Object.entries(SKILL_LADDER).map(([key, value]) => [value, value]))
  },
  es: {
    // GameSetup
    chooseYourAdventure: "Elige Tu Aventura",
    loadSavedGame: "Cargar Partida Guardada",
    startNewGame: "Empezar Nueva Partida",
    createYourCharacter: "Crea Tu Personaje",
    confirmNewGame: "¿Estás seguro de que quieres empezar una nueva partida? Tu guardado anterior será eliminado.",
    
    // CharacterCreation
    createYourHero: "Crea Tu Héroe",
    forA: "para una aventura",
    adventure: "",
    generateCharacter: "Generar Personaje...",
    generating: "Generando...",
    letTheAIBuild: "¡Deja que la IA cree un personaje para ti!",
    name: "Nombre",
    whatIsYourName: "¿Cuál es el nombre de tu personaje?",
    aspects: "Aspectos",
    chooseAspects: "Elige tu Concepto Principal, Complicación y otros tres aspectos.",
    chooseHighConcept: "Elige un Concepto Principal...",
    chooseTrouble: "Elige una Complicación...",
    skills: "Habilidades",
    skillPyramid: "Asigna habilidades usando la pirámide: una Genial (+4), dos Buenas (+3), tres Normales (+2) y cuatro Medias (+1).",
    stunts: "Proezas",
    chooseStunts: "Elige dos proezas que le den a tu personaje una ventaja especial.",
    back: "Atrás",
    startAdventure: "Empezar Aventura",
    completeCharacterPrompt: "Por favor, completa todas las secciones del personaje para continuar.",
    
    // GameView
    saveGame: "Guardar Partida",
    saved: "¡Guardado!",
    loadingGame: "Cargando Partida...",
    sceneChanged: "La escena ha cambiado. Tu estrés y tus consecuencias se han eliminado.",
    openCharacterSheet: "Abrir Hoja de Personaje",
    openActionPanel: "Abrir Panel de Acción",

    // CharacterSheet
    fatePoints: "Puntos de Destino",
    highConcept: "Concepto Principal",
    trouble: "Complicación",
    invoke: "Invocar",
    invoked: "Invocado",
    physical: "Físico",
    mental: "Mental",
    stress: "Estrés",
    consequences: "Consecuencias",
    noneForNow: "Ninguna... por ahora.",
    
    // ActionPanel
    actionAndScene: "Acción y Escena",
    sceneAspects: "Aspectos de Escena",
    invocationBonus: "Bono por Invocación",
    whatDoYouDo: "¿Qué haces?",
    usingWhichSkill: "¿Usando qué habilidad?",
    aiIsThinking: "La IA está Pensando...",
    rolling: "Lanzando...",
    takeAction: "Realizar Acción",
    opponents: "Oponentes",
    target: "Objetivo",
    selectTarget: "Seleccionar Objetivo",
    takenOut: "¡Derrotado!",

    // CompelModal
    aCompel: "¡Una Tentación!",
    yourAspect: "Tu aspecto...",
    suggestsComplication: "...sugiere una complicación:",
    acceptCompel: "Aceptar Tentación",
    gainFatePoint: "Gana 1",
    rejectCompel: "Rechazar Tentación",
    spendFatePoint: "Gasta 1",
    cannotReject: "No tienes suficientes Puntos de Destino para rechazar esto.",

    // AbsorbHitModal
    youreHit: "¡Te Han Alcanzado!",
    mustAbsorb: "Debes absorber",
    shiftsOf: "puntos de",
    damage: "de daño.",
    shiftsAbsorbed: "Puntos absorbidos:",
    useStressTrack: "1. Usa el Medidor de Estrés",
    shiftsPerBox: "1 punto por casilla",
    takeAConsequence: "2. Sufre una Consecuencia",
    allSlotsFull: "Todas las casillas de consecuencias están ocupadas.",
    confirmAbsorption: "Confirmar Absorción",
    mustAbsorbToContinue: "Debes absorber al menos {shifts} puntos para continuar.",
    nameYourConsequence: "Por favor, dale un nombre a tu nueva consecuencia.",
    orConcede: "O, puedes elegir abandonar el conflicto:",
    concedeTheConflict: "Conceder el Conflicto (Ganas 1 Punto de Destino)",
    youAreTakenOut: "¡Has Sido Derrotado!",
    hitTooMuch: "El golpe de {shifts} puntos es demasiado para soportar.",
    maxAbsorption: "Solo puedes absorber un máximo de {max} puntos. El conflicto ha terminado.",
    acknowledgeDefeat: "Aceptar la Derrota",
    
    // SettingsModal
    settings: "Ajustes",
    imageGenerationFrequency: "Frecuencia de Generación de Imágenes",
    imageGenerationFrequencyDesc: "Define qué tan seguido la IA debe generar imágenes para las escenas.",
    freqNone: "Ninguna",
    freqRarely: "Raramente (eventos importantes)",
    freqSometimes: "A veces (momentos impactantes)",
    freqAlways: "Siempre (cada turno)",
    saveSettings: "Guardar Ajustes",
    language: "Idioma",
    difficulty: "Dificultad",
    difficultyDesc: "Ajusta la habilidad del oponente y el desafío general.",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    
    // Skill Names
    'Athletics': 'Atletismo',
    'Burglary': 'Allanamiento',
    'Contacts': 'Contactos',
    'Crafts': 'Artesanía',
    'Deceive': 'Engaño',
    'Drive': 'Conducir',
    'Empathy': 'Empatía',
    'Fight': 'Pelea',
    'Investigate': 'Investigar',
    'Lore': 'Conocimiento',
    'Notice': 'Atención',
    'Physique': 'Físico',
    'Provoke': 'Provocar',
    'Rapport': 'Labia',
    'Resources': 'Recursos',
    'Shoot': 'Disparo',
    'Stealth': 'Sigilo',
    'Will': 'Voluntad',
    // Skill Ladder
    'Legendary': 'Legendario',
    'Epic': 'Épico',
    'Fantastic': 'Fantástico',
    'Superb': 'Excepcional',
    'Great': 'Genial',
    'Good': 'Bueno',
    'Fair': 'Normal',
    'Average': 'Medio',
    'Mediocre': 'Mediocre',
  }
};

type TranslationKey = keyof (typeof translations)['en'];

export function t(key: TranslationKey, lang: 'en' | 'es', options?: Record<string, string | number>): string {
  let translation = translations[lang][key] || translations['en'][key];
  if (options) {
    Object.entries(options).forEach(([optKey, value]) => {
      translation = translation.replace(`{${optKey}}`, String(value));
    });
  }
  return translation;
};
