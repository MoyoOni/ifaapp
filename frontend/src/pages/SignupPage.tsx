import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/features/auth/register/register-form';
import RoleSelectionView from '@/features/auth/role-selection/role-selection-view';
import { useAuth } from '@/shared/hooks/use-auth';
import { getDashboardPathForRole } from '@/shared/config/navigation';
import { UserRole } from '@common';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate(getDashboardPathForRole(user.role), { replace: true });
        }
    }, [user, navigate]);

    if (selectedRole) {
        return (
            <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
                <RegisterForm
                    selectedRole={selectedRole}
                    onSuccess={() => {
                        // If visitor came from a babalawo landing page, preserve redirect
                        // so onboarding can forward them to the right booking page after completion
                        const postAuth = sessionStorage.getItem('postAuthRedirect');
                        if (postAuth) {
                            sessionStorage.removeItem('postAuthRedirect');
                            sessionStorage.setItem('postOnboardingRedirect', postAuth);
                        }
                        navigate('/onboarding');
                    }}
                    onSwitchToLogin={() => navigate('/login')}
                    onBack={() => setSelectedRole(null)}
                />
            </div>
        );
    }

    return (
        <RoleSelectionView
            onSelectRole={setSelectedRole}
            onSwitchToLogin={() => navigate('/login')}
        />
    );
};

export default SignupPage;
