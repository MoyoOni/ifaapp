import React from 'react';
import { useNavigate } from 'react-router-dom';
import BabalawoGuidancePlansView from '@/features/prescriptions/babalawo-guidance-plans-view';

const GuidancePlansPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <BabalawoGuidancePlansView
        onViewDetails={(guidancePlanId) => navigate(`/guidance-plans/${guidancePlanId}`)}
      />
    </div>
  );
};

export default GuidancePlansPage;
