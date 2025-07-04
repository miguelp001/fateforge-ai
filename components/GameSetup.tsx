
import React, { useState } from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { t } from '../i18n';

interface GameSetupProps {
  onStartNewGame: (genre: string) => void;
  error: string | null;
  onLoadGame: () => void;
  hasSavedGame: boolean;
  onOpenSettings: () => void;
  language: 'en' | 'es';
}

function GameSetup({ onStartNewGame, error, onLoadGame, hasSavedGame, onOpenSettings, language }: GameSetupProps) {
  const genres = [
    "Cyberpunk Heist",
    "Fantasy Dungeon Crawl",
    "Space Opera",
    "Noir Detective",
    "Post-Apocalyptic Survival",
    "Urban Fantasy",
    "Modern Lovecraftian Horror",
    "Solarpunk Rebellion"
  ];

  const [selectedGenre, setSelectedGenre] = useState<string>(genres[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGenre) {
      if (hasSavedGame) {
        if (window.confirm(t('confirmNewGame', language))) {
          onStartNewGame(selectedGenre);
        }
      } else {
        onStartNewGame(selectedGenre);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="max-w-2xl w-full text-center relative">
        <button
          onClick={onOpenSettings}
          className="absolute top-0 right-0 text-slate-400 hover:text-cyan-400 transition-colors"
          aria-label="Open Settings"
        >
          <SettingsIcon className="w-8 h-8"/>
        </button>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 font-serif mt-8">
          FateForge <span className="text-cyan-400">AI</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl mb-8">
          An AI-powered Role-Playing Game Master
        </p>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-6">{t('chooseYourAdventure', language)}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`p-4 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400
                  ${selectedGenre === genre 
                    ? 'bg-cyan-500 text-white shadow-lg scale-105' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {hasSavedGame && (
              <button
                type="button"
                onClick={onLoadGame}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform duration-200 transform hover:scale-105 shadow-lg"
              >
                {t('loadSavedGame', language)}
              </button>
            )}
            <button
              type="submit"
              className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-transform duration-200 transform hover:scale-105 shadow-lg"
            >
              {hasSavedGame ? t('startNewGame', language) : t('createYourCharacter', language)}
            </button>
          </div>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default GameSetup;
