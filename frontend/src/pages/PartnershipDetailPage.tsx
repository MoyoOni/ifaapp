import React from 'react';
import { useParams } from 'react-router-dom';
import PartnershipDetailView from '@/features/marketplace/partnership-detail-view';

const PartnershipDetailPage: React.FC = () => {
  const { partnershipId } = useParams<{ partnershipId: string }>();

  if (!partnershipId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 my-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg" role="alert">
          Missing partnership ID.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PartnershipDetailView partnershipId={partnershipId} />
    </div>
  );
};

export default PartnershipDetailPage;
