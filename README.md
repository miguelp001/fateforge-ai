
# FateForge AI

**Your personal AI Game Master for dynamic text-based role-playing adventures.**

FateForge AI is a single-player, text-based RPG where the story, characters, and world are brought to life by Google's Gemini API. It acts as your Game Master, weaving a narrative that responds dynamically to your choices. Using the core principles of the Fate Core tabletop system, you'll create a unique hero and embark on an adventure where your decisions truly matter. To make the experience even more immersive, the AI generates evocative images to illustrate key scenes and dramatic moments.

## How to Play

Playing FateForge AI is a conversation between you and the AI Game Master. Here’s how to get started and navigate your adventure.

### 1. Settings & API Key

**An API key is required to play.** The game uses the Google Gemini API, and you must provide your own key.

*   **Getting a Key:** You can get a free API key from [Google AI Studio](https://aistudio.google.com/). Click "Get API key" and follow the instructions to create one.
*   **Entering Your Key:** On first launch, the Settings menu will appear. Paste your API key into the designated field.
*   **Other Settings:** You can also configure your gameplay experience:
    *   **Language:** Switch between English and Spanish for the UI and all AI-generated content.
    *   **Difficulty:** Adjusts opponent skill and the overall challenge of the game.
    *   **Image Generation Frequency:** Control how often the AI generates images. You can choose from "None" to "Always (Every Turn)", allowing you to balance immersion with API usage and speed.

Your settings and API key are saved locally in your browser.

### 2. Choose Your Genre

The first step is to pick a genre for your story. This choice tells the AI what kind of world to build, what sort of challenges to present, and what tone the game should have. Whether you want a gritty `Cyberpunk Heist` or a classic `Fantasy Dungeon Crawl`, your selection sets the stage.

### 3. Create Your Hero

You have two ways to create your character:

*   **Manual Creation:** The AI provides lists of thematic options for your character's **Aspects** (core truths about them), and **Stunts** (special moves). You get to pick the ones you like, assign your **Skill** points in a pyramid, and give your character a name. This gives you fine-grained control over your hero.
*   **AI Generate:** Feeling adventurous? Click the "Generate Character" button. The AI will create a complete, thematic, and ready-to-play character for you, filling in everything from name to skills. You can always tweak the result before starting.

### 4. The Adventure Begins

Once your character is ready, the AI will generate your opening scene. You'll get a description of where you are, what's happening, and, depending on your settings, an AI-generated image to bring the moment to life. This is your starting point.

### 5. Reading the Screen

The game screen is responsive. On larger screens, it's laid out in three columns: your Character Sheet on the left, the Story Log in the center, and the Action Panel on the right. On smaller mobile screens, these panels can be opened via icons at the top of the screen.

### 6. Taking Action

When it's your turn to act:

1.  **Read the Story Log:** Understand the current situation.
2.  **Check Scene Aspects:** The box at the top of the Action Panel shows aspects relevant to the scene (e.g., `Dimly Lit`, `Crowded Room`). You can use these to your advantage.
3.  **Decide What You Do:** In the text box, describe the action you want to take (e.g., "I try to sneak past the guard," "I try to persuade the merchant to give me a discount").
4.  **Choose Your Skill:** Select the skill that best matches your action from the dropdown menu.
5.  **Click "Take Action":** The game will roll four "Fate Dice" (resulting in a value from -4 to +4) and add it to your skill level to determine your total effort. The AI then narrates the outcome.

### 7. Using Aspects & Fate Points

Aspects are the heart of the game. They are phrases that describe something true about your character or the scene. You can use them to your advantage.

*   **Invoking an Aspect:** Before you click "Take Action," you can spend one **Fate Point** to *invoke* a relevant aspect (either from your character sheet or the scene). To do this, simply click the "Invoke" button next to it. This gives you a **+2 bonus** to your roll, making success more likely.
*   **Compels:** The AI can also create a complication for you based on one of your aspects (especially your Trouble aspect). This is called a **Compel**. A modal window will pop up:
    *   **Accept the Compel:** You agree to the complication, and in return, you **gain one Fate Point**.
    *   **Reject the Compel:** You **spend one Fate Point** to avoid the complication.

### 8. Combat & Conflict

When a situation turns into a fight or another direct conflict, the rules become more detailed. After you take your action, the AI will take a turn for any Non-Player Characters (NPCs). If an NPC successfully attacks you, the action will pause, and a modal window will appear, telling you that you've been hit.

*   **Shifts:** A successful hit deals a certain number of "shifts" of damage. You **must** absorb all shifts from the hit to continue.
*   **Stress:** Your character has a Physical and a Mental stress track on their character sheet. You can check off empty boxes in these tracks to absorb shifts. Each stress box absorbs **1 shift** of damage. Stress boxes clear at the end of a conflict.
*   **Consequences:** If you don't have enough stress boxes, or you want to save them, you can take a Consequence. A consequence is a new, temporary aspect that describes your injury or setback. You must give it a name.
    *   **Mild Consequence:** Absorbs **2 shifts**.
    *   **Moderate Consequence:** Absorbs **4 shifts**.
    *   **Severe Consequence:** Absorbs **6 shifts**.
*   **Conceding the Conflict:** Instead of trying to absorb a hit, you can choose to **concede**. This means you are voluntarily taken out of the conflict, but you get to influence *how* you exit the scene (e.g., a tactical retreat instead of being knocked unconscious). You also gain **1 Fate Point** for making this choice. This is a good way to escape an unwinnable fight while retaining some control and resources.
*   **Being Taken Out:** If you cannot absorb all the shifts from a hit using your available stress and consequence slots, you are **Taken Out**. This doesn't mean you die (usually). It means the enemy has defeated you, and the AI will narrate what happens. You might be captured, knocked unconscious, or forced to flee the scene.

The story will continue based on the outcome of the conflict. Good luck!

---

## Core Technologies

*   **Frontend:** React with TypeScript
*   **AI Model:** Google Gemini API
*   **Image Generation:** Imagen 3 via Google Gemini API
*   **Styling:** Tailwind CSS
