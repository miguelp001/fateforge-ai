import React, { useMemo } from 'react';
import { Skill } from '../types';
import { SKILL_LADDER, PYRAMID_SLOTS, SKILL_LEVELS } from '../constants';
import { t } from '../i18n';

interface SkillPyramidEditorProps {
  skills: Skill[];
  onChange: (newSkills: Skill[]) => void;
  language: 'en' | 'es';
}

function SkillPyramidEditor({ skills, onChange, language }: SkillPyramidEditorProps) {

  const skillCounts = useMemo(() => {
    const counts: { [key: number]: number } = { 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    skills.forEach(skill => {
        counts[skill.level]++;
    });
    return counts;
  }, [skills]);

  const handleSkillChange = (skillName: string, newLevel: number) => {
    const oldLevel = skills.find(s => s.name === skillName)?.level ?? 0;
    
    // Allow decreasing a skill's level freely
    // Or if moving to a level that is not yet full
    if (newLevel < oldLevel || skillCounts[newLevel] < PYRAMID_SLOTS[newLevel]) {
      const newSkills = skills.map(s => 
        s.name === skillName ? { ...s, level: newLevel, levelName: SKILL_LADDER[newLevel] } : s
      );
      onChange(newSkills);
    }
  };

  const sortedSkills = useMemo(() => [...skills].sort((a,b) => a.name.localeCompare(b.name)), [skills]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-slate-900/50 rounded-lg">
        {SKILL_LEVELS.filter(l => l > 0).map(level => {
            const count = skillCounts[level];
            const max = PYRAMID_SLOTS[level];
            const isFull = count >= max;
            const levelName = SKILL_LADDER[level];
            return (
                <div key={level} className="text-sm">
                    <span className="font-semibold text-slate-300">{t(levelName as any, language)} (+{level}): </span>
                    <span className={`font-mono font-bold ${isFull ? 'text-cyan-400' : 'text-slate-400'}`}>{count} / {max}</span>
                </div>
            )
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
        {sortedSkills.map(skill => {
            return (
                <div key={skill.name} className="flex items-center justify-between bg-slate-700/50 p-2 rounded-md">
                    <label htmlFor={`skill-${skill.name}`} className="text-slate-300 font-medium">{t(skill.name as any, language)}</label>
                    <select
                        id={`skill-${skill.name}`}
                        value={skill.level}
                        onChange={(e) => handleSkillChange(skill.name, parseInt(e.target.value))}
                        className="bg-slate-900 border border-slate-600 rounded-md p-1.5 text-slate-200 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        {SKILL_LEVELS.map(level => {
                            const isSlotAvailable = skillCounts[level] < PYRAMID_SLOTS[level];
                            const isCurrentLevel = level === skill.level;
                            const levelName = SKILL_LADDER[level];
                            return (
                                <option key={level} value={level} disabled={!isCurrentLevel && !isSlotAvailable}>
                                    +{level} ({t(levelName as any, language)})
                                </option>
                            );
                        })}
                    </select>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default SkillPyramidEditor;