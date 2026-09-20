import React from 'react';
import { Link } from 'react-router-dom';

/** Shown in place of the profile block for logged-out visitors. */
export const VisitorAuthCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    if (compact) {
        return (
            <Link
                to="/login"
                title="Sign in"
                className="w-full p-2 rounded-lg hover:bg-secondary/10 transition-colors flex items-center justify-center text-xs font-bold text-highlight"
            >
                Sign in
            </Link>
        );
    }
    return (
        <div className="space-y-2" data-testid="visitor-auth-card">
            <p className="text-xs text-muted-foreground">Join the community to save your progress and connect.</p>
            <Link
                to="/signup"
                className="block w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-center text-sm font-bold hover:bg-primary/90 transition-colors"
            >
                Get Started
            </Link>
            <Link
                to="/login"
                className="block w-full py-2.5 rounded-xl bg-muted/60 text-foreground text-center text-sm font-bold hover:bg-muted transition-colors"
            >
                Sign In
            </Link>
        </div>
    );
};
