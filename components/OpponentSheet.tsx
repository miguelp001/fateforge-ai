import React, { memo } from 'react';
import { Opponent, StressTrack, Consequence } from '../types';
import { Tooltip } from './ui/Tooltip';
import { t } from '../i18n';

interface OpponentSheetProps {
  opponent: Opponent;
  language: 'en' | 'es';
}

function OpponentSheet({ opponent, language }: OpponentSheetProps) {

  const renderStressTrack = (track: StressTrack, type: 'physical' | 'mental') => {
    if (!track || !Array.isArray(track.boxes)) {
      return null;
    }
    
    return (
      <div className="flex gap-1.5 mt-1">
        {track.boxes.map((box, index) => {
          const isMarked = Array.isArray(track.marked) && track.marked[index];
          return (
            <div key={`${type}-${index}`} className={`w-5 h-5 border ${isMarked ? 'bg-red-500/50 border-red-400' : 'border-slate-600'} rounded-sm flex items-center justify-center text-slate-500 text-xs`}>
              {box}
            </div>
          );
        })}
      </div>
    );
  };

  const renderConsequences = (consequences: Consequence[]) => {
    if (!Array.isArray(consequences) || consequences.length === 0) return null;
    return (
      <div className="mt-2 space-y-1">
        {consequences.map(c => (
          <div key={c.aspect.name} className="text-xs bg-red-900/40 rounded-md px-2 py-1 border border-red-800/50">
            <span className="font-semibold text-red-300">{c.aspect.name}</span> <span className="text-red-400/80">({c.severity})</span>
          </div>
        ))}
      </div>
    );
  };

  if (opponent.isTakenOut) {
    return (
      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 opacity-50">
        <h4 className="font-bold text-slate-400 line-through">{opponent.name}</h4>
        <p className="text-sm font-bold text-red-500">{t('takenOut', language)}</p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
      <h4 className="font-bold text-cyan-300">{opponent.name}</h4>
      
      {opponent.aspects && opponent.aspects.length > 0 && (
         <div className="mt-2 space-y-1">
            {opponent.aspects.map(aspect => (
                <Tooltip text={aspect.description} key={aspect.name}>
                    <div className="text-xs italic text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full inline-block">
                        {aspect.name}
                    </div>
                </Tooltip>
            ))}
        </div>
      )}
      
      {opponent.physicalStress && (
        <div className="mt-2">
            <p className="text-xs font-semibold text-slate-400">{t('physical', language)} Stress</p>
            {renderStressTrack(opponent.physicalStress, 'physical')}
        </div>
      )}
       
      {opponent.mentalStress && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-slate-400">{t('mental', language)} Stress</p>
            {renderStressTrack(opponent.mentalStress, 'mental')}
        </div>
      )}
      
      {renderConsequences(opponent.consequences)}

    </div>
  );
}

export default memo(OpponentSheet);