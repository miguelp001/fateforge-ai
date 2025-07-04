import React, { useState, useMemo, useCallback } from 'react';
import { Character, Consequence, HitAbsorption, TakenOutResolution, ConcedeResolution } from '../types';
import { t } from '../i18n';

interface AbsorbHitModalProps {
  hit: {
    shifts: number;
    attackDescription: string;
    type: 'physical' | 'mental';
  };
  character: Character;
  onResolve: (resolution: HitAbsorption | TakenOutResolution | ConcedeResolution) => void;
  language: 'en' | 'es';
}

function AbsorbHitModal({ hit, character, onResolve, language }: AbsorbHitModalProps) {
  const CONSEQUENCE_SLOTS = {
    mild: { shifts: 2, label: 'Mild Consequence' },
    moderate: { shifts: 4, label: 'Moderate Consequence' },
    severe: { shifts: 6, label: 'Severe Consequence' },
  };

  const { shifts, attackDescription, type } = hit;
  
  const stressTrack = type === 'physical' ? character.physicalStress : character.mentalStress;

  const [selectedStressIndices, setSelectedStressIndices] = useState<number[]>([]);
  const [selectedConsequence, setSelectedConsequence] = useState<'mild' | 'moderate' | 'severe' | null>(null);
  const [consequenceName, setConsequenceName] = useState('');

  const availableConsequenceSlots = useMemo(() => {
    const existingSeverities = character.consequences.map(c => c.severity);
    return (Object.keys(CONSEQUENCE_SLOTS) as Array<keyof typeof CONSEQUENCE_SLOTS>).filter(
      severity => !existingSeverities.includes(severity)
    );
  }, [character.consequences]);

  const handleStressClick = (index: number) => {
    if (stressTrack.marked[index]) return; // Can't select already marked box
    
    setSelectedStressIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const totalAbsorbed = useMemo(() => {
    let absorbed = selectedStressIndices.length;
    if (selectedConsequence) {
      absorbed += CONSEQUENCE_SLOTS[selectedConsequence].shifts;
    }
    return absorbed;
  }, [selectedStressIndices, selectedConsequence]);
  
  const maxPossibleAbsorption = useMemo(() => {
    const unmarkedStress = stressTrack.boxes.filter((_, i) => !stressTrack.marked[i]).length;
    
    let consequenceShifts = 0;
    availableConsequenceSlots.forEach(severity => {
        consequenceShifts += CONSEQUENCE_SLOTS[severity].shifts;
    });
    
    return unmarkedStress + consequenceShifts;
  }, [stressTrack, availableConsequenceSlots]);

  const isTakenOut = shifts > maxPossibleAbsorption;
  const isResolved = totalAbsorbed >= shifts;
  const isConsequenceFormValid = !selectedConsequence || (!!consequenceName.trim());
  const canConfirm = isResolved && isConsequenceFormValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    
    let newConsequence: Consequence | null = null;
    if (selectedConsequence && consequenceName.trim()) {
      newConsequence = {
        severity: selectedConsequence,
        aspect: {
          name: consequenceName.trim(),
          description: `A ${selectedConsequence} consequence taken from: ${attackDescription}`,
          hasFreeInvoke: true, // The opponent (AI) gets a free invoke
        }
      };
    }

    onResolve({
      stressType: type,
      markedStressIndices: selectedStressIndices,
      newConsequence: newConsequence,
    });
  };

  const renderTakenOut = () => (
    <div className="bg-slate-800 border border-red-500/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 text-center animate-fade-in-scale">
      <h2 className="text-3xl font-bold font-serif text-red-400 mb-2">{t('youAreTakenOut', language)}</h2>
      <p className="font-serif italic text-slate-200 text-lg mb-4">"{attackDescription}"</p>
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
        <p className="text-lg text-slate-300">{t('hitTooMuch', language, { shifts })}</p>
        <p className="text-slate-400 mt-2">{t('maxAbsorption', language, { max: maxPossibleAbsorption })}</p>
      </div>
      <button
        type="button"
        onClick={() => onResolve({ takenOut: true })}
        className="w-full bg-red-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
      >
        {t('acknowledgeDefeat', language)}
      </button>
    </div>
  );

  const renderAbsorbHit = () => (
    <div className="bg-slate-800 border border-red-500/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 text-center animate-fade-in-scale">
      <form onSubmit={handleSubmit}>
        <h2 className="text-3xl font-bold font-serif text-red-400 mb-2">{t('youreHit', language)}</h2>
        <p className="font-serif italic text-slate-200 text-lg mb-4">"{attackDescription}"</p>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-lg text-slate-300">{t('mustAbsorb', language)} <span className="font-bold text-2xl text-white">{shifts}</span> {t('shiftsOf', language)} <span className="font-semibold text-red-300">{type}</span> {t('damage', language)}</p>
          <p className="text-lg text-slate-300 mt-2">{t('shiftsAbsorbed', language)} <span className={`font-bold text-2xl ${isResolved ? 'text-green-400' : 'text-yellow-400'}`}>{totalAbsorbed}</span></p>
        </div>

        <div className="text-left space-y-6">
          {/* Stress Track Section */}
          <div>
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">{t('useStressTrack', language)} <span className="text-base font-normal text-slate-400">({t('shiftsPerBox', language)})</span></h3>
            <div className="flex gap-2 p-3 bg-slate-700/50 rounded-lg justify-center flex-wrap">
              {stressTrack.boxes.map((box, index) => {
                const isMarked = stressTrack.marked[index];
                const isSelected = selectedStressIndices.includes(index);
                return (
                  <button
                    type="button"
                    key={index}
                    disabled={isMarked}
                    onClick={() => handleStressClick(index)}
                    className={`w-10 h-10 border-2 rounded-md flex items-center justify-center text-lg transition-colors
                      ${isMarked ? 'bg-slate-800 border-slate-600 cursor-not-allowed' : 'border-slate-500 hover:bg-slate-600'}
                      ${isSelected ? 'bg-red-500 border-red-400 ring-2 ring-white' : ''}
                    `}
                    aria-label={`Stress box ${box}, ${isMarked ? 'already marked' : 'available'}`}
                  >
                    {isMarked ? <span className="text-red-400 text-2xl">X</span> : box}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Consequence Section */}
          <div>
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">{t('takeAConsequence', language)}</h3>
            <div className="space-y-3">
              {availableConsequenceSlots.length > 0 ? (
                availableConsequenceSlots.map(severity => {
                  const details = CONSEQUENCE_SLOTS[severity];
                  const isSelected = selectedConsequence === severity;
                  return (
                    <div key={severity}>
                      <label className={`flex items-start p-3 rounded-md cursor-pointer transition-all ${isSelected ? 'bg-cyan-600/30 ring-2 ring-cyan-500' : 'bg-slate-700/50'}`}>
                        <input
                          type="radio"
                          name="consequence"
                          checked={isSelected}
                          onChange={() => setSelectedConsequence(severity)}
                          className="mt-1 mr-3 h-4 w-4 rounded-full border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                          <span className="font-semibold text-slate-200">{details.label}</span>
                          <p className="text-sm text-slate-400">Absorbs {details.shifts} shifts</p>
                        </div>
                      </label>
                        {isSelected && (
                        <div className="mt-2 pl-6">
                          <input
                            type="text"
                            value={consequenceName}
                            onChange={(e) => setConsequenceName(e.target.value)}
                            placeholder={t('nameYourConsequence', language)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              ) : <p className="text-slate-500 italic p-3 text-center">{t('allSlotsFull', language)}</p>}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
            <button
              type="submit"
              disabled={!canConfirm}
              className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {t('confirmAbsorption', language)}
            </button>
            {!isResolved && <p className="text-yellow-400 text-sm mt-2">{t('mustAbsorbToContinue', language, { shifts })}</p>}
            {selectedConsequence && !consequenceName.trim() && <p className="text-yellow-400 text-sm mt-2">{t('nameYourConsequence', language)}</p>}
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <p className="text-center text-sm text-slate-400 mb-2">{t('orConcede', language)}</p>
        <button
            type="button"
            onClick={() => onResolve({ concede: true })}
            className="w-full bg-yellow-600 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg"
        >
            {t('concedeTheConflict', language)}
        </button>
      </div>

    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      {isTakenOut ? renderTakenOut() : renderAbsorbHit()}
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

export default AbsorbHitModal;