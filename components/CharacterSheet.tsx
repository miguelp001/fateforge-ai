import React, { useMemo, memo } from 'react';
import { Character, Aspect, StressTrack } from '../types';
import { FatePointIcon } from './icons/FatePointIcon';
import { Tooltip } from './ui/Tooltip';
import { t } from '../i18n';

interface CharacterSheetProps {
  character: Character;
  onInvokeAspect: (aspectName: string) => void;
  invokedAspects: string[];
  isActionDisabled: boolean;
  language: 'en' | 'es';
}

function CharacterSheet({ character, onInvokeAspect, invokedAspects, isActionDisabled, language }: CharacterSheetProps) {
  const renderStressTrack = (track: StressTrack, type: 'physical' | 'mental') => (
    <div className="flex gap-2">
      {(track?.boxes ?? []).map((box, index) => {
        const isMarked = track.marked?.[index];
        return (
          <div key={`${type}-${index}`} className={`w-6 h-6 border-2 ${isMarked ? 'bg-red-500/50 border-red-400' : 'border-slate-600'} rounded-sm flex items-center justify-center text-slate-500 text-xs`}>
            {box}
          </div>
        );
      })}
    </div>
  );

  const allAspects = useMemo(() => {
    const aspects: (Aspect & { label: string | null })[] = [];
    if (character.aspects?.highConcept) {
      aspects.push({ ...character.aspects.highConcept, label: t('highConcept', language) });
    }
    if (character.aspects?.trouble) {
      aspects.push({ ...character.aspects.trouble, label: t('trouble', language) });
    }
    if (character.aspects?.others) {
      character.aspects.others.forEach(a => aspects.push({ ...a, label: null }));
    }
    return aspects;
  }, [character.aspects, language]);


  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 h-full lg:sticky top-4">
      <h2 className="text-2xl font-bold text-white font-serif border-b border-slate-600 pb-2 mb-4">{character.name ?? 'Nameless Hero'}</h2>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">{t('fatePoints', language)}</h3>
        <div className="flex items-center gap-2 text-2xl font-bold text-white">
          <FatePointIcon className="w-6 h-6 text-cyan-400" />
          <span>{character.fatePoints ?? 0}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('aspects', language)}</h3>
          <ul className="space-y-2">
            {allAspects.map((aspect) => {
                const isInvoked = invokedAspects.includes(aspect.name);
                const canInvoke = (character.fatePoints ?? 0) > 0 || isInvoked;
                return (
                 <li key={aspect.name} className={`p-2 bg-slate-700/50 rounded-md transition-all ${isInvoked ? 'ring-2 ring-cyan-400 shadow-lg' : ''}`}>
                    {aspect.label && <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider pb-1">{aspect.label}</p>}
                    <div className="flex justify-between items-center gap-2">
                        <Tooltip text={aspect.description}>
                            <p className="font-semibold text-slate-200 flex-grow pr-2">{aspect.name}</p>
                        </Tooltip>
                        <button
                            onClick={() => onInvokeAspect(aspect.name)}
                            disabled={isActionDisabled || !canInvoke}
                            className={`flex-shrink-0 text-xs font-semibold py-1 px-2 rounded transition-colors ${
                                isInvoked
                                ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            } disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-slate-800`}
                            aria-label={`Invoke ${aspect.name}`}
                        >
                            {isInvoked ? t('invoked', language) : t('invoke', language)}
                        </button>
                    </div>
                 </li>
                )
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('skills', language)}</h3>
          <ul className="space-y-1 text-sm">
            {(character.skills ?? []).sort((a,b) => b.level - a.level).map((skill) => (
              <li key={skill.name} className="flex justify-between items-baseline p-1.5 bg-slate-700/50 rounded">
                <span className="text-slate-300">{t(skill.name as any, language)}</span>
                <span className="font-mono text-slate-400">
                  {t(skill.levelName as any, language)} (+{skill.level})
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('stunts', language)}</h3>
            <ul className="space-y-2">
                {(character.stunts ?? []).map((stunt) => (
                    <li key={stunt.name} className="p-2 bg-slate-700/50 rounded-md">
                        <p className="font-semibold text-slate-200">{stunt.name}</p>
                        <p className="text-xs text-slate-400 italic mt-1">{stunt.description}</p>
                    </li>
                ))}
            </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('stress', language)}</h3>
          <div className="space-y-2">
             <div className="text-sm">
                <p className="text-slate-400 mb-1">{t('physical', language)}</p>
                {renderStressTrack(character.physicalStress, 'physical')}
             </div>
             <div className="text-sm">
                <p className="text-slate-400 mb-1">{t('mental', language)}</p>
                {renderStressTrack(character.mentalStress, 'mental')}
             </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('consequences', language)}</h3>
          {character.consequences.length > 0 ? (
            <ul className="space-y-2">
              {character.consequences.map((consequence) => (
                 <li key={consequence.aspect.name} className={`p-2 bg-red-900/40 rounded-md border border-red-700/50`}>
                    <p className="text-xs text-red-300 font-semibold uppercase tracking-wider pb-1">{consequence.severity}</p>
                    <Tooltip text={consequence.aspect.description}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-red-200">{consequence.aspect.name}</p>
                        {consequence.aspect.hasFreeInvoke && (
                          <span className="ml-2 text-xs font-bold text-orange-400 bg-orange-900/50 px-2 py-0.5 rounded-full">Hostile Invoke!</span>
                        )}
                      </div>
                    </Tooltip>
                 </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">{t('noneForNow', language)}</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default memo(CharacterSheet);