import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/use-auth';
import BabalawoGuidancePlansView from '@/features/prescriptions/babalawo-guidance-plans-view';
import GuidancePlanHistoryView from '@/features/prescriptions/prescription-history-view';

const GuidancePlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      {user?.role === 'BABALAWO' ? (
        <BabalawoGuidancePlansView
          onViewDetails={(guidancePlanId) => navigate(`/guidance-plans/${guidancePlanId}`)}
        />
      ) : (
        <GuidancePlanHistoryView
          onViewDetails={(guidancePlanId) => navigate(`/guidance-plans/${guidancePlanId}`)}
        />
      )}
    </div>
  );
};

export default GuidancePlansPage;
