import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export function Tooltip({ children, text }: TooltipProps) {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs
        invisible group-hover:visible 
        bg-slate-900 text-white text-xs rounded-md py-1 px-2 
        border border-slate-600 shadow-lg 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        {text}
        <svg className="absolute text-slate-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div>
  );
};