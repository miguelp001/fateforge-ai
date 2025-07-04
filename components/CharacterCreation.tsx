import React, { useState, useMemo } from 'react';
import { CharacterCreationOptions, Character, Aspect, Stunt, Skill } from '../types';
import { DEFAULT_SKILLS, SKILL_LADDER } from '../constants';
import SkillPyramidEditor from './SkillPyramidEditor';
import { generateFullCharacter } from '../services/geminiService';
import { SparkleIcon } from './icons/SparkleIcon';
import { Spinner } from './ui/Spinner';
import { t } from '../i18n';
import { Section } from './ui/Section';

interface CharacterCreationProps {
  options: CharacterCreationOptions;
  genre: string;
  onCharacterCreate: (character: Character) => void;
  onBack: () => void;
  language: 'en' | 'es';
}

function CharacterCreation({ options, genre, onCharacterCreate, onBack, language }: CharacterCreationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [name, setName] = useState('');
  const [highConcept, setHighConcept] = useState<Aspect | null>(null);
  const [trouble, setTrouble] = useState<Aspect | null>(null);
  const [otherAspects, setOtherAspects] = useState<Aspect[]>([]);
  const [stunts, setStunts] = useState<Stunt[]>([]);
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);

  // State to hold all available options, including dynamically added ones
  const [allHighConcepts, setAllHighConcepts] = useState<Aspect[]>(options.aspects.highConcepts);
  const [allTroubles, setAllTroubles] = useState<Aspect[]>(options.aspects.troubles);
  const [allOtherAspects, setAllOtherAspects] = useState<Aspect[]>(options.aspects.others);
  const [allStunts, setAllStunts] = useState<Stunt[]>(options.stunts);

  const isFormValid = useMemo(() => {
    const skillPoints = skills.reduce((acc, s) => acc + s.level, 0);
    const pyramidPoints = 4 * 1 + 3 * 2 + 2 * 3 + 1 * 4;
    return (
      name.trim() !== '' &&
      highConcept !== null &&
      trouble !== null &&
      otherAspects.length === 3 &&
      stunts.length === 2 &&
      skillPoints === pyramidPoints
    );
  }, [name, highConcept, trouble, otherAspects, stunts, skills]);

  const handleSelectOtherAspect = (aspect: Aspect) => {
    setOtherAspects(prev => {
      if (prev.some(a => a.name === aspect.name)) {
        return prev.filter(a => a.name !== aspect.name);
      }
      if (prev.length < 3) {
        return [...prev, aspect];
      }
      return prev;
    });
  };

  const handleSelectStunt = (stunt: Stunt) => {
    setStunts(prev => {
      if (prev.some(s => s.name === stunt.name)) {
        return prev.filter(s => s.name !== stunt.name);
      }
      if (prev.length < 2) {
        return [...prev, stunt];
      }
      return prev;
    });
  };
  
  const handleGenerateCharacter = async () => {
    setIsGenerating(true);
    try {
      const char = await generateFullCharacter(genre, language);

      // Add generated options to lists if they don't exist
      if (!allHighConcepts.some(a => a.name === char.aspects.highConcept.name)) {
        setAllHighConcepts(prev => [char.aspects.highConcept, ...prev]);
      }
      if (!allTroubles.some(a => a.name === char.aspects.trouble.name)) {
        setAllTroubles(prev => [char.aspects.trouble, ...prev]);
      }
      const newOtherAspects = char.aspects.others.filter(oa => !allOtherAspects.some(a => a.name === oa.name));
      if (newOtherAspects.length > 0) {
        setAllOtherAspects(prev => [...newOtherAspects, ...prev]);
      }
      const newStunts = char.stunts.filter(s => !allStunts.some(as => as.name === s.name));
      if (newStunts.length > 0) {
        setAllStunts(prev => [...newStunts, ...prev]);
      }

      // Populate state
      setName(char.name);
      setHighConcept(char.aspects.highConcept);
      setTrouble(char.aspects.trouble);
      setOtherAspects(char.aspects.others);
      setStunts(char.stunts);
      
      const newSkills = [...DEFAULT_SKILLS].map(skill => ({...skill, level: 0, levelName: 'Mediocre'}));
      char.skills.forEach(genSkill => {
        const skillIndex = newSkills.findIndex(s => s.name === genSkill.name);
        if(skillIndex !== -1) {
            newSkills[skillIndex].level = genSkill.level;
            newSkills[skillIndex].levelName = SKILL_LADDER[genSkill.level];
        }
      });
      setSkills(newSkills);

    } catch (e: any) {
      console.error("Failed to generate character:", e);
      const defaultMessage = "Sorry, the AI had trouble generating a character. Please try again or create one manually.";
      alert(e.message || defaultMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !highConcept || !trouble) return;

    const finalCharacter: Character = {
      name: name.trim(),
      aspects: {
        highConcept: highConcept,
        trouble: trouble,
        others: otherAspects,
      },
      skills: skills,
      stunts,
      fatePoints: 3,
      physicalStress: { boxes: [1, 2], marked: [false, false] },
      mentalStress: { boxes: [1, 2], marked: [false, false] },
      consequences: [],
    };
    onCharacterCreate(finalCharacter);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-serif">{t('createYourHero', language)}</h1>
            <p className="text-slate-400 text-lg">{t('forA', language)} <span className="text-cyan-400 font-semibold">{genre}</span> {t('adventure', language)}</p>
        </div>
        
        <div className="mb-6 text-center border-b border-slate-700 pb-6">
            <button
                type="button"
                onClick={handleGenerateCharacter}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <Spinner size="sm"/>
                        <span>{t('generating', language)}</span>
                    </>
                ) : (
                    <>
                        <SparkleIcon className="w-5 h-5" />
                        <span>{t('generateCharacter', language)}</span>
                    </>
                )}
            </button>
            <p className="text-xs text-slate-500 mt-2">{t('letTheAIBuild', language)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <Section title={t('name', language)} subtitle={t('whatIsYourName', language)}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jax 'Glitch' Riley"
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                />
            </Section>
            
            <Section title={t('aspects', language)} subtitle={t('chooseAspects', language)}>
                <div className="space-y-4">
                    <select value={highConcept?.name || ''} onChange={(e) => setHighConcept(allHighConcepts.find(a => a.name === e.target.value) || null)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3" required>
                        <option value="" disabled>{t('chooseHighConcept', language)}</option>
                        {allHighConcepts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>
                    <p className="text-sm text-slate-400 italic px-3">{highConcept?.description}</p>
                    
                    <select value={trouble?.name || ''} onChange={(e) => setTrouble(allTroubles.find(a => a.name === e.target.value) || null)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-3" required>
                         <option value="" disabled>{t('chooseTrouble', language)}</option>
                        {allTroubles.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                    </select>
                    <p className="text-sm text-slate-400 italic px-3">{trouble?.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {allOtherAspects.map(a => (
                            <label key={a.name} className={`flex items-start p-3 rounded-md cursor-pointer transition-all ${otherAspects.some(oa => oa.name === a.name) ? 'bg-cyan-600/30 ring-2 ring-cyan-500' : 'bg-slate-700/50'}`}>
                                <input type="checkbox" checked={otherAspects.some(oa => oa.name === a.name)} onChange={() => handleSelectOtherAspect(a)} className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                                <div>
                                    <span className="font-semibold text-slate-200">{a.name}</span>
                                    <p className="text-xs text-slate-400">{a.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </Section>

            <Section title={t('skills', language)} subtitle={t('skillPyramid', language)}>
                <SkillPyramidEditor skills={skills} onChange={setSkills} language={language} />
            </Section>

            <Section title={t('stunts', language)} subtitle={t('chooseStunts', language)}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allStunts.map(s => (
                        <label key={s.name} className={`flex items-start p-3 rounded-md cursor-pointer transition-all ${stunts.some(st => st.name === s.name) ? 'bg-cyan-600/30 ring-2 ring-cyan-500' : 'bg-slate-700/50'}`}>
                            <input type="checkbox" checked={stunts.some(st => st.name === s.name)} onChange={() => handleSelectStunt(s)} className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                            <div>
                                <span className="font-semibold text-slate-200">{s.name}</span>
                                <p className="text-xs text-slate-400 italic">{s.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </Section>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <button type="button" onClick={onBack} className="w-full sm:w-auto bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors">
                    {t('back', language)}
                </button>
                <button type="submit" disabled={!isFormValid} className="w-full sm:w-auto flex-grow bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {t('startAdventure', language)}
                </button>
            </div>
            {!isFormValid && <p className="text-center text-yellow-400 text-sm">{t('completeCharacterPrompt', language)}</p>}
        </form>
      </div>
    </div>
  );
};

export default CharacterCreation;