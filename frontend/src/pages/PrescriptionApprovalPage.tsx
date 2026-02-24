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
        <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          Missing guidance plan ID.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PrescriptionApprovalView
        guidancePlanId={guidancePlanId}
        onApproved={() => navigate('/prescriptions/history')}
        onRejected={() => navigate('/prescriptions/history')}
      />
    </div>
  );
};

export default PrescriptionApprovalPage;