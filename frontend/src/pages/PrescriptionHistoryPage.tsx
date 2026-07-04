import React from 'react';
import { useNavigate } from 'react-router-dom';
import GuidancePlanHistoryView from '@/features/prescriptions/prescription-history-view';

const PrescriptionHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GuidancePlanHistoryView
      onViewDetails={(guidancePlanId) => navigate(`/guidance-plans/${guidancePlanId}`)}
    />
  );
};

export default PrescriptionHistoryPage;
