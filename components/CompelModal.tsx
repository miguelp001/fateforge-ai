import React from 'react';
import { Compel } from '../types';
import { FatePointIcon } from './icons/FatePointIcon';
import { t } from '../i18n';

interface CompelModalProps {
  compel: Compel;
  onResolve: (accepted: boolean) => void;
  canReject: boolean;
  language: 'en' | 'es';
}

function CompelModal({ compel, onResolve, canReject, language }: CompelModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-slate-800 border border-cyan-500/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 text-center animate-fade-in-scale">
        <h2 className="text-3xl font-bold font-serif text-cyan-400 mb-4">{t('aCompel', language)}</h2>
        <p className="text-slate-300 mb-2">{t('yourAspect', language)}</p>
        <p className="text-xl font-semibold text-white bg-slate-700/50 rounded-md py-2 px-4 mb-4">
          "{compel.aspect}"
        </p>
        <p className="text-slate-300 mb-2">{t('suggestsComplication', language)}</p>
        <p className="font-serif italic text-slate-200 text-lg mb-8">
          "{compel.reason}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onResolve(true)}
            className="w-full flex flex-col items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 transition-all duration-200 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-400"
          >
            <span>{t('acceptCompel', language)}</span>
            <span className="text-sm font-normal text-green-200 flex items-center gap-1">
              {t('gainFatePoint', language)} 1 <FatePointIcon className="w-4 h-4" />
            </span>
          </button>
          <button
            onClick={() => onResolve(false)}
            disabled={!canReject}
            className="w-full flex flex-col items-center justify-center bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span>{t('rejectCompel', language)}</span>
            <span className="text-sm font-normal text-red-200 flex items-center gap-1">
              {t('spendFatePoint', language)} 1 <FatePointIcon className="w-4 h-4" />
            </span>
          </button>
        </div>
        {!canReject && (
          <p className="text-red-400 text-xs mt-4">{t('cannotReject', language)}</p>
        )}
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
  );
};

export default CompelModal;