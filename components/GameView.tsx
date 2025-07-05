
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, PlayerActionPayload, GeminiNarrativeResponse, Compel, StoryLogEntry, Consequence, HitAbsorption, TakenOutResolution, ConcedeResolution, AppSettings, Aspect } from '../types';
import CharacterSheet from './CharacterSheet';
import StoryLog from './StoryLog';
import ActionPanel from './ActionPanel';
import CompelModal from './CompelModal';
import AbsorbHitModal from './AbsorbHitModal';
import { processPlayerAction, generateImage, processPlayerTakenOut, processPlayerConcession, RateLimitError } from '../services/geminiService';
import { Spinner } from './ui/Spinner';
import { SettingsIcon } from './icons/SettingsIcon';
import { t } from '../i18n';
import { CharacterIcon } from './icons/CharacterIcon';
import { ActionIcon } from './icons/ActionIcon';
import * as analytics from '../services/analyticsService';

interface GameViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onSaveGame: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
}

const processNarrativeUpdate = (
    currentState: GameState,
    result: GeminiNarrativeResponse,
    invokedAspects: string[],
    language: 'en' | 'es',
    narrationLogId: number,
    shouldTryToLoadImage: boolean
): GameState => {
    let newCharacter = { ...currentState.character };
    let newScene: GameState['scene'];
    const logEntriesToAdd: StoryLogEntry[] = [];

    if (result.newScene) {
        newScene = { ...result.newScene, imageUrl: undefined, hasOfferedCompel: false };
        // Character state reset on new scene
        newCharacter = {
            ...newCharacter,
            physicalStress: { ...newCharacter.physicalStress, marked: newCharacter.physicalStress.marked.map(() => false) },
            mentalStress: { ...newCharacter.mentalStress, marked: newCharacter.mentalStress.marked.map(() => false) },
            consequences: [],
        };
        logEntriesToAdd.push({
            id: narrationLogId + 1,
            type: 'system',
            content: t('sceneChanged', language)
        });
    } else {
        // No new scene, so we're modifying the old one.
        newScene = { ...currentState.scene, hasOfferedCompel: currentState.scene.hasOfferedCompel || !!result.compel };
        if (result.newSceneAspect) {
            const advantage: Aspect = { ...result.newSceneAspect, hasFreeInvoke: true };
            newScene.aspects = [...newScene.aspects, advantage];
        }
        if (result.updatedOpponents) {
            newScene.opponents = result.updatedOpponents;
        }
    }

    if (result.removedSceneAspects?.length) {
        newScene.aspects = newScene.aspects.filter(a => !result.removedSceneAspects!.includes(a.name));
    }

    if (invokedAspects.length > 0) {
        newScene.aspects = newScene.aspects.map(aspect =>
            (invokedAspects.includes(aspect.name) && aspect.hasFreeInvoke)
                ? { ...aspect, hasFreeInvoke: false }
                : aspect
        );
    }

    if (result.usedFreeInvokes?.length) {
        newCharacter.consequences = newCharacter.consequences.map(consequence =>
            (result.usedFreeInvokes!.includes(consequence.aspect.name) && consequence.aspect.hasFreeInvoke)
                ? { ...consequence, aspect: { ...consequence.aspect, hasFreeInvoke: false } }
                : consequence
        );
    }

    const newLogEntry: StoryLogEntry = {
        id: narrationLogId,
        type: 'narration',
        content: result.narration,
        isLoadingImage: shouldTryToLoadImage,
    };
    logEntriesToAdd.unshift(newLogEntry);

    return {
        ...currentState,
        character: newCharacter,
        scene: newScene,
        storyLog: [...currentState.storyLog, ...logEntriesToAdd],
    };
};

const processSceneTransition = (
    currentState: GameState,
    result: GeminiNarrativeResponse,
    logMessage: string,
    fatePointChange: number,
    narrationLogId: number,
    shouldTryToLoadImage: boolean
): GameState => {
    const newCharacterState = {
        ...currentState.character,
        fatePoints: currentState.character.fatePoints + fatePointChange,
        physicalStress: {
            ...currentState.character.physicalStress,
            marked: currentState.character.physicalStress.marked.map(() => false)
        },
        mentalStress: {
            ...currentState.character.mentalStress,
            marked: currentState.character.mentalStress.marked.map(() => false)
        },
        consequences: [] // Clear consequences on conflict end
    };
    
    const newLogEntry: StoryLogEntry = {
      id: narrationLogId,
      type: 'narration',
      content: result.narration,
      isLoadingImage: shouldTryToLoadImage,
    };

    const newSceneWithFlag = result.newScene ? { ...result.newScene, hasOfferedCompel: false } : currentState.scene;

    return {
        ...currentState,
        character: newCharacterState,
        scene: newSceneWithFlag,
        storyLog: [...currentState.storyLog, { id: narrationLogId - 1, type: 'system', content: logMessage}, newLogEntry]
    };
};


function GameView({ gameState, setGameState, onSaveGame, onOpenSettings, settings }: GameViewProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCompel, setActiveCompel] = useState<Compel | null>(null);
  const [activeHit, setActiveHit] = useState<{ shifts: number; attackDescription: string; type: 'physical' | 'mental'; } | null>(null);
  const [invokedAspects, setInvokedAspects] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);

  const { language, difficulty } = settings;

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1024) { // lg breakpoint
            setIsCharacterSheetOpen(false);
            setIsActionPanelOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isPanelOpen = isCharacterSheetOpen || isActionPanelOpen;
    if (isPanelOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [isCharacterSheetOpen, isActionPanelOpen]);

  const handleInvokeAspect = useCallback((aspectName: string) => {
    if (isLoading || !!activeCompel || !!activeHit) return;

    const aspectInScene = gameState.scene.aspects.find(a => a.name === aspectName);
    const isFree = !!aspectInScene?.hasFreeInvoke;
    const isAlreadyInvoked = invokedAspects.includes(aspectName);

    if (isAlreadyInvoked) {
        // Un-invoking
        setInvokedAspects(p => p.filter(n => n !== aspectName));
        // Give back FP ONLY if it was a paid invoke. A free invoke never touched FP, so no change needed.
        if (!isFree) {
            setGameState(g => g ? ({ ...g, character: {...g.character, fatePoints: g.character.fatePoints + 1 }}) : null);
        }
    } else {
        // Invoking
        if (isFree) {
            setInvokedAspects(p => [...p, aspectName]);
            // No FP change for a free invoke
        } else {
            // Paid invoke
            if (gameState.character.fatePoints > 0) {
                setInvokedAspects(p => [...p, aspectName]);
                setGameState(g => g ? ({ ...g, character: {...g.character, fatePoints: g.character.fatePoints - 1 }}) : null);
            }
        }
    }
  }, [invokedAspects, gameState, setGameState, isLoading, activeCompel, activeHit]);


  const handleCompelResolution = useCallback((accepted: boolean) => {
    if (!activeCompel) return;

    analytics.trackEvent(accepted ? 'accept_compel' : 'reject_compel', {
        aspect: activeCompel.aspect
    });

    const fatePointChange = accepted ? 1 : -1;
    const narration = accepted ? activeCompel.acceptNarration : activeCompel.rejectNarration;
    const logMessage = accepted 
      ? `You accepted the compel on "${activeCompel.aspect}" and gained 1 Fate Point.` 
      : `You rejected the compel on "${activeCompel.aspect}" and spent 1 Fate Point.`;

    setGameState(prev => {
        if (!prev) return null;
        return {
            ...prev,
            character: {
                ...prev.character,
                fatePoints: prev.character.fatePoints + fatePointChange,
            },
            storyLog: [
                ...prev.storyLog,
                { id: Date.now(), type: 'system', content: logMessage },
                { id: Date.now() + 1, type: 'narration', content: narration },
            ]
        }
    });

    setActiveCompel(null);
  }, [activeCompel, setGameState]);

  const handleAbsorbHit = useCallback(async (resolution: HitAbsorption | TakenOutResolution | ConcedeResolution) => {
      setActiveHit(null);

      const handleSceneTransition = async (
        apiCall: (gs: GameState, h: typeof activeHit, lang: 'en' | 'es') => Promise<GeminiNarrativeResponse>,
        logMessage: string,
        fatePointChange: number = 0
      ) => {
        if (!activeHit) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await apiCall(gameState, activeHit, language);
            
            const narrationLogId = Date.now();
            const shouldTryToLoadImage = !!result.imagePrompt;

            setGameState(prev => {
                if (!prev) return null;
                return processSceneTransition(prev, result, logMessage, fatePointChange, narrationLogId, shouldTryToLoadImage);
            });

            if (shouldTryToLoadImage) {
                try {
                    const imageUrl = await generateImage(result.imagePrompt!);
                    setGameState(prev => {
                        if(!prev) return null;
                        return {
                            ...prev,
                            scene: imageUrl ? { ...prev.scene, imageUrl } : prev.scene,
                            storyLog: prev.storyLog.map(entry => entry.id === narrationLogId ? { ...entry, imageUrl, isLoadingImage: false } : entry)
                        };
                    });
                } catch (imageError: any) {
                     let systemMessage: string | null = null;
                     if (imageError instanceof RateLimitError) {
                        systemMessage = imageError.message;
                        console.warn(systemMessage);
                     } else {
                        console.error("Failed to generate image after scene transition:", imageError);
                     }

                     setGameState(prev => {
                         if (!prev) return null;
                         const updatedLog = prev.storyLog.map(entry =>
                            entry.id === narrationLogId ? { ...entry, isLoadingImage: false } : entry
                         );
                         if (systemMessage) {
                             updatedLog.push({ id: Date.now(), type: 'system', content: systemMessage });
                         }
                         return { ...prev, storyLog: updatedLog };
                     });
                }
            }

        } catch (e: any) {
            console.error(e);
            const errorMessage = e.message || 'The AI encountered an error while processing the outcome. This is awkward.';
            setError(errorMessage);
            setGameState(prev => prev ? { ...prev, storyLog: [...prev.storyLog, { id: Date.now(), type: 'error', content: errorMessage }] } : null);
        } finally {
            setIsLoading(false);
        }
      }

      if ('takenOut' in resolution) {
        analytics.trackEvent('player_taken_out', { 'stress_type': activeHit?.type });
        await handleSceneTransition(processPlayerTakenOut, `You have been Taken Out! All stress and consequences have been cleared.`);
        return;
      }
      
      if ('concede' in resolution) {
        analytics.trackEvent('concede_conflict', { 'stress_type': activeHit?.type });
        await handleSceneTransition(processPlayerConcession, `You concede the conflict, clearing all stress and consequences and gaining 1 Fate Point.`, 1);
        return;
      }

      const { stressType, markedStressIndices, newConsequence } = resolution;
      
      if (newConsequence) {
          analytics.trackEvent('take_consequence', {
              severity: newConsequence.severity,
              stress_type: stressType
          });
      }

      setGameState(prev => {
          if (!prev) return null;
          
          const newLogEntries: StoryLogEntry[] = [];
          
          const stressTrackToUpdate = stressType === 'physical' ? prev.character.physicalStress : prev.character.mentalStress;
          const updatedStressTrack = { 
              ...stressTrackToUpdate,
              marked: [...stressTrackToUpdate.marked],
           };
          
          markedStressIndices.forEach(index => {
              updatedStressTrack.marked[index] = true;
          });

          const newCharacter = { ...prev.character };
          if (stressType === 'physical') {
              newCharacter.physicalStress = updatedStressTrack;
          } else {
              newCharacter.mentalStress = updatedStressTrack;
          }

          if (markedStressIndices.length > 0) {
              const stressBoxes = markedStressIndices.map(i => updatedStressTrack.boxes[i]);
              newLogEntries.push({id: Date.now(), type: 'system', content: `You took ${stressBoxes.length} ${stressType} stress (boxes ${stressBoxes.join(', ')}).`});
          }
          
          if (newConsequence) {
              newCharacter.consequences = [...newCharacter.consequences, newConsequence];
              newLogEntries.push({id: Date.now() + 1, type: 'system', content: `You've gained a ${newConsequence.severity} consequence: "${newConsequence.aspect.name}".`});
          }
          
          return {
              ...prev,
              character: newCharacter,
              storyLog: [...prev.storyLog, ...newLogEntries],
          };
      });

  }, [setGameState, gameState, activeHit, language]);

  const handlePlayerAction = useCallback(async (payload: Omit<PlayerActionPayload, 'gameState'>) => {
    if (isActionPanelOpen) {
        setIsActionPanelOpen(false);
    }
    setIsLoading(true);
    setError(null);

    analytics.trackEvent('player_action', {
        skill: payload.skill.name,
        has_invokes: payload.invokedAspects && payload.invokedAspects.length > 0,
        has_target: !!payload.targetOpponentId
    });

    const fullPayload: PlayerActionPayload = { ...payload, gameState };

    const invocationBonus = (payload.invokedAspects?.length || 0) * 2;
    const rollLogContent = `Roll: ${payload.roll > 0 ? '+' : ''}${payload.roll} + Skill: ${payload.skill.level} ${invocationBonus > 0 ? `+ Invokes: ${invocationBonus}` : ''} = Total: ${payload.total}`;

    const actionLogId = Date.now();
    const rollLogId = actionLogId + 1;

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        storyLog: [
          ...prev.storyLog,
          { id: actionLogId, type: 'action', content: `"${payload.description}" using ${payload.skill.name}.` },
          { id: rollLogId, type: 'roll', content: rollLogContent }
        ]
      };
    });

    try {
      const result: GeminiNarrativeResponse = await processPlayerAction(fullPayload, language, difficulty);
      
      const narrationLogId = Date.now() + 2;
      const shouldTryToLoadImage = !!result.imagePrompt;
      
      setGameState(prev => {
        if (!prev) return null;
        return processNarrativeUpdate(prev, result, invokedAspects, language, narrationLogId, shouldTryToLoadImage);
      });

      // If there's an image prompt, generate it asynchronously
      if (shouldTryToLoadImage) {
        try {
          const imageUrl = await generateImage(result.imagePrompt!);
          setGameState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              scene: imageUrl ? { ...prev.scene, imageUrl } : prev.scene,
              storyLog: prev.storyLog.map(entry =>
                entry.id === narrationLogId
                  ? { ...entry, imageUrl, isLoadingImage: false }
                  : entry
              ),
            };
          });
        } catch (imageError: any) {
            let systemMessage: string | null = null;
            if (imageError instanceof RateLimitError) {
                systemMessage = imageError.message;
                console.warn(systemMessage);
            } else {
                console.error("Failed to generate action image:", imageError);
            }

            setGameState(prev => {
                if (!prev) return null;

                const updatedLog = prev.storyLog.map(entry =>
                    entry.id === narrationLogId ? { ...entry, isLoadingImage: false } : entry
                );
                
                if (systemMessage) {
                    updatedLog.push({ id: Date.now(), type: 'system', content: systemMessage });
                }

                return { ...prev, storyLog: updatedLog };
            });
        }
      }

      setIsLoading(false);

      if (result.hit) {
        // Validate the hit object before setting it.
        // If critical properties are missing or invalid, default them to prevent crashes.
        const validatedHit = {
          shifts: (typeof result.hit.shifts === 'number' && result.hit.shifts > 0) ? result.hit.shifts : 1,
          attackDescription: result.hit.attackDescription || "An unexpected blow lands!",
          type: (result.hit.type === 'physical' || result.hit.type === 'mental') ? result.hit.type : 'physical'
        };

        if (validatedHit.shifts !== result.hit.shifts || !result.hit.attackDescription || !result.hit.type) {
           console.warn("Received invalid 'hit' object from AI. Using validated object.", { original: result.hit, validated: validatedHit });
        }
        
        setActiveHit(validatedHit);
      }

      if (result.compel) {
        setActiveCompel(result.compel);
      }

    } catch (e: any) {
      analytics.trackEvent('error', { 'event_category': 'player_action', 'error_message': e.message });
      console.error(e);
      const errorMessage = e.message || 'The AI encountered an error. Please try a different action.';
      setError(errorMessage);
       setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                storyLog: [...prev.storyLog, { id: Date.now(), type: 'error', content: errorMessage }]
            };
        });
      setIsLoading(false);
    } finally {
      setInvokedAspects([]);
    }
  }, [gameState, setGameState, language, difficulty, invokedAspects, isActionPanelOpen]);

  const handleSaveClick = () => {
    onSaveGame();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const isActionDisabled = isLoading || !!activeCompel || !!activeHit;
  
  if (!gameState) {
     return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Spinner />
            <p className="mt-4 text-lg text-slate-400">{t('loadingGame', language)}</p>
        </div>
    );
  }

  return (
    <>
      {/* Backdrop for mobile slide-in panels */}
      {(isCharacterSheetOpen || isActionPanelOpen) && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 lg:hidden"
            onClick={() => {
                setIsCharacterSheetOpen(false);
                setIsActionPanelOpen(false);
            }}
            aria-hidden="true"
        />
      )}
      <div className="w-full max-w-[100rem] mx-auto p-4 lg:p-6">
        <header className="flex justify-between items-center gap-4 mb-4">
            {/* Left button for mobile */}
            <div className="lg:hidden">
                <button
                    onClick={() => setIsCharacterSheetOpen(true)}
                    className="p-2 text-slate-300 bg-slate-800/50 rounded-md hover:text-cyan-400 transition-colors"
                    aria-label={t('openCharacterSheet', language)}
                >
                    <CharacterIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Center/Right aligned buttons */}
            <div className="flex-grow flex justify-end items-center gap-2 sm:gap-4">
                 <button
                    onClick={onOpenSettings}
                    className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                    aria-label={t('settings', language)}
                 >
                    <SettingsIcon className="w-6 h-6"/>
                </button>
                <button 
                    onClick={handleSaveClick}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    {saveStatus === 'saved' ? t('saved', language) : t('saveGame', language)}
                </button>
            </div>

            {/* Right button for mobile */}
            <div className="lg:hidden">
                 <button
                    onClick={() => setIsActionPanelOpen(true)}
                    className="p-2 text-slate-300 bg-slate-800/50 rounded-md hover:text-cyan-400 transition-colors"
                    aria-label={t('openActionPanel', language)}
                 >
                    <ActionIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Story Log - always visible on mobile */}
          <div className="lg:col-span-6 lg:order-2">
            <StoryLog entries={gameState.storyLog} />
          </div>

          {/* Action Panel Container */}
          <div className={`
              fixed top-0 right-0 h-full w-full max-w-sm bg-slate-900 z-20 shadow-2xl 
              transform transition-transform duration-300 ease-in-out
              overflow-y-auto
              ${isActionPanelOpen ? 'translate-x-0' : 'translate-x-full'}
              lg:static lg:h-auto lg:max-w-none lg:bg-transparent lg:z-auto lg:shadow-none
              lg:transform-none lg:col-span-3 lg:order-3
          `}>
             <ActionPanel
                scene={gameState.scene}
                character={gameState.character}
                onAction={handlePlayerAction}
                isLoading={isLoading}
                isActionDisabled={isActionDisabled}
                error={error}
                onInvokeAspect={handleInvokeAspect}
                invokedAspects={invokedAspects}
                language={language}
              />
          </div>

          {/* Character Sheet Container */}
          <div className={`
              fixed top-0 left-0 h-full w-full max-w-sm bg-slate-900 z-20 shadow-2xl
              transform transition-transform duration-300 ease-in-out
              overflow-y-auto
              ${isCharacterSheetOpen ? 'translate-x-0' : '-translate-x-full'}
              lg:static lg:h-auto lg:max-w-none lg:bg-transparent lg:z-auto lg:shadow-none
              lg:transform-none lg:col-span-3 lg:order-1
          `}>
            <CharacterSheet 
              character={gameState.character}
              onInvokeAspect={handleInvokeAspect}
              invokedAspects={invokedAspects}
              isActionDisabled={isActionDisabled}
              language={language}
            />
          </div>
        </div>
      </div>
      {activeCompel && (
        <CompelModal
          compel={activeCompel}
          onResolve={handleCompelResolution}
          canReject={gameState.character.fatePoints > 0}
          language={language}
        />
      )}
      {activeHit && gameState && (
        <AbsorbHitModal
          hit={activeHit}
          character={gameState.character}
          onResolve={handleAbsorbHit}
          language={language}
        />
      )}
    </>
  );
};

export default GameView;
