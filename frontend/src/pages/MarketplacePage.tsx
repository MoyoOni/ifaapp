import React from 'react';
import { useNavigate } from 'react-router-dom';
import MarketplaceView from '@/features/marketplace/marketplace-view';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MarketplaceView
      onSelectProduct={(productId) => {
        if (productId === 'cart') {
          navigate('/cart');
        } else if (productId === 'my-orders') {
          navigate('/my-orders');
        } else {
          navigate(`/product/${productId}`);
        }
      }}
    />
  );
};

export default MarketplacePage;
