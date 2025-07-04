import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-24 h-24 border-8',
    };

    return (
        <div 
            className={`
                ${sizeClasses[size]}
                border-cyan-400
                border-b-transparent
                rounded-full
                inline-block
                animate-spin
            `}
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};