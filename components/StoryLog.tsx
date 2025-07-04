import React, { useEffect, useRef, memo } from 'react';
import { StoryLogEntry } from '../types';
import { Spinner } from './ui/Spinner';

interface StoryLogProps {
  entries: StoryLogEntry[];
}

function StoryLog({ entries }: StoryLogProps) {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const getEntryStyle = (type: StoryLogEntry['type']) => {
    switch (type) {
      case 'narration':
        return 'bg-slate-800/60 p-4 rounded-lg font-serif italic text-slate-300 leading-relaxed';
      case 'action':
        return 'text-right text-cyan-400 font-semibold';
      case 'roll':
        return 'text-right text-slate-500 text-sm font-mono';
      case 'error':
        return 'text-center text-red-400 bg-red-900/50 p-3 rounded-md';
      case 'system':
        return 'text-center text-yellow-400/80 italic text-sm p-2 rounded-md bg-yellow-900/20';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 h-[calc(100vh-8rem)] lg:h-auto flex flex-col">
      <h2 className="text-2xl font-bold text-white font-serif border-b border-slate-600 pb-2 mb-4 sticky top-0 bg-slate-800/50 backdrop-blur-sm">Story</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {entries.map((entry) => {
          if (entry.type === 'narration') {
            return (
              <div key={entry.id} className="bg-slate-800/60 rounded-lg overflow-hidden border border-slate-700/50 shadow-lg">
                {(entry.imageUrl || entry.isLoadingImage) && (
                    <div className="aspect-video bg-slate-900 flex items-center justify-center">
                        {entry.isLoadingImage ? (
                            <Spinner />
                        ) : entry.imageUrl ? (
                            <img src={entry.imageUrl} alt="A scene from the story" className="w-full h-full object-cover"/>
                        ) : null}
                    </div>
                )}
                <p className="p-4 font-serif italic text-slate-300 leading-relaxed">{entry.content}</p>
              </div>
            )
          }

          return (
            <div key={entry.id} className={getEntryStyle(entry.type)}>
              <p>{entry.content}</p>
            </div>
          );
        })}
        <div ref={endOfLogRef} />
      </div>
    </div>
  );
};

export default memo(StoryLog);