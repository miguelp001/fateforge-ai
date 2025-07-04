
import React from 'react';
import { t } from '../i18n';
import { CloseIcon } from './icons/CloseIcon';

interface ApiKeyHelpModalProps {
    onClose: () => void;
    language: 'en' | 'es';
}

export function ApiKeyHelpModal({ onClose, language }: ApiKeyHelpModalProps) {
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-key-help-title"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 border border-cyan-500/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 relative animate-fade-in-scale"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    aria-label="Close help"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h2 id="api-key-help-title" className="text-2xl font-bold font-serif text-cyan-400 mb-6 text-center">{t('apiKeyHelpTitle', language)}</h2>
                
                <div className="space-y-4 text-slate-300">
                    <ol className="list-decimal list-inside space-y-3">
                        <li>{t('apiKeyHelpStep1', language)}</li>
                        <li>{t('apiKeyHelpStep2', language)}</li>
                        <li>{t('apiKeyHelpStep3', language)}</li>
                        <li>{t('apiKeyHelpStep4', language)}</li>
                    </ol>
                    
                    <div className="pt-4 text-center">
                        <a 
                            href="https://aistudio.google.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {t('visitAiStudio', language)}
                        </a>
                    </div>
                </div>
            </div>
            {/* Re-add animation style since it's a new component */}
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
    );
}
