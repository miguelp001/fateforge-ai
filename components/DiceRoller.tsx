import React, { useState, useEffect } from 'react';

function numberToSymbol(n: number): string {
  if (n > 0) return '+';
  if (n < 0) return '-';
  return ' ';
};

function getSymbolColor(s: string) {
  if (s === '+') return 'text-green-400';
  if (s === '-') return 'text-red-400';
  return 'text-slate-500';
};

function FateDie({ result }: { result: number }) {
    const symbols = ['+', '-', ' '];
    const [symbol, setSymbol] = useState(symbols[Math.floor(Math.random() * 3)]);
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setSymbol(symbols[Math.floor(Math.random() * 3)]);
        }, 50);

        const stopTime = 700 + Math.random() * 300; 
        setTimeout(() => {
            clearInterval(interval);
            setIsAnimating(false);
            setSymbol(numberToSymbol(result));
        }, stopTime); 

        return () => clearInterval(interval);
    }, [result]);

    return (
        <div className={`w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg transition-transform duration-300 ${isAnimating ? 'animate-spin' : ''}`}>
            <span className={getSymbolColor(symbol)}>{symbol}</span>
        </div>
    );
};


export function DiceRoller({ results }: { results: number[] }) {
    return (
        <div className="flex flex-col items-center justify-center">
             <p className="text-slate-400 mb-4 font-semibold">Rolling 4dF...</p>
             <div className="flex space-x-4">
                {results.map((res, index) => <FateDie key={index} result={res} />)}
            </div>
        </div>
    );
};