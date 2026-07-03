import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'default',
    size = 'default',
    className = '',
    children,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight disabled:pointer-events-none disabled:opacity-50';

    const variantStyles = {
        default: 'bg-highlight text-foreground hover:bg-highlight/90',
        secondary: 'bg-muted text-muted-foreground hover:bg-muted/80',
        destructive: 'bg-red-500 text-white hover:bg-red-500/90',
        outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
        ghost: 'hover:bg-muted text-foreground',
    };

    const sizeStyles = {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
