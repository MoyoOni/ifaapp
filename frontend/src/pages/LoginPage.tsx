import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/features/auth/login/login-form';
import { useAuth } from '@/shared/hooks/use-auth';
import { getDashboardPathForRole } from '@/shared/config/navigation';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();

    // Track if we've redirected to prevent multiple redirects
    const hasRedirected = React.useRef(false);

    // Redirect if already logged in (single redirect, avoids flicker)
    React.useEffect(() => {
        if (user && !isLoading && !hasRedirected.current) {
            hasRedirected.current = true;
            
            // Check if user needs to complete onboarding first
            if (!user.hasOnboarded) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate(getDashboardPathForRole(user.role), { replace: true });
            }
        }
    }, [user, isLoading, navigate]);

    // Reset redirect flag when component unmounts
    React.useEffect(() => {
        return () => {
            hasRedirected.current = false;
        };
    }, []);

    const handleSuccess = () => {}; // Navigation handled by effect above

    // Don't render form when user is set to avoid flash before redirect
    if (user && !isLoading) {
        return null;
    }

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => navigate('/signup')}
                onSwitchToQuickAccess={() => navigate('/quick-access')}
            />
        </div>
    );
};

export default LoginPage;