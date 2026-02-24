import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import { getDashboardPathForRole } from '@/shared/config/navigation';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('[Home] Render. User:', user);

  React.useEffect(() => {
    if (user) {
      console.log('[Home] Redirecting to:', getDashboardPathForRole(user.role));
      navigate(getDashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Mock babalawo ID for the booking link
  const mockBabalawoId = 'clx123abc456';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold">Welcome to Ìlú Àṣẹ</h1>
      <p className="mt-4">This is a placeholder home page.</p>
      <div className="mt-8">
        <Link
          to={`/booking/${mockBabalawoId}`}
          className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-800"
          data-testid="book-consultation-link"
        >
          Book a Consultation
        </Link>
      </div>
    </div>
  );
};

export default Home;
