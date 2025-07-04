import React, { useState, useMemo, memo } from 'react';
import { Scene, Skill, Character } from '../types';
import { DiceRoller } from './DiceRoller';
import { Tooltip } from './ui/Tooltip';
import { Spinner } from './ui/Spinner';
import { t } from '../i18n';
import OpponentSheet from './OpponentSheet';

interface ActionPanelProps {
  scene: Scene;
  character: Character;
  onAction: (payload: { description: string; skill: Skill; roll: number; total: number; invokedAspects: string[], targetOpponentId?: string; }) => void;
  isLoading: boolean;
  isActionDisabled: boolean;
  error: string | null;
  onInvokeAspect: (aspectName: string) => void;
  invokedAspects: string[];
  language: 'en' | 'es';
}

function ActionPanel({ scene, character, onAction, isLoading, isActionDisabled, error, onInvokeAspect, invokedAspects, language }: ActionPanelProps) {
  const [description, setDescription] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill>(character.skills.find(s => s.name === "Fight") || character.skills[0]);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResults, setDiceResults] = useState<number[] | null>(null);
  const [targetOpponentId, setTargetOpponentId] = useState<string | undefined>(undefined);

  const invocationBonus = invokedAspects.length * 2;
  const activeOpponents = useMemo(() => scene.opponents?.filter(o => !o.isTakenOut) ?? [], [scene.opponents]);

  const handleRoll = () => {
    setIsRolling(true);
    
    const individualResults = [
        Math.floor(Math.random() * 3) - 1,
        Math.floor(Math.random() * 3) - 1,
        Math.floor(Math.random() * 3) - 1,
        Math.floor(Math.random() * 3) - 1,
    ];
    setDiceResults(individualResults);

    const roll = individualResults.reduce((sum, r) => sum + r, 0);
    const total = roll + selectedSkill.level + invocationBonus;
    
    setTimeout(() => {
        setIsRolling(false);
        setDiceResults(null); // Clean up dice from view
        onAction({ description, skill: selectedSkill, roll, total, invokedAspects, targetOpponentId });
        setDescription('');
        setTargetOpponentId(undefined); // Reset target
    }, 1200); // Allow animation to finish
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description && selectedSkill && !isActionDisabled && !isRolling) {
      handleRoll();
    }
  };

  const isDisabled = isActionDisabled || isRolling;

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 lg:sticky top-4">
      <h2 className="text-2xl font-bold text-white font-serif border-b border-slate-600 pb-2 mb-4">{t('actionAndScene', language)}</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('sceneAspects', language)}</h3>
        <ul className="space-y-2">
          {scene.aspects.map((aspect) => {
             const isInvoked = invokedAspects.includes(aspect.name);
             const isFreeInvoke = !!aspect.hasFreeInvoke;
             const canInvoke = character.fatePoints > 0 || isInvoked || isFreeInvoke;
             return (
                 <li key={aspect.name} className={`p-2 bg-slate-700/50 rounded-md transition-all ${isInvoked ? 'ring-2 ring-cyan-400 shadow-lg' : 'border border-transparent'}`}>
                    <div className="flex justify-between items-center gap-2">
                        <Tooltip text={aspect.description}>
                          <div className="flex items-center">
                            <p className="font-semibold text-slate-200 flex-grow">{aspect.name}</p>
                            {isFreeInvoke && !isInvoked && <span className="ml-2 text-xs font-bold text-yellow-300 bg-yellow-900/50 px-2 py-0.5 rounded-full">(Free)</span>}
                          </div>
                        </Tooltip>
                         <button
                            onClick={() => onInvokeAspect(aspect.name)}
                            disabled={isDisabled || !canInvoke}
                            className={`flex-shrink-0 text-xs font-semibold py-1 px-2 rounded transition-colors ${
                                isInvoked
                                ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                                : (isFreeInvoke ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-slate-600 text-slate-300 hover:bg-slate-500')
                            } disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:hover:bg-slate-800`}
                            aria-label={`Invoke ${aspect.name}`}
                        >
                           {isInvoked ? t('invoked', language) : (isFreeInvoke ? 'Free Invoke' : t('invoke', language))}
                        </button>
                    </div>
                </li>
             )
          })}
        </ul>
      </div>

      {scene.opponents && scene.opponents.length > 0 && (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">{t('opponents', language)}</h3>
            <div className="space-y-2">
                {scene.opponents.map(opp => <OpponentSheet key={opp.id} opponent={opp} language={language} />)}
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {invocationBonus > 0 && (
            <div className="p-2 bg-cyan-900/50 border border-cyan-700 rounded-md text-center">
                <p className="text-cyan-300 font-semibold">
                    {t('invocationBonus', language)}: <span className="font-bold text-white">+{invocationBonus}</span>
                </p>
            </div>
        )}
        {activeOpponents.length > 0 && (
          <div>
              <label htmlFor="target-select" className="block text-sm font-medium text-slate-300 mb-1">
                  {t('target', language)}
              </label>
              <select
                  id="target-select"
                  value={targetOpponentId || ''}
                  onChange={(e) => setTargetOpponentId(e.target.value || undefined)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:cursor-not-allowed"
                  disabled={isDisabled}
              >
                  <option value="">-- {t('selectTarget', language)} --</option>
                  {activeOpponents.map(opp => (
                      <option key={opp.id} value={opp.id}>{opp.name}</option>
                  ))}
              </select>
          </div>
        )}
        <div>
          <label htmlFor="action-description" className="block text-sm font-medium text-slate-300 mb-1">
            {t('whatDoYouDo', language)}
          </label>
          <textarea
            id="action-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:cursor-not-allowed"
            placeholder="e.g., I try to talk my way past the guards..."
            disabled={isDisabled}
            required
          />
        </div>
        <div>
          <label htmlFor="skill-select" className="block text-sm font-medium text-slate-300 mb-1">
            {t('usingWhichSkill', language)}
          </label>
          <select
            id="skill-select"
            value={selectedSkill.name}
            onChange={(e) => {
              const skill = character.skills.find(s => s.name === e.target.value);
              if (skill) setSelectedSkill(skill);
            }}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            {character.skills.map(skill => (
              <option key={skill.name} value={skill.name}>{t(skill.name as any, language)} (+{skill.level})</option>
            ))}
          </select>
        </div>
        
        {(isRolling && diceResults) && (
            <div className="py-8">
                <DiceRoller results={diceResults} />
            </div>
        )}

        <button
          type="submit"
          disabled={!description || isDisabled}
          className="w-full flex items-center justify-center bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="ml-2">{t('aiIsThinking', language)}</span>
            </>
          ) : isRolling ? t('rolling', language) : t('takeAction', language)}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default memo(ActionPanel);