
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";
import { GameState, PlayerActionPayload, GeminiNarrativeResponse, CharacterCreationOptions, Character, GeneratedCharacter, Scene, AppSettings, Opponent } from "../types";
import { SKILL_LADDER, DEFAULT_SKILLS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let localSettings: AppSettings = {
    imageGenerationFrequency: 'sometimes',
    language: 'en',
    difficulty: 'medium',
};

let imageGenerationDisabledUntil = 0;

export function updateAiSettings(newSettings: AppSettings) {
    localSettings = newSettings;
}

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

function getLanguageInstruction(language: 'en' | 'es'): string {
    if (language === 'es') {
        return "The entire response, including all text and JSON string values for names and descriptions, MUST be in Spanish.";
    }
    return "The entire response, including all text and JSON string values for names and descriptions, MUST be in English.";
};

function assertApiKeyIsConfigured() {
    if (!process.env.API_KEY) {
        throw new Error("Google AI API Key is not configured. Please set the API_KEY environment variable in your deployment settings. The application cannot function without it.");
    }
}

export async function generateImage(prompt: string): Promise<string | undefined> {
    assertApiKeyIsConfigured();
    const imageModelName = 'imagen-3.0-generate-002';
    const IMAGE_COOLDOWN_MS = 60000; // 1 minute

    if (Date.now() < imageGenerationDisabledUntil) {
        throw new RateLimitError("Image generation is on cooldown due to recent rate limits.");
    }

    try {
        const fullPrompt = `${prompt}, cinematic composition, dramatic lighting, high detail, masterpiece, game art, rpg art style`;
        const response = await ai.models.generateImages({
            model: imageModelName,
            prompt: fullPrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
            return `data:image/jpeg;base64,${imageBytes}`;
        }

        return undefined;

    } catch (error: any) {
        if (error?.error?.code === 429 || (typeof error.message === 'string' && error.message.includes("RESOURCE_EXHAUSTED"))) {
            console.warn(`Image generation rate limit hit. Disabling for ${IMAGE_COOLDOWN_MS / 1000} seconds.`);
            imageGenerationDisabledUntil = Date.now() + IMAGE_COOLDOWN_MS;
            throw new RateLimitError("You've exceeded the image generation quota. Image generation will be paused for a minute to cool down.");
        }
        
        console.error("Error generating image:", error);
        // More descriptive error
        if (typeof error.message === 'string' && error.message.includes('API key not valid')) {
            throw new Error("The configured API key is invalid.");
        }
        throw new Error("Failed to generate image due to an API error.");
    }
}


function parseJsonResponse<T>(text: string): T {
    let jsonStr = text.trim();
    
    const fenceRegex = /^```(\w+)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    const cleanedJsonStr = jsonStr.replace(/билдирилмеген/g, '').trim();

    try {
        return JSON.parse(cleanedJsonStr);
    } catch (initialError) {
        // HACK: Attempt to fix a common LLM error where it omits an opening brace `{`
        // for an object within an array. This happens when an object is followed by
        // a key for the next object, like `...}, "name":...` instead of `...}, {"name":...`.
        // This regex is specific to keys named "name" as it's a common pattern in this app's
        // data structures (Aspects, Stunts) and seems safer than a generic replacement.
        const fixedJson = cleanedJsonStr.replace(/(},)(\s*)("name":)/g, '$1$2{$3');

        try {
            // Try parsing the fixed string.
            return JSON.parse(fixedJson);
        } catch (fixError) {
             // The fix didn't work. Fall back to the original extraction logic.
            const startIndex = cleanedJsonStr.indexOf('{');
            const endIndex = cleanedJsonStr.lastIndexOf('}');

            if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
                const extractedJson = cleanedJsonStr.substring(startIndex, endIndex + 1);
                try {
                    return JSON.parse(extractedJson);
                } catch (extractionError) {
                    console.error("Failed to parse even the extracted JSON:", extractedJson);
                    console.error("Original string (pre-cleanup):", jsonStr);
                    console.error("Initial parsing error:", initialError);
                    console.error("Extraction parsing error:", extractionError);
                    throw new Error("Invalid or malformed JSON response from AI model.");
                }
            }

            console.error("Failed to parse JSON response and could not find a valid JSON object to extract:", cleanedJsonStr);
            console.error("Original string (pre-cleanup):", jsonStr);
            console.error("Initial parsing error:", initialError);
            throw new Error("Invalid JSON response from AI model.");
        }
    }
}


async function callAIWithRetry<T>(
    params: Omit<GenerateContentParameters, 'model'>,
    maxRetries: number = 3
): Promise<T> {
    assertApiKeyIsConfigured();
    const modelName = "gemini-2.5-flash-preview-04-17";

    // Strengthened guard clause to prevent invalid API calls
    if (!params || !params.contents || (typeof params.contents === 'string' && params.contents.trim() === '')) {
        const errorMsg = "Internal Error: Attempted to call the AI with an empty or invalid prompt. This indicates a logic issue in the app.";
        console.error(errorMsg, { params });
        throw new Error(errorMsg);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: modelName,
                ...params
            });
            // This can throw an error if JSON is malformed, which will be caught below.
            return parseJsonResponse<T>(response.text);
        } catch (error: any) {
            const errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error);
            const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('rate limit');

            // If it's a rate limit error and not the last attempt, wait and retry.
            if (isRateLimitError && attempt < maxRetries) {
                const backoffTime = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 1000);
                console.warn(
                    `AI call attempt ${attempt} failed due to rate limiting. Retrying in ${Math.round(backoffTime / 1000)}s...`
                );
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                continue; // Move to the next attempt
            }
            
            // If it's a non-retriable error OR the last attempt failed, throw a specific error.
            if (isRateLimitError) {
                 throw new Error("The AI service is currently busy or the quota has been exceeded. Please wait a moment and try again.");
            }
            if (errorMessage.includes('API key not valid')) {
                throw new Error("The configured API key is not valid. Please ensure the backend is configured correctly.");
            }
            
            // For all other errors (including JSON parsing errors), rethrow the original to preserve details.
            console.error(`AI call failed on attempt ${attempt} of ${maxRetries}. Error:`, error);
            throw error;
        }
    }
    
    // This should be unreachable if maxRetries >= 1, but serves as a fallback.
    throw new Error("AI call failed after multiple retries.");
}

export async function generateFullCharacter(genre: string, language: 'en' | 'es'): Promise<GeneratedCharacter> {
    const langInstruction = getLanguageInstruction(language);
    const prompt = `
    You are a creative Game Master for a Fate Core RPG. The user wants to play a "${genre}" game.
    ${langInstruction}
    Generate a complete, thematic character.
    The response MUST be a single, valid JSON object and nothing else. All string values must be properly escaped.
    {
      "name": "Character Name",
      "aspects": {
        "highConcept": { "name": "Aspect Name", "description": "A single-sentence description of the high concept aspect." },
        "trouble": { "name": "Aspect Name", "description": "A single-sentence description of the trouble aspect." },
        "others": [
          { "name": "Aspect Name", "description": "A single-sentence description of an additional aspect." },
          { "name": "Aspect Name", "description": "A single-sentence description of an additional aspect." },
          { "name": "Aspect Name", "description": "A single-sentence description of an additional aspect." }
        ]
      },
      "stunts": [
        { "name": "Stunt Name", "description": "A single-sentence description of the stunt's mechanical benefit." },
        { "name": "Stunt Name", "description": "A single-sentence description of the stunt's mechanical benefit." }
      ],
      "skills": [
        { "name": "Skill Name", "level": 4 },
        { "name": "Skill Name", "level": 3 },
        { "name": "Skill Name", "level": 3 },
        { "name": "Skill Name", "level": 2 },
        { "name": "Skill Name", "level": 2 },
        { "name": "Skill Name", "level": 2 },
        { "name": "Skill Name", "level": 1 },
        { "name": "Skill Name", "level": 1 },
        { "name": "Skill Name", "level": 1 },
        { "name": "Skill Name", "level": 1 }
      ]
    }

    Rules for generation:
    1.  Provide exactly 1 High Concept, 1 Trouble, and 3 "other" aspects.
    2.  Provide exactly 2 stunts. Stunts should offer clear mechanical benefits.
    3.  Assign skill levels according to the Fate Core pyramid: one skill at +4, two skills at +3, three skills at +2, and four skills at +1. The total number of skills with levels above 0 must be 10.
    4.  All aspects, stunts, and skill choices should be thematically consistent with the "${genre}" genre.
    5.  The skill names MUST be chosen from this exact list: ${DEFAULT_SKILLS.map(s => `"${s.name}"`).join(', ')}.
    6.  All "description" values must be single-line strings without unescaped newlines.
    `;
    
    return callAIWithRetry<GeneratedCharacter>({
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 } 
        },
    });
}


export async function generateCharacterCreationOptions(genre: string, language: 'en' | 'es'): Promise<CharacterCreationOptions> {
    const langInstruction = getLanguageInstruction(language);
    const prompt = `
    You are a creative Game Master for a Fate Core RPG. The user wants to play a "${genre}" game.
    ${langInstruction}
    Generate a list of thematic options for character creation.
    The response MUST be a single, valid JSON object and nothing else. All string values must be properly escaped.

    Here is an example of the required JSON structure. Pay close attention to the commas between objects in the arrays:
    {
      "aspects": {
        "highConcepts": [
          { "name": "Example High Concept 1", "description": "A single-sentence description for example 1." },
          { "name": "Example High Concept 2", "description": "A single-sentence description for example 2." }
        ],
        "troubles": [
          { "name": "Example Trouble 1", "description": "A single-sentence description for example 1." },
          { "name": "Example Trouble 2", "description": "A single-sentence description for example 2." }
        ],
        "others": [
          { "name": "Example Other Aspect 1", "description": "A single-sentence description for example 1." },
          { "name": "Example Other Aspect 2", "description": "A single-sentence description for example 2." }
        ]
      },
      "stunts": [
        { "name": "Example Stunt 1", "description": "A single-sentence description of the mechanical benefit for example 1." },
        { "name": "Example Stunt 2", "description": "A single-sentence description of the mechanical benefit for example 2." }
      ]
    }
    
    Rules for generation:
    1. Provide 5 unique high concepts, 5 unique troubles, 8 other unique aspects, and 8 unique stunts.
    2. Stunts should provide a clear mechanical benefit, like "+2 to a skill under specific circumstances" or "Once per session, you can...".
    3. Aspects should be flavorful and evocative for the genre.
    4. All 'description' values MUST be single-line strings without unescaped newlines or other characters that would break JSON parsing.
    5. Ensure every object in an array is separated by a comma, except for the last one. Do not include a trailing comma after the last object.
    6. Every single object within a JSON array MUST be enclosed in curly braces {}. For example, in the "troubles" array, each trouble MUST be like {"name": "...", "description": "..."}.
    `;

    return callAIWithRetry<CharacterCreationOptions>({
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
}

export async function createOpeningScene(character: Character, genre: string, language: 'en' | 'es', difficulty: 'easy' | 'medium' | 'hard'): Promise<GameState> {
    const langInstruction = getLanguageInstruction(language);
    const prompt = `
    You are a creative Game Master for a Fate Core RPG. A player has just created their character for a "${genre}" game.
    ${langInstruction}
    
    Here is their character sheet:
    - Name: ${character.name}
    - High Concept: "${character.aspects.highConcept.name} (${character.aspects.highConcept.description})"
    - Trouble: "${character.aspects.trouble.name} (${character.aspects.trouble.description})"
    - Other Aspects: ${character.aspects.others.map(a => `"${a.name} (${a.description})"`).join(', ')}
    - Top Skills: ${character.skills.filter(s => s.level > 1).map(s => `${s.name} (+${s.level})`).join(', ')}
    - Stunts: ${character.stunts.map(s => `"${s.name}"`).join(', ')}

    **Game Difficulty:** ${difficulty.toUpperCase()}

    Your Task: Create a compelling opening scene for this specific character, respecting the game difficulty.
    - **Easy:** Create a calm, introductory scene with a simple, low-stakes problem to solve that relates to the character's aspects.
    - **Medium:** Create a scene that immediately engages one or more of their aspects or skills with a moderate challenge.
    - **Hard:** Throw the character directly into a dangerous or complicated situation. Start them *in media res* with an immediate, high-stakes threat.

    The response MUST be a valid JSON object with the following structure:
     {
      "scene": {
        "description": "A vivid description of the opening scene, what's happening, and the immediate challenge or situation.",
        "aspects": [
          { "name": "Scene Aspect 1", "description": "A descriptive aspect for the scene." },
          { "name": "Scene Aspect 2", "description": "Another descriptive aspect for the scene." }
        ],
        "opponents": [] // Optional: An array of Opponent objects if the scene starts with conflict.
      },
      "imagePrompt": "A detailed, dynamic prompt for an AI image generator to create a scene that visualizes this moment. Describe the character based on their aspects, the setting, and the mood. E.g., 'A grizzled cyborg detective with a trench coat and a glowing cybernetic eye stands in a rain-soaked neon-lit alleyway, looking down at a mysterious datachip.'"
    }
    The scene description should place the character directly into the action or an interesting predicament. The imagePrompt should be a single, descriptive sentence.
    If you include opponents, they MUST follow the full opponent structure. An opponent's \`consequences\` field MUST be an array (e.g., \`[]\` if empty). Their stress tracks MUST be objects where \`boxes\` and \`marked\` are both arrays.
    `;
    
    const data = await callAIWithRetry<{ scene: Omit<Scene, 'imageUrl'>; imagePrompt: string }>({
        contents: prompt,
        config: { responseMimeType: "application/json" },
    });

    let imageUrl: string | undefined = undefined;
    
    // The App component shows a global spinner. We will await the image generation here.
    // The isLoadingImage flag on the story log entry is for subsequent, async image loads during gameplay.
    if (localSettings.imageGenerationFrequency !== 'none' && data.imagePrompt) {
        try {
            imageUrl = await generateImage(data.imagePrompt);
        } catch (e) {
            if (e instanceof RateLimitError) {
                console.warn(`Could not generate opening scene image due to rate limits: ${e.message}`);
            } else {
                console.error("Failed to generate opening scene image. Continuing without one.", e);
            }
            // If image generation fails, imageUrl remains undefined, which is the correct outcome.
        }
    }

    const initialGameState: GameState = {
        character,
        scene: { ...data.scene, imageUrl, hasOfferedCompel: false },
        // isLoadingImage is false because we have already awaited the result (or it failed).
        storyLog: [{ id: 0, type: 'narration', content: data.scene.description, imageUrl, isLoadingImage: false }],
    };

    return initialGameState;
}


export async function processPlayerAction(payload: PlayerActionPayload, language: 'en' | 'es', difficulty: 'easy' | 'medium' | 'hard'): Promise<GeminiNarrativeResponse> {
    const { description, skill, total, gameState, invokedAspects, targetOpponentId } = payload;
    const langInstruction = getLanguageInstruction(language);

    const allAspects = [
        gameState.character.aspects.highConcept,
        gameState.character.aspects.trouble,
        ...gameState.character.aspects.others,
    ];
    const allAspectNames = allAspects.map(a => a.name);

    const consequencesText = gameState.character.consequences.map(c => {
        const freeInvokeTag = c.aspect.hasFreeInvoke ? ' (Free GM Invoke)' : '';
        return `"${c.aspect.name}" (${c.severity})${freeInvokeTag}`;
    }).join(', ') || 'None';
    
    const opponentsText = gameState.scene.opponents && gameState.scene.opponents.length > 0
    ? gameState.scene.opponents.map(o => {
        const oppConsequences = Array.isArray(o.consequences) ? (o.consequences.map(c => c.aspect.name).join(', ') || 'None') : 'None';
        const physicalStress = o.physicalStress && Array.isArray(o.physicalStress.marked) && Array.isArray(o.physicalStress.boxes)
          ? `${o.physicalStress.marked.filter(m => m).length}/${o.physicalStress.boxes.length}`
          : 'N/A';
        const mentalStress = o.mentalStress && Array.isArray(o.mentalStress.marked) && Array.isArray(o.mentalStress.boxes)
          ? `${o.mentalStress.marked.filter(m => m).length}/${o.mentalStress.boxes.length}`
          : 'N/A';
        return `  - ID: ${o.id}, Name: ${o.name}, Status: ${o.isTakenOut ? 'Taken Out' : 'Active'}, Physical Stress: ${physicalStress}, Mental Stress: ${mentalStress}, Consequences: ${oppConsequences}`;
    }).join('\n')
    : 'None';

    let imageInstruction = '';
    switch (localSettings.imageGenerationFrequency) {
        case 'none':
            imageInstruction = 'You MUST NOT provide an `imagePrompt`. Set it to `null`.';
            break;
        case 'rarely':
            imageInstruction = 'Be EXTREMELY selective with image prompts. ONLY suggest one for a truly monumental, once-per-session-style event. Otherwise, `imagePrompt` MUST be `null`.';
            break;
        case 'sometimes':
            imageInstruction = `**Image Generation:** ONLY provide an \`imagePrompt\` for one of these specific situations: a) a new, visually distinct scene begins, b) a new, important opponent is introduced, or c) the action results in a highly dramatic or world-altering outcome. For all other routine actions, you **MUST** set \`imagePrompt\` to \`null\`.`;
            break;
        case 'always':
            imageInstruction = 'You should ALWAYS provide a detailed, dynamic `imagePrompt` to visualize the outcome of the player\'s action and the subsequent events. Describe the character, the setting, and the mood.';
            break;
    }


    const prompt = `
    You are a Game Master for a Fate Core RPG. Here is the current situation:
    ${langInstruction}
    
    **Character:**
    - Name: ${gameState.character.name}
    - Aspects: ${allAspectNames.map(name => `"${name}"`).join(', ')}
    - Consequences: ${consequencesText}
    - Fate Points: ${gameState.character.fatePoints}
    
    **Scene:**
    - Description: ${gameState.scene.description}
    - Scene Aspects: ${gameState.scene.aspects.map(a => `"${a.name}"`).join(', ')}
    - Opponents:\n${opponentsText}
    - Compel Offered in This Scene: ${!!gameState.scene.hasOfferedCompel}

    **Game Difficulty: ${difficulty.toUpperCase()}**

    **Player's Action:**
    The player wants to: "${description}"
    They are using their "${skill.name}" skill.
    ${targetOpponentId ? `They are targeting the opponent with ID: "${targetOpponentId}".` : ''}
    ${invokedAspects && invokedAspects.length > 0 ? `They invoked the following aspect(s): ${invokedAspects.map(a => `"${a}"`).join(', ')}.` : ''}
    Their total roll result (skill level + dice roll + bonuses) is: ${total}.

    **Your Task as Game Master:**
    Follow these steps to process the turn:

    **1. Understand Player Intent & The Four Actions:**
    Interpret the player's description ("${description}") to determine which of the four core Fate actions they are performing:
    - **Overcome:** Getting past an obstacle. Success means they do it.
    - **Create an Advantage:** Changing the situation to their benefit. Success creates a new Scene Aspect with a free invoke.
    - **Attack:** Directly harming an opponent. This action requires a \`targetOpponentId\`.
    - **Defend:** A passive action; their skill is the difficulty for an opponent's attack.

    **2. Set Difficulty & Resolve:**
    - Based on the **Game Difficulty (${difficulty.toUpperCase()})**, set a logical difficulty for the action.
      - **Easy:** Lower difficulties (e.g., +0 to +2). Opponents have lower skills (e.g., Average +1).
      - **Medium:** Standard difficulties (e.g., +2 to +4). Opponents have average skills (e.g., Fair +2).
      - **Hard:** Higher difficulties (e.g., +4 and up). Opponents have higher skills (e.g., Good +3 or more) and use teamwork.
    - Compare the player's total roll of **${total}** to the difficulty you set. 
    - For an **Attack**, the difficulty is the opponent's defense skill (e.g., Fight, Physique). Adjust this based on the game difficulty.
    - For **Defense**, the player's roll is their defense total against an NPC attack this turn.

    **3. Handle Player Attack on Opponent (CRITICAL):**
    - If the player performs an **Attack** on a \`targetOpponentId\` and **succeeds**, calculate the shifts of damage (player's total - opponent's defense).
    - You **MUST** apply these shifts to the targeted opponent's \`physicalStress\` or \`mentalStress\` track by marking boxes as \`true\`.
    - If stress boxes are full, the opponent takes a consequence. The new consequence object **MUST be added to their \`consequences\` array**. A Mild consequence absorbs 2 shifts, Moderate absorbs 4.
    - If an opponent cannot absorb all shifts, you **MUST** set their \`isTakenOut\` field to \`true\`.
    - The updated state of ALL opponents **MUST** be returned in the \`updatedOpponents\` field of your JSON response.

    **4. Handle "Create an Advantage":**
    - If the player was trying to **Create an Advantage** and they **succeeded**, you **MUST** create a new situational aspect and add it using the \`newSceneAspect\` field. It should be a short phrase (e.g., "Slippery Floor," "Distracted Guard").

    **5. Take the NPCs' Turn (CRITICAL):**
    - After the player's action, the active (not \`isTakenOut\`) opponents react. 
    - **Pacing is key.** Not every action needs to be a counter-attack. NPCs can create advantages, try to escape, or call for backup. Their competence is dictated by the difficulty.
    - If the situation escalates and **new opponents arrive**, you MUST define them and add them to the \`updatedOpponents\` array. New opponents MUST have a unique \`id\`, \`name\`, \`aspects\`, \`isTakenOut: false\`, \`consequences: []\` (this MUST be an array), and valid stress tracks where the \`boxes\` and \`marked\` properties are both ARRAYS. For example, a valid 2-box stress track is \`"physicalStress": { "boxes": [1, 2], "marked": [false, false] }\`.
    - If an NPC attacks the player and hits, you **MUST** report it in the \`hit\` field. This object requires three properties: \`shifts\` (a positive number for damage), \`attackDescription\` (a string), and \`type\` ('physical' or 'mental'). The \`shifts\` value **MUST be a number**. For example: \`"hit": { "shifts": 2, "attackDescription": "The guard's stun baton crackles...", "type": "physical" }\`.

    **6. Consider a Compel (IMPORTANT):**
    - A good game has regular compels. If "Compel Offered in This Scene" is \`false\`, you should actively look for an opportunity to introduce one now.
    - The best compels arise from the character's **Trouble** aspect, but any aspect can be used to create a fun complication.
    - A compel should not halt the game, but rather introduce a narrative choice: accept the complication and gain a Fate Point, or spend one to avoid it.
    - If you decide to issue a compel, you **MUST** populate the \`compel\` field in your JSON response. This object requires four string properties: \`aspect\` (the name of the character aspect being compelled), \`reason\` (the complication you are introducing, e.g., "Your 'Greedy' nature makes you pause to scoop up the coins, even as the ceiling starts to collapse."), \`acceptNarration\` (what happens if the player accepts), and \`rejectNarration\` (what happens if they reject).
    - If you issue a compel, the rest of your narration for this turn should lead up to that choice. A compel is often the main event of an NPC's turn.

    **7. Determine if the Scene Ends:**
    - After the NPCs' turn, determine if the scene should end.
    - A scene **MUST** end and transition to a new one if:
        a) The player's action and the subsequent NPC reactions result in **all active opponents being Taken Out**.
        b) The player's action resolves the central challenge or goal of the current scene (e.g., they found the McGuffin, they successfully negotiated passage, they escaped the trap).
    - If the scene ends, you **MUST** respond with a \`newScene\` object in your JSON. This object needs a new \`description\` and new \`aspects\`. Your \`narration\` field should act as a bridge, describing the end of the current scene and the beginning of the next. Also, provide a new \`imagePrompt\` for the new scene. You should also populate \`removedSceneAspects\` with the names of aspects from the old scene that are no longer relevant.
    - If the scene continues, leave the \`newScene\` field as \`null\`.

    **8. Use Your Free Invocations:**
    - Review the player's 'Consequences' list. If any are marked with "(Free GM Invoke)", you can use a free +2 bonus for an NPC's action against the player.
    - If you use one, you **MUST** mention it in the narration and report it in the \`usedFreeInvokes\` array.

    **9. Combine Narration:**
    - Your \`narration\` field must describe everything: the result of the player's action AND the NPCs' reactions.

    **10. Image Prompt Instruction:**
    ${imageInstruction}

    **Response Format:**
    You MUST respond with a valid JSON object. Do not add any text outside the JSON block. For fields that are not applicable, either omit them or set their value to \`null\`.
    Example of a valid response when a scene **ends** (which is a dramatic moment warranting an image):
    {
      "narration": "With a final, desperate shove, you send the last guard tumbling over the railing. The corridor is finally clear. You race to the control panel and slam your hand on the emergency airlock release. Alarms blare as the outer doors cycle open, revealing the star-dusted void and your waiting ship. You leap across the gap, landing hard on the ramp as it seals behind you. Safe, for now.",
      "imagePrompt": "A sci-fi hero in a battered jumpsuit leaping from a space station corridor towards their small freighter ship, with stars and a nebula in the background, dramatic action shot.",
      "newScene": {
        "description": "You are in the cockpit of your ship, the 'Stardust Drifter'. The engine hums reassuringly. The immediate threat is gone, but a warning flashes on your console: 'UNIDENTIFIED TRACKING SIGNAL DETECTED'. You're not out of this yet.",
        "aspects": [
          { "name": "The Open Void", "description": "You're safe in your ship, but surrounded by empty space." },
          { "name": "Mysterious Tracking Signal", "description": "Someone knows where you are, and they might be following." }
        ],
        "opponents": []
      },
      "updatedOpponents": [],
      "removedSceneAspects": ["Security Guards on Patrol", "Locked Airlock"],
      "usedFreeInvokes": null,
      "hit": null,
      "compel": null
    }
    
    Now, process the player's action described above.
    `;

    return callAIWithRetry<GeminiNarrativeResponse>({
        contents: prompt,
        config: { responseMimeType: "application/json" },
    });
}

export async function processPlayerTakenOut(gameState: GameState, hit: { shifts: number; attackDescription: string; type: 'physical' | 'mental'; }, language: 'en' | 'es'): Promise<GeminiNarrativeResponse> {
    const { character } = gameState;
    const langInstruction = getLanguageInstruction(language);
    const prompt = `
    You are a Game Master for a Fate Core RPG. The player's character has been defeated in a conflict.
    ${langInstruction}

    **Character:**
    - Name: ${character.name}
    - Aspects: ${[character.aspects.highConcept, character.aspects.trouble, ...character.aspects.others].map(a => a.name).join(', ')}

    **The Defeating Blow:**
    The character was hit for ${hit.shifts} shifts of ${hit.type} damage from "${hit.attackDescription}". They could not absorb the hit and have been **Taken Out**.

    **Your Task as Game Master:**
    1.  **Narrate the Outcome:** Describe what being "Taken Out" means in this context. The character is NOT necessarily dead. They might be captured, knocked unconscious, left for dead, or forced to flee. The consequence should be significant and drive the story forward.
    2.  **Transition to a New Scene:** The current conflict is over. Create a new scene that follows from the character being taken out. Where do they wake up? What is their new, immediate situation?
    3.  **Provide Scene Details:** Define the new scene's description and some starting scene aspects.

    **Response Format:**
    You MUST respond with a valid JSON object. Do not add any text outside the JSON block.
    {
      "narration": "A vivid narration of the character being taken out AND the transition to the new scene. E.g., 'The world fades to black... You wake up in a damp, cold cell...' ",
      "newScene": {
        "description": "The description for the *new* scene.",
        "aspects": [
          { "name": "New Scene Aspect 1", "description": "A descriptive aspect for the new scene." }
        ]
      },
      "imagePrompt": "A detailed prompt for an AI image generator to visualize the new scene."
    }

    Note: The 'narration' should be a bridge, and the 'newScene' object should define the new state. Do not include 'hit', 'compel' or 'updatedCharacter' fields.
    `;

    interface TakenOutResponse {
        narration: string;
        newScene: Omit<Scene, 'imageUrl'>;
        imagePrompt: string | null;
    }

    const result = await callAIWithRetry<TakenOutResponse>({
        contents: prompt,
        config: { responseMimeType: "application/json" },
    });
    
    return {
      narration: result.narration,
      imagePrompt: result.imagePrompt || undefined,
      newScene: { ...result.newScene, imageUrl: undefined },
    };
}

export async function processPlayerConcession(gameState: GameState, hit: { shifts: number; attackDescription: string; type: 'physical' | 'mental'; }, language: 'en' | 'es'): Promise<GeminiNarrativeResponse> {
    const { character } = gameState;
    const langInstruction = getLanguageInstruction(language);
    const prompt = `
    You are a Game Master for a Fate Core RPG. The player's character has chosen to **concede** the conflict.
    ${langInstruction}

    **Character:**
    - Name: ${character.name}
    - Aspects: ${[character.aspects.highConcept, character.aspects.trouble, ...character.aspects.others].map(a => a.name).join(', ')}

    **The Current Situation:**
    The character was about to be hit for ${hit.shifts} shifts of ${hit.type} damage from "${hit.attackDescription}". Rather than be forcefully taken out, they have chosen to concede. By conceding, they accept defeat but get to control *how* they lose. They also gain a Fate Point.

    **Your Task as Game Master:**
    1.  **Narrate the Concession:** Describe how the character bows out of the conflict. This should not be a brutal defeat. Instead, it's a controlled exit. They might make a tactical retreat, be captured on their own terms, or simply give up their immediate goal to escape a worse fate. The narration should reflect their agency in this decision.
    2.  **Transition to a New Scene:** The conflict is over. Create a new scene that follows from the concession. Where do they end up? What's their new situation?
    3.  **Provide Scene Details:** Define the new scene's description and some starting scene aspects.

    **Response Format:**
    You MUST respond with a valid JSON object. Do not add any text outside the JSON block.
    {
      "narration": "A vivid narration of the character conceding the conflict AND the transition to the new scene. E.g., 'Holding your hands up in surrender, you back away from the fight... You find yourself being escorted to the captain's quarters, disarmed but not unconscious.'",
      "newScene": {
        "description": "The description for the *new* scene.",
        "aspects": [
          { "name": "New Scene Aspect 1", "description": "A descriptive aspect for the new scene." }
        ]
      },
      "imagePrompt": "A detailed prompt for an AI image generator to visualize the new scene after the concession."
    }

    Note: The player has already been awarded their Fate Point. Do not include 'hit', 'compel' or 'updatedCharacter' fields. The 'narration' should bridge to the 'newScene'.
    `;

    interface ConcessionResponse {
        narration: string;
        newScene: Omit<Scene, 'imageUrl'>;
        imagePrompt: string | null;
    }

    const result = await callAIWithRetry<ConcessionResponse>({
        contents: prompt,
        config: { responseMimeType: "application/json" },
    });
    
    return {
      narration: result.narration,
      imagePrompt: result.imagePrompt || undefined,
      newScene: { ...result.newScene, imageUrl: undefined },
    };
}
