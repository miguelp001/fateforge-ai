import React from 'react';

interface SectionProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function Section({title, subtitle, children}: SectionProps) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
      <h3 className="text-xl font-bold text-cyan-400 font-serif">{title}</h3>
      <p className="text-slate-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}