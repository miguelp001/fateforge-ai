
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { t } from '../i18n';

interface SettingsModalProps {
  currentSettings: AppSettings | null;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  appError: string | null;
}

function SettingsModal({ currentSettings, onSave, onClose, appError }: SettingsModalProps) {
  const [imageGenerationFrequency, setImageGenerationFrequency] = useState<AppSettings['imageGenerationFrequency']>(
    currentSettings?.imageGenerationFrequency || 'sometimes'
  );
  const [language, setLanguage] = useState<'en' | 'es'>(currentSettings?.language || 'en');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(currentSettings?.difficulty || 'medium');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ imageGenerationFrequency, language, difficulty });
  };
  
  const currentLang = currentSettings?.language || language;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-slate-800 border border-cyan-500/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative animate-fade-in-scale" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              aria-label="Close settings"
          >
              <CloseIcon className="w-6 h-6" />
          </button>
          <h2 id="settings-title" className="text-3xl font-bold font-serif text-cyan-400 mb-6 text-center">{t('settings', currentLang)}</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label htmlFor="language-select" className="block text-sm font-medium text-slate-300 mb-1">
                {t('language', currentLang)}
              </label>
              <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
              >
                  <option value="en">English</option>
                  <option value="es">Español</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="difficulty-select" className="block text-sm font-medium text-slate-300 mb-1">
                {t('difficulty', currentLang)}
              </label>
              <select
                  id="difficulty-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
              >
                  <option value="easy">{t('easy', currentLang)}</option>
                  <option value="medium">{t('medium', currentLang)}</option>
                  <option value="hard">{t('hard', currentLang)}</option>
              </select>
               <p className="text-xs text-slate-500 mt-1">{t('difficultyDesc', currentLang)}</p>
            </div>

            <div>
              <label htmlFor="image-freq-select" className="block text-sm font-medium text-slate-300 mb-1">
                {t('imageGenerationFrequency', currentLang)}
              </label>
              <select
                  id="image-freq-select"
                  value={imageGenerationFrequency}
                  onChange={(e) => setImageGenerationFrequency(e.target.value as AppSettings['imageGenerationFrequency'])}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
              >
                  <option value="none">{t('freqNone', currentLang)}</option>
                  <option value="rarely">{t('freqRarely', currentLang)}</option>
                  <option value="sometimes">{t('freqSometimes', currentLang)}</option>
                  <option value="always">{t('freqAlways', currentLang)}</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">{t('imageGenerationFrequencyDesc', currentLang)}</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('saveSettings', currentLang)}
              </button>
            </div>
          </form>

          {appError && (
            <div className="mt-4">
              <p className="text-red-400 text-center">{appError}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-700/50 text-center text-xs text-slate-400">
            <p className="mb-1">Created by Miguel Pimentel</p>
            <a href="https://www.aredpanic.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
              www.aredpanic.com
            </a>
          </div>

        </div>
        <style>{`
          @keyframes fade-in-scale {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale {
            animation: fade-in-scale 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </>
  );
};

export default SettingsModal;
