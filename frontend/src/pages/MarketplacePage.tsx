import React from 'react';
import { useNavigate } from 'react-router-dom';
import MarketplaceView from '@/features/marketplace/marketplace-view';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <MarketplaceView
        onSelectProduct={(productId) => {
          if (productId === 'cart') {
            navigate('/cart');
          } else {
            navigate(`/marketplace/${productId}`);
          }
        }}
      />
    </div>
  );
};

export default MarketplacePage;