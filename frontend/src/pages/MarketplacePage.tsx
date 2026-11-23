import React from 'react';
import { useNavigate } from 'react-router-dom';
import MarketplaceView from '@/features/marketplace/marketplace-view';
import { navigateWithTransition } from '@/shared/utils/nav-transition';

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
          navigateWithTransition(navigate, `/marketplace/${productId}`, 'push');
        }
      }}
    />
  );
};

export default MarketplacePage;
