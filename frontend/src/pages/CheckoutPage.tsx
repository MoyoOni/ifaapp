import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutView from '@/features/marketplace/checkout-view';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutView
        onBack={() => navigate(-1)}
        onSuccess={() => navigate('/marketplace')}
      />
    </div>
  );
};

export default CheckoutPage;