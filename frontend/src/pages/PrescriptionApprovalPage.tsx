import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PrescriptionApprovalView from '@/features/prescriptions/prescription-approval-view';

const PrescriptionApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const guidancePlanId = id || searchParams.get('guidancePlanId') || '';

  if (!guidancePlanId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 my-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg" role="alert">
          Missing guidance plan ID.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PrescriptionApprovalView
        guidancePlanId={guidancePlanId}
        onApproved={() => navigate('/prescription-history')}
        onRejected={() => navigate('/prescription-history')}
      />
    </div>
  );
};

export default PrescriptionApprovalPage;