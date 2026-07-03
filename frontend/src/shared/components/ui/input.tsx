import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ className = '', leftIcon, ...props }) => {
    return (
        <div className="relative">
            {leftIcon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">{leftIcon}</div>}
            <input
                className={`flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${leftIcon ? 'pl-10' : ''} ${className}`}
                {...props}
            />
        </div>
    );
};

export default Input;