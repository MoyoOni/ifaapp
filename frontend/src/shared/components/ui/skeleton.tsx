import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div
            className={`animate-pulse bg-stone-200 rounded-lg ${className}`}
            aria-hidden="true"
        />
    );
};

export default Skeleton;
