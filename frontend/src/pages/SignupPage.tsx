import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/features/auth/register/register-form';
import { useAuth } from '@/shared/hooks/use-auth';
import { getDashboardPathForRole } from '@/shared/config/navigation';
import { UserRole } from '@common';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate(getDashboardPathForRole(user.role), { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <RegisterForm
                selectedRole={UserRole.CLIENT} // Default to Client for generic signup
                onSuccess={() => {
                    navigate('/login');
                }}
                onSwitchToLogin={() => navigate('/login')}
            />
        </div>
    );
};

export default SignupPage;
