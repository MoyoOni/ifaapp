import React from 'react';
import { useParams } from 'react-router-dom';
import BundleDetailView from '@/features/marketplace/bundle-detail-view';

const BundleDetailPage: React.FC = () => {
  const { bundleId } = useParams<{ bundleId: string }>();

  if (!bundleId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 my-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg" role="alert">
          Missing kit ID.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BundleDetailView bundleId={bundleId} />
    </div>
  );
};

export default BundleDetailPage;
