
import React, { useState, useCallback, useEffect } from 'react';
import GameSetup from './components/GameSetup';
import GameView from './components/GameView';
import CharacterCreation from './components/CharacterCreation';
import SettingsModal from './components/SettingsModal';
import { GameState, GameStatus, Character, CharacterCreationOptions, AppSettings } from './types';
import { generateCharacterCreationOptions, createOpeningScene, updateAiSettings } from './services/geminiService';
import { saveGameState, loadGameState, hasSavedGame, clearSavedGame, saveSettings, loadSettings } from './services/storageService';
import { Spinner } from './components/ui/Spinner';
import { t } from './i18n';
import * as analytics from './services/analyticsService';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Setup);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [creationOptions, setCreationOptions] = useState<CharacterCreationOptions | null>(null);
  const [saveExists, setSaveExists] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const language = settings?.language || 'en';

  useEffect(() => {
    // Hardcode analytics initialization
    analytics.init('G-1S7XTJQD27');
    
    setSaveExists(hasSavedGame());
    const loadedSettings = loadSettings();

    if (loadedSettings) {
        // Settings exist, apply them
        handleSaveSettings(loadedSettings, false);
    } else {
        // No settings exist (first launch), create defaults and save them.
        // Go directly to the game setup screen.
        const defaultSettings: AppSettings = { 
            imageGenerationFrequency: 'sometimes', 
            language: 'en', 
            difficulty: 'medium',
        };
        handleSaveSettings(defaultSettings, true);
    }
  }, []);

  useEffect(() => {
    analytics.trackPageView(`/${gameStatus.toString().toLowerCase()}`);
  }, [gameStatus]);

  const handleSaveSettings = (newSettings: AppSettings, shouldSave: boolean = true) => {
    try {
      updateAiSettings(newSettings);
      setSettings(newSettings);
      if (shouldSave) {
          saveSettings(newSettings);
      }
      setIsSettingsModalOpen(false);
      setError(null);
    } catch (e: any) {
        console.error("Error in settings:", e);
        setError(e.message);
    }
  };

  const handleStartNewGame = useCallback(async (genre: string) => {
    analytics.trackEvent('start_new_game', { genre });
    clearSavedGame();
    setSaveExists(false);

    setGameStatus(GameStatus.LoadingCharacterOptions);
    setSelectedGenre(genre);
    setError(null);
    try {
      const options = await generateCharacterCreationOptions(genre, language);
      setCreationOptions(options);
      setGameStatus(GameStatus.CharacterCreation);
    } catch (e: any) {
      analytics.trackEvent('error', { 'event_category': 'character_creation_options', 'error_message': e.message });
      console.error(e);
      setError(e.message || 'Failed to generate character options. Please ensure the backend is configured correctly and try again.');
      setGameStatus(GameStatus.Setup);
    }
  }, [language]); 

  const handleCharacterCreate = useCallback(async (character: Character) => {
    if (!selectedGenre || !settings) {
      setError("Genre or settings not selected. This shouldn't happen. Please restart.");
      setGameStatus(GameStatus.Setup);
      return;
    }
    analytics.trackEvent('create_character', { 'character_name': character.name, 'genre': selectedGenre });
    setGameStatus(GameStatus.LoadingScene);
    setError(null);
    try {
      const initialState = await createOpeningScene(character, selectedGenre, settings.language, settings.difficulty);
      setGameState(initialState);
      setGameStatus(GameStatus.Playing);
      setSaveExists(true); // A new game has started, a save is possible
    } catch (e: any)
    {
      analytics.trackEvent('error', { 'event_category': 'opening_scene', 'error_message': e.message });
      console.error(e);
      setError(e.message || 'Failed to create the opening scene. Please ensure the backend is configured correctly and try creating your character again.');
      setGameStatus(GameStatus.CharacterCreation);
    }
  }, [selectedGenre, settings]);
  
  const handleBackToSetup = () => {
    setGameStatus(GameStatus.Setup);
    setError(null);
    setCreationOptions(null);
    setSelectedGenre(null);
  };

  const handleLoadGame = useCallback(() => {
    analytics.trackEvent('load_game');
    setError(null);
    const loadedState = loadGameState();
    if (loadedState) {
      setGameState(loadedState);
      setGameStatus(GameStatus.Playing);
    } else {
      setError("Your saved game was from an older version or was corrupted. Please start a new game.");
      setSaveExists(hasSavedGame()); // Re-check if the corrupt save was cleared
    }
  }, []);

  const handleSaveGame = useCallback(() => {
    analytics.trackEvent('save_game');
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  const handleNewGame = useCallback(() => {
    clearSavedGame();
    setGameState(null);
    setGameStatus(GameStatus.Setup);
    setSelectedGenre(null);
    setCreationOptions(null);
    setError(null);
    setSaveExists(false);
  }, []);

  const renderContent = () => {
    switch (gameStatus) {
      case GameStatus.Setup:
        return <GameSetup onStartNewGame={handleStartNewGame} error={error} onLoadGame={handleLoadGame} hasSavedGame={saveExists} onOpenSettings={() => setIsSettingsModalOpen(true)} language={language} />;
      
      case GameStatus.LoadingCharacterOptions:
        return (
          <div className="flex flex-col items-center justify-center h-screen">
            <Spinner />
            <p className="mt-4 text-lg text-slate-400">The AI is brainstorming ideas for your hero...</p>
          </div>
        );
        
      case GameStatus.CharacterCreation:
        if (creationOptions && selectedGenre) {
          return <CharacterCreation 
                    options={creationOptions} 
                    onCharacterCreate={handleCharacterCreate}
                    onBack={handleBackToSetup}
                    genre={selectedGenre}
                    language={language}
                  />;
        }
        // Fallback
        return <GameSetup onStartNewGame={handleStartNewGame} error="An unexpected error occurred. Please select a genre again." onLoadGame={handleLoadGame} hasSavedGame={saveExists} onOpenSettings={() => setIsSettingsModalOpen(true)} language={language}/>;

      case GameStatus.LoadingScene:
        return (
          <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <Spinner />
            <p className="mt-4 text-lg text-slate-400">The AI is crafting your opening scene and<br/>painting a picture of your world...</p>
          </div>
        );

      case GameStatus.Playing:
        if (gameState && settings) {
          return <GameView gameState={gameState} setGameState={setGameState} onSaveGame={handleSaveGame} onOpenSettings={() => setIsSettingsModalOpen(true)} settings={settings} />;
        }
        // Fallback
        return <GameSetup onStartNewGame={handleStartNewGame} error="An unexpected error occurred. Please start a new game." onLoadGame={handleLoadGame} hasSavedGame={saveExists} onOpenSettings={() => setIsSettingsModalOpen(true)} language={language}/>;

      case GameStatus.Error:
         return (
          <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <h1 className="text-3xl text-red-400 font-serif mb-4">An Error Occurred</h1>
            <p className="text-slate-300 mb-6">{error}</p>
            <button onClick={handleNewGame} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700">
              {t('startNewGame', language)}
            </button>
          </div>
        );
      default:
        return <GameSetup onStartNewGame={handleStartNewGame} error={null} onLoadGame={handleLoadGame} hasSavedGame={saveExists} onOpenSettings={() => setIsSettingsModalOpen(true)} language={language}/>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {renderContent()}
      {isSettingsModalOpen && (
        <SettingsModal
          currentSettings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsModalOpen(false)}
          appError={error}
        />
      )}
    </div>
  );
};

export default App;
