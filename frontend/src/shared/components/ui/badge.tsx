import React from 'react';

interface BadgeProps {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    className = '',
    children
}) => {
    const variantStyles = {
        default: 'bg-highlight text-foreground',
        secondary: 'bg-muted text-muted-foreground',
        destructive: 'bg-red-500 text-white',
        outline: 'border border-border text-foreground',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
        >
            {children}
        </span>
    );
};

export default Badge;
